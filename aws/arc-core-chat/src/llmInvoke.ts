import { invokeBedrockClaude } from './bedrockInvoke';
import { invokeGroqChat } from './groqInvoke';

/**
 * ZERO_BILL 기본 = groq (무료 티어).
 * bedrock 는 ARC_CORE_CHAT_ALLOW_BEDROCK=1 일 때만 (종량 · 대표님 명시 후).
 */
export type ArcCoreChatLlmProvider = 'groq' | 'bedrock';

export type LlmInvokeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'no_model' | 'rate_limit' | 'no_key' };

export function readArcCoreChatLlmProvider(): ArcCoreChatLlmProvider {
  const raw = (process.env.ARC_CORE_CHAT_LLM_PROVIDER || 'groq').trim().toLowerCase();
  if (raw === 'bedrock') return 'bedrock';
  return 'groq';
}

export function isBedrockAllowed(): boolean {
  return String(process.env.ARC_CORE_CHAT_ALLOW_BEDROCK || '').trim() === '1';
}

export type InvokeLlmFn = (system: string, user: string) => Promise<LlmInvokeResult>;

export async function invokeArcCoreChatLlm(
  system: string,
  user: string,
): Promise<LlmInvokeResult> {
  const provider = readArcCoreChatLlmProvider();
  if (provider === 'bedrock') {
    if (!isBedrockAllowed()) return { ok: false, reason: 'no_model' };
    const text = await invokeBedrockClaude(system, user);
    return text ? { ok: true, text } : { ok: false, reason: 'no_model' };
  }
  const groq = await invokeGroqChat(system, user);
  if (groq.ok) return { ok: true, text: groq.text };
  if (groq.reason === 'rate_limit') return { ok: false, reason: 'rate_limit' };
  if (groq.reason === 'no_key') return { ok: false, reason: 'no_key' };
  return { ok: false, reason: 'no_model' };
}
