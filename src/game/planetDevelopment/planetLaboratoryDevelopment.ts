// ============================================================
// 과학 연구소(dev_research_lab) — v2.0 · 허브 연구소(skilltree) Lv1 활성
// ============================================================

import {
  getFacilityLaboratoryLevelRow,
  listFacilityLaboratoryLevelRows,
  resolveLaboratoryEnvRegenPctDaily,
  resolveLaboratoryEquipmentTierUnlock,
  resolveLaboratoryRdSpeedReductionPct,
  resolveLaboratorySpyDetectBonusPct,
  resolveLaboratoryAntiTerrorMitigationPct,
  resolveLaboratoryDroneInterceptBonusPct,
  getFacilityLaboratoryMaxLevel,
  resolveLaboratoryInstantUpgradeCostCredits,
  resolveLaboratoryUpgradeCostCredits,
  resolveLaboratoryUpgradeDurationSec,
  resolveLaboratoryUpgradeRequiredPlayerLevel,
  resolveLaboratoryUpgradeRequiredStat,
  getEffectiveRdTimeHours,
} from '../../arcCore/balance/facilityLaboratoryLevelPolicy';
import { writeFacilityModuleDetail } from './planetFacilityModuleRuntime';
import { createGenericFacilityDevelopment } from './planetGenericFacilityDevelopment';
import {
  PLANET_DEV_MODULE_RESEARCH_LAB,
  isPlanetResearchLabInstalled,
  readPlanetResearchLabDetail,
} from './planetResearchLabListing';

const labPolicy = {
  getMaxLevel: getFacilityLaboratoryMaxLevel,
  getLevelRow: getFacilityLaboratoryLevelRow,
  listRows: listFacilityLaboratoryLevelRows,
  resolveUpgradeCostCredits: resolveLaboratoryUpgradeCostCredits,
  resolveInstantUpgradeCostCredits: resolveLaboratoryInstantUpgradeCostCredits,
  resolveUpgradeDurationSec: resolveLaboratoryUpgradeDurationSec,
  resolveUpgradeRequiredPlayerLevel: resolveLaboratoryUpgradeRequiredPlayerLevel,
  resolveUpgradeRequiredStat: resolveLaboratoryUpgradeRequiredStat,
};

function cacheLabRdBonus(planetId: string, level: number): void {
  const prev = readPlanetResearchLabDetail(planetId);
  writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_RESEARCH_LAB, {
    ...prev,
    version: 1,
    rdSpeedBonusPct: resolveLaboratoryRdSpeedReductionPct(level),
    updatedAtMs: Date.now(),
  });
}

const api = createGenericFacilityDevelopment({
  moduleId: PLANET_DEV_MODULE_RESEARCH_LAB,
  facilityType: 'laboratory',
  policy: labPolicy,
  i18nPrefix: 'researchLabDev',
  onLevelApplied: cacheLabRdBonus,
});

export {
  PLANET_DEV_MODULE_RESEARCH_LAB,
  isPlanetResearchLabInstalled,
  readPlanetResearchLabDetail,
  resolveLaboratoryRdSpeedReductionPct,
  resolveLaboratoryEquipmentTierUnlock,
  resolveLaboratoryEnvRegenPctDaily,
  getEffectiveRdTimeHours,
  resolveLaboratorySpyDetectBonusPct,
  resolveLaboratoryAntiTerrorMitigationPct,
  resolveLaboratoryDroneInterceptBonusPct,
  getFacilityLaboratoryLevelRow,
  listFacilityLaboratoryLevelRows,
};

export const buildLaboratoryDevSnapshot = api.buildSnapshot;
export const installPlanetLaboratory = api.install;
export const startPlanetLaboratoryUpgrade = api.startUpgrade;
export const tryCompleteLaboratoryUpgrade = api.tryCompleteUpgrade;
export const instantCompleteLaboratoryUpgrade = api.instantCompleteUpgrade;
export const instantUpgradeLaboratoryNext = api.instantUpgradeNext;
export const formatLaboratoryDurationLabel = api.formatDurationLabel;
export const getLaboratoryLevelStatRow = api.getLevelRow;
