// ============================================================
// 인구 거주 돔(dev_population_dome) — v2.0 · 허브 선술집 Lv1 활성
// ============================================================

import {
  getFacilityTavernLevelRow,
  listFacilityTavernLevelRows,
  resolveTavernBountySlots,
  resolveTavernMercTierUnlock,
  resolveTavernRefreshIntervalHours,
  resolveTavernReputationBonusPct,
  getFacilityTavernMaxLevel,
  resolveTavernInstantUpgradeCostCredits,
  resolveTavernUpgradeCostCredits,
  resolveTavernUpgradeDurationSec,
  resolveTavernUpgradeRequiredPlayerLevel,
  resolveTavernUpgradeRequiredStat,
} from '../../arcCore/balance/facilityTavernLevelPolicy';
import { writeFacilityModuleDetail } from './planetFacilityModuleRuntime';
import { createGenericFacilityDevelopment } from './planetGenericFacilityDevelopment';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
} from './planetPopulationDomeListing';

const tavernPolicy = {
  getMaxLevel: getFacilityTavernMaxLevel,
  getLevelRow: getFacilityTavernLevelRow,
  listRows: listFacilityTavernLevelRows,
  resolveUpgradeCostCredits: resolveTavernUpgradeCostCredits,
  resolveInstantUpgradeCostCredits: resolveTavernInstantUpgradeCostCredits,
  resolveUpgradeDurationSec: resolveTavernUpgradeDurationSec,
  resolveUpgradeRequiredPlayerLevel: resolveTavernUpgradeRequiredPlayerLevel,
  resolveUpgradeRequiredStat: resolveTavernUpgradeRequiredStat,
};

function syncTavernFacilityMeta(planetId: string, level: number): void {
  const prev = readPlanetPopulationDomeDetail(planetId);
  writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_POPULATION_DOME, {
    ...prev,
    version: 1,
    activeBountyCount: resolveTavernBountySlots(level),
    lastBountyRefreshTimestamp: Date.now(),
    updatedAtMs: Date.now(),
  });
}

const api = createGenericFacilityDevelopment({
  moduleId: PLANET_DEV_MODULE_POPULATION_DOME,
  facilityType: 'tavern',
  policy: tavernPolicy,
  i18nPrefix: 'populationDomeDev',
  onLevelApplied: syncTavernFacilityMeta,
});

export {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
  resolveTavernBountySlots,
  resolveTavernReputationBonusPct,
  resolveTavernMercTierUnlock,
  resolveTavernRefreshIntervalHours,
  getFacilityTavernLevelRow,
  listFacilityTavernLevelRows,
};

export const buildTavernFacilityDevSnapshot = api.buildSnapshot;
export const installPlanetTavernFacility = api.install;
export const startPlanetTavernFacilityUpgrade = api.startUpgrade;
export const tryCompleteTavernFacilityUpgrade = api.tryCompleteUpgrade;
export const instantCompleteTavernFacilityUpgrade = api.instantCompleteUpgrade;
export const instantUpgradeTavernFacilityNext = api.instantUpgradeNext;
export const formatTavernFacilityDurationLabel = api.formatDurationLabel;
export const getTavernFacilityLevelStatRow = api.getLevelRow;
