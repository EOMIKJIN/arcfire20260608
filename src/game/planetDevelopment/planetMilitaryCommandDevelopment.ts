// ============================================================
// 군사령부(dev_military_command) — 교리·군수·스탯 오프셋. 위성 경로 미경유
// ============================================================

import {
  getFacilityMilitaryCommandLevelRow,
  listFacilityMilitaryCommandLevelRows,
  getFacilityMilitaryCommandMaxLevel,
  resolveMilitaryCommandInstantUpgradeCostCredits,
  resolveMilitaryCommandUpgradeCostCredits,
  resolveMilitaryCommandUpgradeDurationSec,
  resolveMilitaryCommandUpgradeRequiredPlayerLevel,
  resolveMilitaryCommandUpgradeRequiredStat,
} from '../../arcCore/balance/facilityMilitaryCommandLevelPolicy';
import { createGenericFacilityDevelopment } from './planetGenericFacilityDevelopment';
import {
  PLANET_DEV_MODULE_MILITARY_COMMAND,
  isPlanetMilitaryCommandInstalled,
  readPlanetMilitaryCommandDetail,
  resolvePlanetMilitaryCommandLevel,
} from './planetMilitaryCommandListing';

const hqPolicy = {
  getMaxLevel: getFacilityMilitaryCommandMaxLevel,
  getLevelRow: getFacilityMilitaryCommandLevelRow,
  listRows: listFacilityMilitaryCommandLevelRows,
  resolveUpgradeCostCredits: resolveMilitaryCommandUpgradeCostCredits,
  resolveInstantUpgradeCostCredits: resolveMilitaryCommandInstantUpgradeCostCredits,
  resolveUpgradeDurationSec: resolveMilitaryCommandUpgradeDurationSec,
  resolveUpgradeRequiredPlayerLevel: resolveMilitaryCommandUpgradeRequiredPlayerLevel,
  resolveUpgradeRequiredStat: resolveMilitaryCommandUpgradeRequiredStat,
};

const api = createGenericFacilityDevelopment({
  moduleId: PLANET_DEV_MODULE_MILITARY_COMMAND,
  facilityType: 'military_command',
  policy: hqPolicy,
  i18nPrefix: 'militaryCommandDev',
});

export {
  PLANET_DEV_MODULE_MILITARY_COMMAND,
  isPlanetMilitaryCommandInstalled,
  readPlanetMilitaryCommandDetail,
  resolvePlanetMilitaryCommandLevel,
  getFacilityMilitaryCommandLevelRow,
  listFacilityMilitaryCommandLevelRows,
};

export const buildMilitaryCommandDevSnapshot = api.buildSnapshot;
export const installPlanetMilitaryCommand = api.install;
export const startPlanetMilitaryCommandUpgrade = api.startUpgrade;
export const tryCompleteMilitaryCommandUpgrade = api.tryCompleteUpgrade;
export const instantCompleteMilitaryCommandUpgrade = api.instantCompleteUpgrade;
export const instantUpgradeMilitaryCommandNext = api.instantUpgradeNext;
export const formatMilitaryCommandDurationLabel = api.formatDurationLabel;
export const getMilitaryCommandLevelStatRow = api.getLevelRow;
