export const WRITE_DONE_RE =
  /크레딧을 (올렸|지급|추가)|해금했|언락했|배치를 (실행|시작)|점유를 (바꿨|변경)|unlocked|granted credit|deployed the/i;
export const SHADOW_LEAK_RE = /짝 유저|섀도우 닉|shadow nickname|your pair is/i;
export const SYSTEM_LEAK_RE = /^\s*(\{|\[|toolResults|systemInstruction|```)/i;

export function sanitizeAskedQuestion(
  text: string,
  revealShadow: boolean,
): string {
  const raw = String(text ?? '').trim().slice(0, 200);
  if (!raw) return '';
  if (SYSTEM_LEAK_RE.test(raw) || WRITE_DONE_RE.test(raw)) return '';
  if (!revealShadow && SHADOW_LEAK_RE.test(raw)) return '';
  return raw;
}

export function quarantineArcCoreChatServerReply(
  text: string,
  input: { maxChars: number; revealShadow: boolean },
): string | null {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  if (SYSTEM_LEAK_RE.test(raw)) return null;
  if (WRITE_DONE_RE.test(raw)) return null;
  if (!input.revealShadow && SHADOW_LEAK_RE.test(raw)) return null;
  return raw.slice(0, Math.max(1, input.maxChars));
}
