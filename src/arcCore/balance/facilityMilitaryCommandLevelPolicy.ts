import { FacilityMilitaryCommandLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { buildFacilityGenericLevelPolicy } from './facilityGenericLevelPolicy';
import { resolvePlanetFacilityUpgradeDurationSec } from './facilityUpgradeDurationPolicy';

const policy = buildFacilityGenericLevelPolicy(FacilityMilitaryCommandLevelPolicy_FROM_BALANCE_CSV);

export const listFacilityMilitaryCommandLevelRows = policy.listRows;
export const getFacilityMilitaryCommandMaxLevel = policy.getMaxLevel;
export const getFacilityMilitaryCommandLevelRow = policy.getLevelRow;
export const resolveMilitaryCommandUpgradeCostCredits = policy.resolveUpgradeCostCredits;
export const resolveMilitaryCommandInstantUpgradeCostCredits = policy.resolveInstantUpgradeCostCredits;

export function resolveMilitaryCommandUpgradeDurationSec(currentLevel: number): number | null {
  return resolvePlanetFacilityUpgradeDurationSec('military_command', currentLevel);
}

export const resolveMilitaryCommandUpgradeRequiredPlayerLevel = policy.resolveUpgradeRequiredPlayerLevel;
export const resolveMilitaryCommandUpgradeRequiredStat = policy.resolveUpgradeRequiredStat;
