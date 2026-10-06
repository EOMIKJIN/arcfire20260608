/**
 * 플레이어가 직접 한 웨이브의 패배 처분.
 * 크림슨 웨이브(분쟁 차례·[전투]·채팅 무장·엔드게임 보스 — 시작 경로 무관) 패배
 *   → 블루·중립이었으면 점유는 크림슨, 기함은 모항.
 * 이미 적 점유지에서 패배 → 점유는 그대로, 기함만 모항.
 * 승리·크림슨 웨이브가 아닌 패배(의뢰 궤도 등)는 이 처분을 쓰지 않는다.
 */
export function resolvePlayerWaveDefeatDisposition(input: {
  outcome: 'win' | 'lose';
  crimsonWave: boolean;
  wasRedOccupied: boolean;
  sunk: boolean;
  /** 45초 미마운트·10분 정체. 싸운 패배가 아니므로 점유·귀환을 하지 않는다. */
  failsafe?: boolean;
}): { occupyCrimson: boolean; sendHome: boolean; destroyShip: boolean } {
  if (input.failsafe) {
    return { occupyCrimson: false, sendHome: false, destroyShip: false };
  }
  const lose = input.outcome === 'lose';
  const occupyCrimson = lose && input.crimsonWave && !input.wasRedOccupied;
  const sendHome = lose && (input.crimsonWave || input.wasRedOccupied);
  return {
    occupyCrimson,
    sendHome,
    destroyShip: sendHome && input.sunk,
  };
}
