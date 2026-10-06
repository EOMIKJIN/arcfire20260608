/** persist/hydrate 경합 — purge 중·이전 세대 디스크 커밋 차단. */

export function canCommitArcCoreChatDiskWrite(
  writeEpoch: number,
  currentEpoch: number,
  resetInFlight: boolean,
): boolean {
  return !resetInFlight && writeEpoch === currentEpoch;
}

/** hydrate 전 persist 는 디스크 대화를 빈 값으로 덮는다 — 쓰기 자체를 건너뛴다. */
export function canPersistArcCoreChat(
  hydrated: boolean,
  writeEpoch: number,
  currentEpoch: number,
  resetInFlight: boolean,
): boolean {
  return hydrated && canCommitArcCoreChatDiskWrite(writeEpoch, currentEpoch, resetInFlight);
}
