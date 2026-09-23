import { invokeArcCoreChatLlm, type InvokeLlmFn } from './llmInvoke';
import {
  buildArcCoreChatPrompt,
  extractAskedQuestion,
  MAX_PACK_CHARS,
  validateArcCoreChatPack,
} from './pack';
import { quarantineArcCoreChatServerReply, sanitizeAskedQuestion } from './quarantine';
import { verifyFirebaseIdToken } from './verifyFirebaseJwt';

/** uid당 분당 POST 전체. 플레이어 전송과 inbound 수락이 같은 카운터를 쓴다. */
const QUOTA_PER_MIN = 8;
const QUOTA_UID_CAP = 2000;

export const ARC_CORE_CHAT_CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export type ArcCoreChatHttpEvent = {
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
  httpMethod?: string;
  requestContext?: { http?: { method?: string } };
};

export type ArcCoreChatTurnResponse = {
  text?: string;
  fallback?: boolean;
  reason?: string;
  topicIds?: string[];
  askedQuestion?: string;
};

export type ArcCoreChatTurnDeps = {
  verifyIdToken?: (token: string) => Promise<string | null>;
  invokeLlm?: InvokeLlmFn;
};

type QuotaRow = { windowStart: number; count: number };
const quotaByUid = new Map<string, QuotaRow>();

function header(event: ArcCoreChatHttpEvent, name: string): string {
  const headers = event.headers ?? {};
  const want = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === want) return String(headers[key] ?? '').trim();
  }
  return '';
}

export function readEventMethod(event: ArcCoreChatHttpEvent): string {
  const fromHttp = event.requestContext?.http?.method?.trim();
  if (fromHttp) return fromHttp.toUpperCase();
  const legacy = event.httpMethod?.trim();
  return legacy ? legacy.toUpperCase() : 'POST';
}

function readBearer(event: ArcCoreChatHttpEvent): string {
  const raw = header(event, 'authorization');
  if (raw.toLowerCase().startsWith('bearer ')) return raw.slice(7).trim();
  return raw;
}

function takeQuota(uid: string): boolean {
  const now = Date.now();
  const row = quotaByUid.get(uid);
  if (!row || now - row.windowStart >= 60_000) {
    if (quotaByUid.size >= QUOTA_UID_CAP && !row) {
      const first = quotaByUid.keys().next().value;
      if (first) quotaByUid.delete(first);
    }
    quotaByUid.set(uid, { windowStart: now, count: 1 });
    return true;
  }
  if (row.count >= QUOTA_PER_MIN) return false;
  row.count += 1;
  return true;
}

function readBody(event: ArcCoreChatHttpEvent): unknown {
  const raw = event.body ?? '';
  if (!raw) return null;
  const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function packFromBody(json: unknown): unknown {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: unknown };
  return o.data !== undefined ? o.data : json;
}

function unwrapSpokenModelText(raw: string): string {
  const t = String(raw ?? '').trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return t;
  try {
    const parsed = JSON.parse(t) as Record<string, unknown>;
    for (const key of ['text', 'reply', 'message', 'content', 'speech']) {
      const v = parsed[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  } catch {
    /* keep raw */
  }
  return t;
}

/** Firebase ID 토큰 실서명 검증 후에만 LLM. 위조 Bearer로는 호출하지 않는다. ZERO_BILL 기본=Groq. */
export async function handleArcCoreChatTurn(
  event: ArcCoreChatHttpEvent,
  deps?: ArcCoreChatTurnDeps,
): Promise<ArcCoreChatTurnResponse> {
  const token = readBearer(event);
  if (!token) return { fallback: true, reason: 'unauthenticated' };
  const verify = deps?.verifyIdToken ?? verifyFirebaseIdToken;
  const uid = await verify(token);
  if (!uid) return { fallback: true, reason: 'unauthenticated' };
  if (!takeQuota(uid)) return { fallback: true, reason: 'quota' };

  const json = readBody(event);
  const packed = JSON.stringify(json ?? {});
  if (packed.length > MAX_PACK_CHARS) return { fallback: true, reason: 'pack_too_large' };

  const pack = validateArcCoreChatPack(packFromBody(json));
  if (!pack) return { fallback: true, reason: 'bad_pack' };

  const prompt = buildArcCoreChatPrompt(pack);
  const invoke = deps?.invokeLlm ?? invokeArcCoreChatLlm;
  try {
    const llm = await invoke(prompt.system, prompt.user);
    if (!llm.ok) {
      // rate_limit → 클라 free_tier_exhausted. no_key는 배포/키 누락. 그 외 no_model.
      const reason =
        llm.reason === 'rate_limit'
          ? 'rate_limit'
          : llm.reason === 'no_key'
            ? 'no_key'
            : 'no_model';
      return { fallback: true, reason };
    }
    const spoken = unwrapSpokenModelText(llm.text);
    let text = quarantineArcCoreChatServerReply(spoken, {
      maxChars: pack.policy.maxChars,
      revealShadow: pack.policy.revealShadow,
    });
    // 검역이 형식만 버린 경우 — 짧은 구어 본문은 소프트 수용 (템플릿 폴백 방지)
    if (!text) {
      const soft = spoken.slice(0, Math.max(1, pack.policy.maxChars));
      if (soft && !/^\s*(\{|\[|```)/.test(soft)) {
        text = soft;
      }
    }
    if (!text) return { fallback: true, reason: 'quarantine' };
    const askedQuestion = sanitizeAskedQuestion(
      extractAskedQuestion(text),
      pack.policy.revealShadow,
    );
    return {
      text,
      // 모델이 주제를 창작하지 못하게 팩 스택만 에코한다.
      topicIds: pack.topicStack,
      askedQuestion: askedQuestion || undefined,
    };
  } catch {
    return { fallback: true, reason: 'no_model' };
  }
}

export async function handler(event: ArcCoreChatHttpEvent): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  if (readEventMethod(event) === 'OPTIONS') {
    return { statusCode: 204, headers: ARC_CORE_CHAT_CORS_HEADERS, body: '' };
  }
  const result = await handleArcCoreChatTurn(event);
  // 운영 진단 — 민감정보 없이 실패 축만 (키·본문 금지)
  console.log(
    JSON.stringify({
      arcCoreChatTurn: result.fallback ? result.reason ?? 'fallback' : 'ok',
      textLen: typeof result.text === 'string' ? result.text.length : 0,
      provider: process.env.ARC_CORE_CHAT_LLM_PROVIDER || 'groq',
      hasKey: Boolean(
        (process.env.ARC_CORE_CHAT_GROQ_API_KEY || process.env.GROQ_API_KEY || '').trim(),
      ),
    }),
  );
  return {
    statusCode: 200,
    headers: ARC_CORE_CHAT_CORS_HEADERS,
    body: JSON.stringify(result),
  };
}
