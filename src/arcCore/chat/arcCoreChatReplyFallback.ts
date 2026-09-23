/** 로컬/클라우드가 공문장을 주면 last-resort. 새 템플릿·지능 아님. */

export function resolveArcCoreChatReplyOrLastResort(text: string, lastResort: string): string {
  const trimmed = (text ?? '').trim();
  if (trimmed) return trimmed;
  const fallback = (lastResort ?? '').trim();
  return fallback;
}
