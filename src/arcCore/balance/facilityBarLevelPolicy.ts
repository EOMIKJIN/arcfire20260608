import { FacilityBarLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { buildFacilityGenericLevelPolicy } from './facilityGenericLevelPolicy';
import { resolvePlanetFacilityUpgradeDurationSec } from './facilityUpgradeDurationPolicy';

const policy = buildFacilityGenericLevelPolicy(FacilityBarLevelPolicy_FROM_BALANCE_CSV);

export const listFacilityBarLevelRows = policy.listRows;
export const getFacilityBarMaxLevel = policy.getMaxLevel;
export const getFacilityBarLevelRow = policy.getLevelRow;
export const resolveBarUpgradeCostCredits = policy.resolveUpgradeCostCredits;
export const resolveBarInstantUpgradeCostCredits = policy.resolveInstantUpgradeCostCredits;

export function resolveBarUpgradeDurationSec(currentLevel: number): number | null {
  return resolvePlanetFacilityUpgradeDurationSec('bar', currentLevel);
}

export const resolveBarUpgradeRequiredPlayerLevel = policy.resolveUpgradeRequiredPlayerLevel;
export const resolveBarUpgradeRequiredStat = policy.resolveUpgradeRequiredStat;

export function resolveBarBountySlots(level: number): number {
  const n = policy.getLevelRow(level)?.extras.barBountySlots;
  return Math.max(0, Math.floor(Number(n) || 0));
}

export function resolveBarReputationBonusPct(level: number): number {
  const n = policy.getLevelRow(level)?.extras.barReputationBonusPct;
  return Math.max(0, Number(n) || 0);
}

export function resolveBarMercTierUnlock(level: number): string {
  return String(policy.getLevelRow(level)?.extras.barMercTierUnlock ?? 'standard');
}

export function resolveBarRefreshIntervalHours(level: number): number {
  const n = policy.getLevelRow(level)?.extras.barRefreshIntervalHours;
  return Math.max(1, Math.floor(Number(n) || 24));
}
