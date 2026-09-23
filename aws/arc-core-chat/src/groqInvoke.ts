import { MAX_REPLY_CHARS } from './pack';

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GroqChatBody = {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  max_completion_tokens: number;
  temperature: number;
  reasoning_effort?: 'low' | 'medium' | 'high';
  reasoning_format?: 'raw' | 'parsed' | 'hidden';
};

export type GroqInvokeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'no_key' | 'rate_limit' | 'upstream' };

/** gpt-oss 계열은 추론 모델 — 숨은 사고 토큰이 응답 예산을 먹어 간헐적으로 빈 응답(no_model)을 냄. */
const REASONING_MODEL_RE = /gpt-oss/i;

export function buildGroqChatBody(system: string, user: string, model: string): GroqChatBody {
  const body: GroqChatBody = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_completion_tokens: 768,
    temperature: 0.7,
  };
  if (REASONING_MODEL_RE.test(model)) {
    // 사고 과정 최소화 + 최종 답만 수신 — content에 <think>가 섞여 빈 응답/유출로 이어지는 걸 막는다.
    body.reasoning_effort = 'low';
    body.reasoning_format = 'hidden';
  }
  return body;
}

export function extractGroqChatText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const choices = (json as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';
  const raw = choices[0]?.message?.content;
  let content = '';
  if (typeof raw === 'string') {
    content = raw;
  } else if (Array.isArray(raw)) {
    // 일부 모델이 content parts 배열로 돌려줌
    for (let i = 0; i < raw.length; i += 1) {
      const part = raw[i];
      if (typeof part === 'string') content += part;
      else if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
        content += (part as { text: string }).text;
      }
    }
  }
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return content.slice(0, MAX_REPLY_CHARS);
}

export function readGroqApiKey(): string {
  return (
    process.env.ARC_CORE_CHAT_GROQ_API_KEY?.trim()
    || process.env.GROQ_API_KEY?.trim()
    || ''
  );
}

export function readGroqModel(): string {
  return process.env.ARC_CORE_CHAT_GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

/** Groq Free OpenAI-compatible chat. 429 → rate_limit. */
export async function invokeGroqChat(system: string, user: string): Promise<GroqInvokeResult> {
  const apiKey = readGroqApiKey();
  if (!apiKey) return { ok: false, reason: 'no_key' };
  const model = readGroqModel();
  const body = JSON.stringify(buildGroqChatBody(system, user, model));
  const timeoutMs = Math.max(
    1000,
    Number(process.env.ARC_CORE_CHAT_GROQ_TIMEOUT_MS) || 10_000,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(DEFAULT_GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: controller.signal,
    });
    if (res.status === 429) return { ok: false, reason: 'rate_limit' };
    if (!res.ok) return { ok: false, reason: 'upstream' };
    const text = extractGroqChatText(await res.json());
    if (!text) return { ok: false, reason: 'upstream' };
    return { ok: true, text };
  } catch {
    return { ok: false, reason: 'upstream' };
  } finally {
    clearTimeout(timer);
  }
}
