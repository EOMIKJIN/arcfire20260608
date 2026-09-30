// ============================================================
// 사령부 유지비 군수 할인 — 위성 dailyUpkeep 미적용
// ============================================================

import { resolvePlanetMilitaryCommandPolicy } from '../balance/planetMilitaryCommandPolicy';
import { resolvePlanetDevUpkeepEfficiencyDiscountPct } from './planetDevelopmentLevelBenefits';
import {
  applyMilitaryCommandUpkeepLineCreditsWithGlobal,
  resolveMilitaryCommandLogisticsDiscountPct,
} from './militaryCommandMath';

export { resolveMilitaryCommandLogisticsDiscountPct };

/** 전역 유지비 할인이 나중에 한 번 더 곱해지므로, 군수는 합산 캡 잔여분만 */
export function resolveMilitaryCommandUpkeepLineDiscountPct(
  planetId: string,
  level: number,
): number {
  const policy = resolvePlanetMilitaryCommandPolicy();
  const globalPct = resolvePlanetDevUpkeepEfficiencyDiscountPct(planetId);
  const military = resolveMilitaryCommandLogisticsDiscountPct(level);
  const remain = Math.max(0, policy.hqUpkeepJointCapPct - globalPct);
  return Math.min(military, remain);
}

export function applyMilitaryCommandUpkeepLineCredits(
  planetId: string,
  level: number,
  baseCredits: number,
): number {
  return applyMilitaryCommandUpkeepLineCreditsWithGlobal(
    baseCredits,
    level,
    resolvePlanetDevUpkeepEfficiencyDiscountPct(planetId),
  );
}
