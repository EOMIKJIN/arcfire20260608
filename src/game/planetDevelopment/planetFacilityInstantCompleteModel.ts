// ============================================================
// 행성 시설 즉시완료 견적 — facilityType별 cost/duration 조합
// ============================================================

import { getFacilityLaboratoryLevelRow, resolveLaboratoryUpgradeCostCredits, resolveLaboratoryUpgradeDurationSec } from '../../arcCore/balance/facilityLaboratoryLevelPolicy';
import { getFacilityShipyardLevelRow, resolveShipyardUpgradeCostCredits, resolveShipyardUpgradeDurationSec } from '../../arcCore/balance/facilityShipyardLevelPolicy';
import { getFacilityTavernLevelRow, resolveTavernUpgradeCostCredits, resolveTavernUpgradeDurationSec } from '../../arcCore/balance/facilityTavernLevelPolicy';
import { getFacilityTradePortLevelRow, resolveTradePortUpgradeCostCredits, resolveTradePortUpgradeDurationSec } from '../../arcCore/balance/facilityTradePortLevelPolicy';
import {
  getPlanetDefenseSatelliteLevelRow,
  resolveDefenseSatelliteInstallCostCredits,
  resolveDefenseSatelliteUpgradeCostCredits,
  resolveDefenseSatelliteUpgradeDurationSec,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import {
  isPlanetFacilityInstantCompleteBmEnabled,
  resolveLegacyInstantCompleteCreditsFromCsvValue,
  resolvePlanetFacilityInstantCompleteCreditsQuote,
  type PlanetFacilityInstantCompleteKind,
} from '../../arcCore/balance/facilityUpgradeInstantCompletePolicy';
import { resolvePlanetFacilityInstallDurationSec } from '../../arcCore/balance/facilityUpgradeDurationPolicy';
import type { PlanetDefenseSatelliteUpgradeJob } from '../../store/planetCoreMetricTypes';
import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';

type FacilityInstantResolver = {
  resolveUpgradeCostCredits: (currentLevel: number) => number | null;
  resolveUpgradeDurationSec: (currentLevel: number) => number | null;
  resolveLegacyInstantCredits: (currentLevel: number) => number | null;
  resolveInstallCostCredits: () => number;
  resolveLegacyInstallInstantCredits: () => number;
};

const FACILITY_RESOLVERS: Record<string, FacilityInstantResolver> = {
  trade_port: {
    resolveUpgradeCostCredits: resolveTradePortUpgradeCostCredits,
    resolveUpgradeDurationSec: resolveTradePortUpgradeDurationSec,
    resolveLegacyInstantCredits: (lv) => getFacilityTradePortLevelRow(lv + 1)?.instantUpgradeCostCredits ?? null,
    resolveInstallCostCredits: () => getPlanetDevelopmentCatalogRow('dev_trade_port')?.installCostCredits ?? 0,
    resolveLegacyInstallInstantCredits: () => getFacilityTradePortLevelRow(1)?.instantUpgradeCostCredits ?? 0,
  },
  shipyard: {
    resolveUpgradeCostCredits: resolveShipyardUpgradeCostCredits,
    resolveUpgradeDurationSec: resolveShipyardUpgradeDurationSec,
    resolveLegacyInstantCredits: (lv) => getFacilityShipyardLevelRow(lv + 1)?.instantUpgradeCostCredits ?? null,
    resolveInstallCostCredits: () => getPlanetDevelopmentCatalogRow('dev_orbit_shipyard')?.installCostCredits ?? 0,
    resolveLegacyInstallInstantCredits: () => getFacilityShipyardLevelRow(1)?.instantUpgradeCostCredits ?? 0,
  },
  laboratory: {
    resolveUpgradeCostCredits: resolveLaboratoryUpgradeCostCredits,
    resolveUpgradeDurationSec: resolveLaboratoryUpgradeDurationSec,
    resolveLegacyInstantCredits: (lv) => getFacilityLaboratoryLevelRow(lv + 1)?.instantUpgradeCostCredits ?? null,
    resolveInstallCostCredits: () => getPlanetDevelopmentCatalogRow('dev_research_lab')?.installCostCredits ?? 0,
    resolveLegacyInstallInstantCredits: () => getFacilityLaboratoryLevelRow(1)?.instantUpgradeCostCredits ?? 0,
  },
  tavern: {
    resolveUpgradeCostCredits: resolveTavernUpgradeCostCredits,
    resolveUpgradeDurationSec: resolveTavernUpgradeDurationSec,
    resolveLegacyInstantCredits: (lv) => getFacilityTavernLevelRow(lv + 1)?.instantUpgradeCostCredits ?? null,
    resolveInstallCostCredits: () => getPlanetDevelopmentCatalogRow('dev_population_dome')?.installCostCredits ?? 0,
    resolveLegacyInstallInstantCredits: () => getFacilityTavernLevelRow(1)?.instantUpgradeCostCredits ?? 0,
  },
  defense_satellite: {
    resolveUpgradeCostCredits: resolveDefenseSatelliteUpgradeCostCredits,
    resolveUpgradeDurationSec: resolveDefenseSatelliteUpgradeDurationSec,
    resolveLegacyInstantCredits: (lv) => getPlanetDefenseSatelliteLevelRow(lv + 1)?.instantUpgradeCostCredits ?? null,
    resolveInstallCostCredits: () => resolveDefenseSatelliteInstallCostCredits(),
    resolveLegacyInstallInstantCredits: () => getPlanetDefenseSatelliteLevelRow(1)?.instantUpgradeCostCredits ?? 0,
  },
};

export function resolvePlanetFacilityInstantCompleteCredits(params: {
  facilityType: string;
  kind: PlanetFacilityInstantCompleteKind;
  currentLevel: number;
  job?: PlanetDefenseSatelliteUpgradeJob | null;
  nowMs?: number;
}): number {
  const resolver = FACILITY_RESOLVERS[params.facilityType];
  if (!resolver) return 0;

  const isInstall = params.kind === 'install';
  const currentLevel = isInstall ? 0 : params.currentLevel;
  const targetLevel = params.job?.targetLevel ?? currentLevel + 1;

  const baseCost = isInstall
    ? resolver.resolveInstallCostCredits()
    : (resolver.resolveUpgradeCostCredits(currentLevel) ?? 0);
  const durationSec = isInstall
    ? resolvePlanetFacilityInstallDurationSec(params.facilityType)
    : (resolver.resolveUpgradeDurationSec(currentLevel) ?? 0);

  if (!isPlanetFacilityInstantCompleteBmEnabled()) {
    const legacy = isInstall
      ? resolver.resolveLegacyInstallInstantCredits()
      : (resolver.resolveLegacyInstantCredits(currentLevel) ?? 0);
    return resolveLegacyInstantCompleteCreditsFromCsvValue(legacy);
  }

  return resolvePlanetFacilityInstantCompleteCreditsQuote({
    facilityType: params.facilityType,
    kind: params.kind,
    targetLevel,
    durationSec,
    baseCostCredits: baseCost,
    job: params.job ?? null,
    nowMs: params.nowMs,
  });
}

export function resolvePlanetDevModuleInstantCompleteCredits(params: {
  facilityType: string;
  kind: PlanetFacilityInstantCompleteKind;
  currentLevel: number;
  legacyInstantCredits: number | null | undefined;
  job?: PlanetDefenseSatelliteUpgradeJob | null;
  nowMs?: number;
}): number {
  if (!isPlanetFacilityInstantCompleteBmEnabled()) {
    return resolveLegacyInstantCompleteCreditsFromCsvValue(params.legacyInstantCredits);
  }
  return resolvePlanetFacilityInstantCompleteCredits({
    facilityType: params.facilityType,
    kind: params.kind,
    currentLevel: params.currentLevel,
    job: params.job,
    nowMs: params.nowMs,
  });
}
