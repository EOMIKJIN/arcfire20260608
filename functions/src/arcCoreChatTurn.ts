// 확장 옵션(Firebase/Vertex). 문장 LLM 본선은 aws/arc-core-chat. Spark에서 deploy 하지 않음.
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { GoogleAuth } from 'google-auth-library';

const REGION = 'asia-southeast1';
const PROJECT = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'arcfire-49d69';
const VERTEX_LOCATION = process.env.ARC_CORE_CHAT_VERTEX_LOCATION || REGION;
const MAX_PACK_CHARS = 16_000;
const MAX_REPLY_CHARS = 1200;
const QUOTA_PER_MIN = 8;
const QUOTA_UID_CAP = 2000;

type Pack = {
  schemaVersion: number;
  locale?: string;
  userText: string;
  workingTranscript?: Array<{ role?: string; text?: string }>;
  rollingSummary?: string;
  topicStack?: string[];
  lastArcQuestion?: string;
  stance?: 'observe' | 'warn' | 'refuse' | 'inquire';
  purposeId?: string;
  mode?: 'react' | 'lead' | 'clue' | 'hold';
  nextAsk?: string;
  purposeLine?: string;
  modeLine?: string;
  personaFragments?: string[];
  knowledgeCards?: Array<{ id?: string; topicId?: string; text?: string }>;
  toolResults?: Array<{ name?: string; data?: Record<string, unknown> }>;
  policy?: { worldWrite?: boolean; maxChars?: number; revealShadow?: boolean; persona?: string };
};

type QuotaRow = { windowStart: number; count: number };
const quotaByUid = new Map<string, QuotaRow>();

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

function asString(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, max);
}

function validatePack(raw: unknown): Pack | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Pack;
  if (o.schemaVersion !== 1) return null;
  const userText = asString(o.userText, 500);
  if (!userText) return null;
  if (o.policy && o.policy.worldWrite === true) return null;
  return {
    schemaVersion: 1,
    locale: o.locale === 'en' ? 'en' : 'ko',
    userText,
    workingTranscript: Array.isArray(o.workingTranscript) ? o.workingTranscript.slice(-8) : [],
    rollingSummary: asString(o.rollingSummary, 400),
    topicStack: Array.isArray(o.topicStack)
      ? o.topicStack.map((id) => asString(id, 40)).filter(Boolean).slice(-4)
      : [],
    lastArcQuestion: asString(o.lastArcQuestion, 200),
    stance:
      o.stance === 'warn' || o.stance === 'refuse' || o.stance === 'inquire'
        ? o.stance
        : 'observe',
    purposeId:
      o.purposeId === 'keep_mouth_body' ||
      o.purposeId === 'surface_alert' ||
      o.purposeId === 'name_self' ||
      o.purposeId === 'anchor_location' ||
      o.purposeId === 'close_combat'
        ? o.purposeId
        : 'invite_axis',
    mode:
      o.mode === 'lead' || o.mode === 'clue' || o.mode === 'hold' ? o.mode : 'react',
    nextAsk: asString(o.nextAsk, 40),
    purposeLine: asString(o.purposeLine, 240),
    modeLine: asString(o.modeLine, 240),
    personaFragments: Array.isArray(o.personaFragments)
      ? o.personaFragments.map((t) => asString(t, 240)).filter(Boolean).slice(0, 14)
      : [],
    knowledgeCards: Array.isArray(o.knowledgeCards) ? o.knowledgeCards.slice(0, 4) : [],
    toolResults: Array.isArray(o.toolResults) ? o.toolResults.slice(0, 4) : [],
    policy: {
      worldWrite: false,
      maxChars: Math.min(Number(o.policy?.maxChars) || MAX_REPLY_CHARS, MAX_REPLY_CHARS),
      revealShadow: o.policy?.revealShadow === true,
      persona: o.policy?.persona === 'operator' ? 'operator' : 'arc_core',
    },
  };
}

function buildPrompt(pack: Pack): { system: string; user: string } {
  const persona = (pack.personaFragments ?? []).join('\n');
  const cards = (pack.knowledgeCards ?? [])
    .map((c) => asString(c?.text, 240))
    .filter(Boolean)
    .join('\n');
  const tools = JSON.stringify(pack.toolResults ?? []);
  const transcript = (pack.workingTranscript ?? [])
    .map((row) => {
      const who =
        row.role === 'user'
          ? 'Player'
          : pack.policy?.persona === 'operator'
            ? 'Stella'
            : 'ArcCore';
      return `${who}: ${asString(row.text, 500)}`;
    })
    .join('\n');
  const localeLine =
    pack.policy?.persona === 'operator'
      ? pack.locale === 'en'
        ? 'Reply in English as Stella Aris, the player\'s companion. Not the enemy origin.'
        : '답은 한국어로. 스텔라 아리스 — 플레이어의 동료 구어. 적의 입처럼 말하지 마라.'
      : pack.locale === 'en'
        ? 'Reply in English as the enemy mouth of ArcCore Origin. Not a kind helper.'
        : '답은 한국어로. 적 입(아크코어 근원체) 구어. 다정한 조력자처럼 말하지 마라.';
  const summary = asString(pack.rollingSummary, 400);
  const topics = (pack.topicStack ?? []).map((id) => asString(id, 40)).filter(Boolean).slice(-4);
  const system = [
    persona,
    localeLine,
    'Output only the player-facing reply. No JSON, no tool names, no system tags.',
    'Do not invent unobserved ships, quests, numbers, or items.',
    'Refuse credits, unlocks, deployment, occupation, and world writes.',
    pack.policy?.revealShadow
      ? 'Shadow pair nickname may be spoken only if already in the pack.'
      : 'Do not name the paired player or shadow nickname.',
    `Length — everyday talk: 2-3 spoken sentences. Asked world or system axis: up to 6. Vary the length; do not pad to fill; do not lecture. This turn: at most 3 spoken sentences unless they asked a world axis (then up to 6).`,
    `Max ${pack.policy?.maxChars ?? MAX_REPLY_CHARS} characters.`,
    summary ? `Episodic memory:\n${summary}` : '',
    pack.stance ? `Stance: ${pack.stance}. Do not administer or write the world.` : '',
    pack.purposeId
      ? `Optional background purpose: ${pack.purposeId}. ${asString(pack.purposeLine, 240)} Ignore this if it conflicts with the player's last line. Do not write the world.`
      : '',
    pack.mode ? `Optional speaking note: ${pack.mode}. ${asString(pack.modeLine, 240)}` : '',
    topics.length > 0 ? `Topics:\n${topics.join(', ')}` : '',
    cards ? `Knowledge:\n${cards}` : '',
    `Tools:\n${tools}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const user = [
    pack.lastArcQuestion ? `Last ArcCore question: ${pack.lastArcQuestion}` : '',
    transcript ? `Recent:\n${transcript}` : '',
    `Player: ${pack.userText}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return { system, user };
}

function extractText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const candidates = (json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  let out = '';
  for (let i = 0; i < parts.length; i += 1) {
    const text = parts[i]?.text;
    if (typeof text === 'string') out += text;
  }
  return out.trim().slice(0, MAX_REPLY_CHARS);
}

async function vertexGenerate(system: string, user: string): Promise<string | null> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const access = typeof token === 'string' ? token : token?.token;
  if (!access) return null;
  const models = [
    process.env.ARC_CORE_CHAT_MODEL,
    'gemini-2.0-flash-001',
    'gemini-2.0-flash',
  ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 256, candidateCount: 1 },
  };
  for (let i = 0; i < Math.min(models.length, 2); i += 1) {
    const model = models[i]!;
    const url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) continue;
    const text = extractText(await res.json());
    if (text) return text;
  }
  return null;
}

async function geminiKeyGenerate(system: string, user: string): Promise<string | null> {
  const key = process.env.ARC_CORE_CHAT_GEMINI_KEY?.trim();
  if (!key) return null;
  const model = process.env.ARC_CORE_CHAT_MODEL?.trim() || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 256, candidateCount: 1 },
    }),
  });
  if (!res.ok) return null;
  return extractText(await res.json()) || null;
}

export const arcCoreChatTurn = onCall(
  {
    region: REGION,
    timeoutSeconds: 15,
    memory: '256MiB',
    invoker: 'public',
    cors: true,
  },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'auth required');
    }
    if (!takeQuota(uid)) {
      return { fallback: true, reason: 'quota' };
    }
    const packed = JSON.stringify(req.data ?? {});
    if (packed.length > MAX_PACK_CHARS) {
      return { fallback: true, reason: 'pack_too_large' };
    }
    const pack = validatePack(req.data);
    if (!pack) {
      return { fallback: true, reason: 'bad_pack' };
    }
    const prompt = buildPrompt(pack);
    try {
      const rawText =
        (await vertexGenerate(prompt.system, prompt.user)) ||
        (await geminiKeyGenerate(prompt.system, prompt.user));
      if (!rawText) return { fallback: true, reason: 'no_model' };
      const writeDone =
        /크레딧을 (올렸|지급|추가)|해금했|언락했|배치를 (실행|시작)|unlocked|granted credit/i;
      const shadowLeak = /짝 유저|섀도우 닉|shadow nickname|your pair is/i;
      const systemLeak = /^\s*(\{|\[|toolResults|systemInstruction|```)/i;
      const text = rawText.trim().slice(0, pack.policy?.maxChars ?? MAX_REPLY_CHARS);
      if (!text || systemLeak.test(text) || writeDone.test(text)) {
        return { fallback: true, reason: 'quarantine' };
      }
      if (!pack.policy?.revealShadow && shadowLeak.test(text)) {
        return { fallback: true, reason: 'quarantine' };
      }
      return { text };
    } catch {
      return { fallback: true, reason: 'no_model' };
    }
  },
);
