// ============================================================
// planets.csv 월드 시설(hasTradePort 등) → 행성개발 UI·선행조건 Lv1 기준
// 허브 SUB-STAGE는 CSV OR dev; 개발 메뉴는 CSV 보유 시 Lv1 설치됨 + Lv2↑ 업그레이드
// ============================================================

import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import {
  isPlanetCsvShipyardWorldEnabled,
  isPlanetCsvTavernWorldEnabled,
  isPlanetCsvTradePortWorldEnabled,
} from './planetCsvWorldFlags';
import { PLANET_DEV_MODULE_ORBIT_SHIPYARD } from './planetOrbitShipyardListing';
import { PLANET_DEV_MODULE_POPULATION_DOME } from './planetPopulationDomeListing';
import { PLANET_DEV_MODULE_TRADE_PORT } from './planetTradePortListing';
import {
  hasPlanetCoreRuntimeEntry,
  writeFacilityModuleDetail,
} from './planetFacilityModuleRuntime';

const CSV_BASELINE_MODULE_IDS: ReadonlyArray<{
  moduleId: string;
  isCsvWorld: (planetId: string) => boolean;
}> = [
  { moduleId: PLANET_DEV_MODULE_TRADE_PORT, isCsvWorld: isPlanetCsvTradePortWorldEnabled },
  { moduleId: PLANET_DEV_MODULE_ORBIT_SHIPYARD, isCsvWorld: isPlanetCsvShipyardWorldEnabled },
  { moduleId: PLANET_DEV_MODULE_POPULATION_DOME, isCsvWorld: isPlanetCsvTavernWorldEnabled },
];

export function isPlanetCsvWorldDevModuleBaseline(planetId: string, moduleId: string): boolean {
  const id = planetId?.trim();
  const mod = moduleId?.trim();
  if (!id || !mod) return false;
  const hit = CSV_BASELINE_MODULE_IDS.find((row) => row.moduleId === mod);
  return hit ? hit.isCsvWorld(id) : false;
}

export type EffectiveFacilityDevView = {
  /** dev 설치 또는 CSV 월드 Lv1 */
  effectiveInstalled: boolean;
  effectiveLevel: number;
  /** persisted dev 없이 CSV만 Lv1 */
  csvWorldBaselineOnly: boolean;
  devRecordInstalled: boolean;
};

export function resolveEffectiveFacilityDevView(
  planetId: string,
  moduleId: string,
  detail: PlanetFacilityModuleDetail,
): EffectiveFacilityDevView {
  const devRecordInstalled = detail.version === 1 && detail.installed === true;
  if (devRecordInstalled) {
    return {
      effectiveInstalled: true,
      effectiveLevel: Math.max(1, Math.floor(Number(detail.level) || 1)),
      csvWorldBaselineOnly: false,
      devRecordInstalled: true,
    };
  }
  if (detail.upgradeJob) {
    return {
      effectiveInstalled: false,
      effectiveLevel: 0,
      csvWorldBaselineOnly: false,
      devRecordInstalled: false,
    };
  }
  if (isPlanetCsvWorldDevModuleBaseline(planetId, moduleId)) {
    return {
      effectiveInstalled: true,
      effectiveLevel: 1,
      csvWorldBaselineOnly: true,
      devRecordInstalled: false,
    };
  }
  return {
    effectiveInstalled: false,
    effectiveLevel: 0,
    csvWorldBaselineOnly: false,
    devRecordInstalled: false,
  };
}

/** CSV 월드 Lv1 → dev 레코드 materialize (업그레이드·즉시업그레이드 직전) */
export function materializeCsvWorldBaselineDevModule(
  planetId: string,
  moduleId: string,
  detail: PlanetFacilityModuleDetail,
  extra?: Partial<PlanetFacilityModuleDetail>,
): boolean {
  if (detail.installed) return true;
  if (!isPlanetCsvWorldDevModuleBaseline(planetId, moduleId)) return false;
  if (!hasPlanetCoreRuntimeEntry(planetId)) return false;
  return writeFacilityModuleDetail(planetId, moduleId, {
    version: 1,
    installed: true,
    level: 1,
    upgradeJob: null,
    updatedAtMs: Date.now(),
    ...extra,
  });
}
