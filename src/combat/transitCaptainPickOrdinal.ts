// ============================================================
// 같은 성계 재조우 시 적 순환 번호 — 프로세스 메모리만
// 출항 begin 1회. 틱·persist 없음. 성계 수만큼만 키가 는다.
// ============================================================

const lastOrdinalBySystemId = new Map<string, number>();

export function takeTransitCaptainPickOrdinal(systemId: string): number {
  const key = systemId.trim();
  if (!key) return 0;
  const ordinal = lastOrdinalBySystemId.has(key)
    ? (lastOrdinalBySystemId.get(key) ?? 0) + 1
    : 0;
  lastOrdinalBySystemId.set(key, ordinal);
  return ordinal;
}

/** 이번 출항에서 발급한 번호. 아직 출항이 없으면 0. */
export function peekTransitCaptainPickOrdinal(systemId: string): number {
  const key = systemId.trim();
  if (!key) return 0;
  return lastOrdinalBySystemId.get(key) ?? 0;
}
