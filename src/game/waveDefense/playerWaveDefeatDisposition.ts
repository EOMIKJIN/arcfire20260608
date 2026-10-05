/**
 * 플레이어가 직접 한 웨이브의 패배 처분.
 * 크림슨 공격(분쟁 차례) 패배 → 점유는 크림슨, 기함은 모항.
 * 이미 적 점유지에서 패배 → 점유는 그대로, 기함만 모항.
 * 승리·그 외 패배(의뢰 궤도 등)는 이 처분을 쓰지 않는다.
 */
export function resolvePlayerWaveDefeatDisposition(input: {
  outcome: 'win' | 'lose';
  territorialAttack: boolean;
  wasRedOccupied: boolean;
  sunk: boolean;
}): { occupyCrimson: boolean; sendHome: boolean; destroyShip: boolean } {
  const lose = input.outcome === 'lose';
  const occupyCrimson = lose && input.territorialAttack && !input.wasRedOccupied;
  const sendHome = lose && (input.territorialAttack || input.wasRedOccupied);
  return {
    occupyCrimson,
    sendHome,
    destroyShip: sendHome && input.sunk,
  };
}
