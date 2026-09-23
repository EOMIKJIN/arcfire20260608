// ============================================================
// 인구 거주 돔(dev_population_dome) — v2.0 · 허브 바 Lv1 활성
// ============================================================

import {
  getFacilityBarLevelRow,
  listFacilityBarLevelRows,
  resolveBarBountySlots,
  resolveBarMercTierUnlock,
  resolveBarRefreshIntervalHours,
  resolveBarReputationBonusPct,
  getFacilityBarMaxLevel,
  resolveBarInstantUpgradeCostCredits,
  resolveBarUpgradeCostCredits,
  resolveBarUpgradeDurationSec,
  resolveBarUpgradeRequiredPlayerLevel,
  resolveBarUpgradeRequiredStat,
} from '../../arcCore/balance/facilityBarLevelPolicy';
import { writeFacilityModuleDetail } from './planetFacilityModuleRuntime';
import { createGenericFacilityDevelopment } from './planetGenericFacilityDevelopment';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
} from './planetPopulationDomeListing';
import {
  rematerializeArcCoreInstanceMissionBoard,
  replenishArcCoreInstanceMissionBoardForPlanet,
} from '../../store/arcCoreInstanceMissionBoardStore';

const barPolicy = {
  getMaxLevel: getFacilityBarMaxLevel,
  getLevelRow: getFacilityBarLevelRow,
  listRows: listFacilityBarLevelRows,
  resolveUpgradeCostCredits: resolveBarUpgradeCostCredits,
  resolveInstantUpgradeCostCredits: resolveBarInstantUpgradeCostCredits,
  resolveUpgradeDurationSec: resolveBarUpgradeDurationSec,
  resolveUpgradeRequiredPlayerLevel: resolveBarUpgradeRequiredPlayerLevel,
  resolveUpgradeRequiredStat: resolveBarUpgradeRequiredStat,
};

function syncBarFacilityMeta(planetId: string, level: number): void {
  const prev = readPlanetPopulationDomeDetail(planetId);
  writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_POPULATION_DOME, {
    ...prev,
    version: 1,
    activeBountyCount: resolveBarBountySlots(level),
    lastBountyRefreshTimestamp: Date.now(),
    updatedAtMs: Date.now(),
  });
  rematerializeArcCoreInstanceMissionBoard();
  replenishArcCoreInstanceMissionBoardForPlanet(planetId);
}

const api = createGenericFacilityDevelopment({
  moduleId: PLANET_DEV_MODULE_POPULATION_DOME,
  facilityType: 'bar',
  policy: barPolicy,
  i18nPrefix: 'populationDomeDev',
  onLevelApplied: syncBarFacilityMeta,
});

export {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
  resolveBarBountySlots,
  resolveBarReputationBonusPct,
  resolveBarMercTierUnlock,
  resolveBarRefreshIntervalHours,
  getFacilityBarLevelRow,
  listFacilityBarLevelRows,
};

export const buildBarFacilityDevSnapshot = api.buildSnapshot;
export const installPlanetBarFacility = api.install;
export const startPlanetBarFacilityUpgrade = api.startUpgrade;
export const tryCompleteBarFacilityUpgrade = api.tryCompleteUpgrade;
export const instantCompleteBarFacilityUpgrade = api.instantCompleteUpgrade;
export const instantUpgradeBarFacilityNext = api.instantUpgradeNext;
export const formatBarFacilityDurationLabel = api.formatDurationLabel;
export const getBarFacilityLevelStatRow = api.getLevelRow;
