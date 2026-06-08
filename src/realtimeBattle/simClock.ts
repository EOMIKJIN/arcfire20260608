// ============================================================
// 실시간 전투 — 고정 Δt accumulator (60Hz 시뮬 + 가변 렌더)
// ============================================================

import { BATTLE_FIXED_DT_MS, BATTLE_MAX_SIM_STEPS_PER_FRAME } from './battleConstants';

export type BattleSimStepFn = (dtMs: number) => void;

/**
 * 가변 프레임 시간 elapsedMs 를 고정 스텝으로 소비.
 * @returns 남은 accumulator (ms) — 다음 프레임에 이월
 */
export function consumeBattleSimAccumulator(
  accumulatorMs: number,
  elapsedMs: number,
  step: BattleSimStepFn,
  fixedDtMs: number = BATTLE_FIXED_DT_MS,
  maxSteps: number = BATTLE_MAX_SIM_STEPS_PER_FRAME,
): number {
  let acc = accumulatorMs + elapsedMs;
  let steps = 0;
  while (acc >= fixedDtMs && steps < maxSteps) {
    step(fixedDtMs);
    acc -= fixedDtMs;
    steps++;
  }
  return acc;
}
