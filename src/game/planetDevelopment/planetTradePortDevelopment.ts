// ============================================================
// 무역소(dev_trade_port) — v2.0 facility_trade_port_level_policy
// ============================================================

import {
  getFacilityTradePortLevelRow,
  listFacilityTradePortLevelRows,
  resolveTradePortFeeRatePct,
  resolveTradePortStockLimit,
  resolveTradePortSupplyStockScale,
  resolveTradePortHighGradeWeaponWeightBonus,
  getFacilityTradePortMaxLevel,
  resolveTradePortInstantUpgradeCostCredits,
  resolveTradePortUpgradeCostCredits,
  resolveTradePortUpgradeDurationSec,
  resolveTradePortUpgradeRequiredPlayerLevel,
  resolveTradePortUpgradeRequiredStat,
} from '../../arcCore/balance/facilityTradePortLevelPolicy';
import { createGenericFacilityDevelopment } from './planetGenericFacilityDevelopment';
import { PLANET_DEV_MODULE_TRADE_PORT, isPlanetTradePortInstalled, readPlanetTradePortDetail } from './planetTradePortListing';
import { activateSynthFrontierConvoyTrade } from '../../arcCore/economy/synthFrontierConvoyTradeBridge';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';

const tradePortPolicy = {
  getMaxLevel: getFacilityTradePortMaxLevel,
  getLevelRow: getFacilityTradePortLevelRow,
  listRows: listFacilityTradePortLevelRows,
  resolveUpgradeCostCredits: resolveTradePortUpgradeCostCredits,
  resolveInstantUpgradeCostCredits: resolveTradePortInstantUpgradeCostCredits,
  resolveUpgradeDurationSec: resolveTradePortUpgradeDurationSec,
  resolveUpgradeRequiredPlayerLevel: resolveTradePortUpgradeRequiredPlayerLevel,
  resolveUpgradeRequiredStat: resolveTradePortUpgradeRequiredStat,
};

function syncTradeAfterChange(planetId: string, level: number): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncTradePortCatalogForPlanet } = require('../../arcCore/balance/tradePortCatalogPolicy') as typeof import('../../arcCore/balance/tradePortCatalogPolicy');
    syncTradePortCatalogForPlanet(planetId);
  } catch {
    /* optional */
  }
  if (level >= 1 && isSynthFrontierPlanetId(planetId)) {
    activateSynthFrontierConvoyTrade(planetId);
  }
}

const api = createGenericFacilityDevelopment({
  moduleId: PLANET_DEV_MODULE_TRADE_PORT,
  facilityType: 'trade_port',
  policy: tradePortPolicy,
  i18nPrefix: 'tradePortDev',
  onLevelApplied: syncTradeAfterChange,
});

export {
  PLANET_DEV_MODULE_TRADE_PORT,
  isPlanetTradePortInstalled,
  readPlanetTradePortDetail,
  resolveTradePortFeeRatePct,
  resolveTradePortStockLimit,
  resolveTradePortSupplyStockScale,
  resolveTradePortHighGradeWeaponWeightBonus,
  getFacilityTradePortLevelRow,
  listFacilityTradePortLevelRows,
};

export const buildTradePortDevSnapshot = api.buildSnapshot;

export const installPlanetTradePort = api.install;

export const startPlanetTradePortUpgrade = api.startUpgrade;
export const tryCompleteTradePortUpgrade = api.tryCompleteUpgrade;
export const instantCompleteTradePortUpgrade = api.instantCompleteUpgrade;
export const instantUpgradeTradePortNext = api.instantUpgradeNext;
export const formatTradePortDurationLabel = api.formatDurationLabel;
export const getTradePortLevelStatRow = api.getLevelRow;
