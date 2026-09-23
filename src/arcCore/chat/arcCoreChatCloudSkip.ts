// 하드 실패만 10분. abort·네트워크는 짧은 쿨다운 — 한 번 끊겼다고 LLM이 죽은 것처럼 보지 않는다.

export const ARC_CORE_CHAT_CLOUD_HARD_SKIP_MS = 10 * 60 * 1000;
export const ARC_CORE_CHAT_CLOUD_TRANSIENT_SKIP_MS = 3_000;

let skipCloudUntilMs = 0;

export function isArcCoreChatCloudSkipped(nowMs = Date.now()): boolean {
  return nowMs < skipCloudUntilMs;
}

export function markArcCoreChatCloudHardSkip(nowMs = Date.now()): void {
  skipCloudUntilMs = nowMs + ARC_CORE_CHAT_CLOUD_HARD_SKIP_MS;
}

export function markArcCoreChatCloudTransientSkip(nowMs = Date.now()): void {
  const next = nowMs + ARC_CORE_CHAT_CLOUD_TRANSIENT_SKIP_MS;
  if (next > skipCloudUntilMs) skipCloudUntilMs = next;
}

export function resetArcCoreChatCloudSkip(): void {
  skipCloudUntilMs = 0;
}
