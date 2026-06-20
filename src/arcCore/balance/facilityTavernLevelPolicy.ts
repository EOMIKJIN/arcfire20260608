import { FacilityTavernLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { buildFacilityGenericLevelPolicy } from './facilityGenericLevelPolicy';
import { resolvePlanetFacilityUpgradeDurationSec } from './facilityUpgradeDurationPolicy';

const policy = buildFacilityGenericLevelPolicy(FacilityTavernLevelPolicy_FROM_BALANCE_CSV);

export const listFacilityTavernLevelRows = policy.listRows;
export const getFacilityTavernMaxLevel = policy.getMaxLevel;
export const getFacilityTavernLevelRow = policy.getLevelRow;
export const resolveTavernUpgradeCostCredits = policy.resolveUpgradeCostCredits;
export const resolveTavernInstantUpgradeCostCredits = policy.resolveInstantUpgradeCostCredits;

export function resolveTavernUpgradeDurationSec(currentLevel: number): number | null {
  return resolvePlanetFacilityUpgradeDurationSec('tavern', currentLevel);
}export const resolveTavernUpgradeRequiredPlayerLevel = policy.resolveUpgradeRequiredPlayerLevel;
export const resolveTavernUpgradeRequiredStat = policy.resolveUpgradeRequiredStat;

export function resolveTavernBountySlots(level: number): number {
  const n = policy.getLevelRow(level)?.extras.tavernBountySlots;
  return Math.max(0, Math.floor(Number(n) || 0));
}

export function resolveTavernReputationBonusPct(level: number): number {
  const n = policy.getLevelRow(level)?.extras.tavernReputationBonusPct;
  return Math.max(0, Number(n) || 0);
}

export function resolveTavernMercTierUnlock(level: number): string {
  return String(policy.getLevelRow(level)?.extras.tavernMercTierUnlock ?? 'standard');
}

export function resolveTavernRefreshIntervalHours(level: number): number {
  const n = policy.getLevelRow(level)?.extras.tavernRefreshIntervalHours;
  return Math.max(1, Math.floor(Number(n) || 24));
}
