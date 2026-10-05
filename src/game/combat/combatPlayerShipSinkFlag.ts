/**
 * 기함 격침 pending — RN/store 없음. 전투 루프가 세우고 결과 파이프라인이 소비.
 */

let sinkPending = false;

export function markCombatPlayerShipSinkPending(): void {
  sinkPending = true;
}

export function peekCombatPlayerShipSinkPending(): boolean {
  return sinkPending;
}

export function consumeCombatPlayerShipSinkPending(): boolean {
  const next = sinkPending;
  sinkPending = false;
  return next;
}

/** 새 직접 전투가 시작되면 이전 전투가 남긴 격침은 버린다. */
export function clearCombatPlayerShipSinkPending(): void {
  sinkPending = false;
}
