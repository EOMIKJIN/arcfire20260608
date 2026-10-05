/**
 * 플레이어가 직접 한 웨이브가 승패의 정본.
 * 자동전투·다른 교전이 남긴 격침은 그 승리에 붙이지 않는다.
 * 할당 없음.
 */

export function isDirectWaveWinLocked(
  pendingOutcome: 'win' | 'lose' | null,
  outcome: 'win' | 'lose' | null,
): boolean {
  return pendingOutcome === 'win' || outcome === 'win';
}

/** 직접 전투가 승리이면 격침 플래그를 파괴로 적용하지 않는다. */
export function shouldApplyShipSinkForDirectCombat(
  outcome: 'win' | 'lose',
  sinkPending: boolean,
): boolean {
  return outcome === 'lose' && sinkPending;
}
