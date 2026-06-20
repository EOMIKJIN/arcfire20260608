import { FacilityTradePortLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { buildFacilityGenericLevelPolicy } from './facilityGenericLevelPolicy';
import { resolvePlanetFacilityUpgradeDurationSec } from './facilityUpgradeDurationPolicy';

const policy = buildFacilityGenericLevelPolicy(FacilityTradePortLevelPolicy_FROM_BALANCE_CSV);

export const listFacilityTradePortLevelRows = policy.listRows;
export const getFacilityTradePortMaxLevel = policy.getMaxLevel;
export const getFacilityTradePortLevelRow = policy.getLevelRow;
export const resolveTradePortUpgradeCostCredits = policy.resolveUpgradeCostCredits;
export const resolveTradePortInstantUpgradeCostCredits = policy.resolveInstantUpgradeCostCredits;

export function resolveTradePortUpgradeDurationSec(currentLevel: number): number | null {
  return resolvePlanetFacilityUpgradeDurationSec('trade_port', currentLevel);
}export const resolveTradePortUpgradeRequiredPlayerLevel = policy.resolveUpgradeRequiredPlayerLevel;
export const resolveTradePortUpgradeRequiredStat = policy.resolveUpgradeRequiredStat;

/** 고급 무기(tradeGradeRank) 진열 가중 보너스(%) — Lv1=0, Lv10=45 */
export function resolveTradePortHighGradeWeaponWeightBonus(level: number): number {
  const n = policy.getLevelRow(level)?.extras.highGradeWeaponWeightBonus;
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.floor(v)));
}

export function resolveTradePortFeeRatePct(level: number): number {
  const n = policy.getLevelRow(level)?.extras.tradeFeeRatePct;
  return Math.max(5, Number(n) || 10);
}

export function resolveTradePortStockLimit(level: number): number {
  const n = policy.getLevelRow(level)?.extras.stockLimit;
  return Math.max(0, Math.floor(Number(n) || 0));
}

export function resolveTradePortSupplyStockScale(level: number): number {
  const n = policy.getLevelRow(level)?.extras.supplyStockScale;
  const v = Number(n) || 1;
  return v >= 1 ? v : 1;
}
