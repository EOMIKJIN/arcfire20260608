/**
 * 전투 최초 종료 순간 — UI(대사·결과·네비) 직전 짧은 홀드.
 * 웨이브 사이 간격(`WAVE_DEFENSE_BETWEEN_WAVE_MS`)과 별개. 기존값 변경 없음.
 */

export const COMBAT_END_HOLD_MS = 800;
/** 베일 fade-in. 홀드 길이 안에 수렴 */
export const COMBAT_END_HOLD_FADE_MS = 560;

export function waitCombatEndHold(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, COMBAT_END_HOLD_MS);
  });
}
