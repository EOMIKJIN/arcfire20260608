/** persist/hydrate 세대 — purge 중·세대 불일치면 디스크 커밋 금지. */

export function canCommitArcCoreChatDiskWrite(
  writeEpoch: number,
  currentEpoch: number,
  resetInFlight: boolean,
): boolean {
  return !resetInFlight && writeEpoch === currentEpoch;
}
