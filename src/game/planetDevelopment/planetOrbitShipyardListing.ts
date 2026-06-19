// ============================================================
// 궤도 조선소 — 무역소 listing·상태 조회 (tradePortCatalog import 금지)
// SUB-STAGE: CSV hasShipyard 또는 dev 설치
// 전함 탭: dev 미설치 시 zone 티어 정본(CSV 조선소 보유 행성)
// ============================================================

import { resolveShipyardBuiltHullTierKeysForLevel } from '../../arcCore/balance/facilityShipyardLevelPolicy';
import { resolveTradePortNpcShipIdsForZone } from '../../arcCore/balance/capitalShipTradeListingPolicy';
import { STAR_SYSTEMS } from '../../data/systems';
import { resolvePlanetZoneIndex } from '../../arcCore/planetBalance/planetZoneIndexRegistry';
import { isPlanetCsvShipyardWorldEnabled } from './planetCsvWorldFlags';
import {
  isFacilityModuleInstalled,
  readFacilityModuleDetail,
} from './planetFacilityModuleRuntime';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';

export const PLANET_DEV_MODULE_ORBIT_SHIPYARD = 'dev_orbit_shipyard';

function findSystemForPlanetId(planetId: string) {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system;
  }
  return undefined;
}

function normalizeOrbitShipyardDetail(
  raw: PlanetFacilityModuleDetail | undefined,
): PlanetFacilityModuleDetail {
  if (!raw || raw.version !== 1) {
    return { version: 1, installed: false, level: 1, upgradeJob: null };
  }
  const level = Math.max(1, Math.floor(Number(raw.level) || 1));
  const installed = raw.installed === true;
  const job = raw.upgradeJob;
  const upgradeJob =
    job
    && typeof job.targetLevel === 'number'
    && typeof job.startedAtMs === 'number'
    && typeof job.completeAtMs === 'number'
      ? job
      : null;
  const builtHullTierKeys = Array.isArray(raw.builtHullTierKeys) && raw.builtHullTierKeys.length > 0
    ? raw.builtHullTierKeys
    : (installed ? resolveShipyardBuiltHullTierKeysForLevel(level) : []);
  return {
    version: 1,
    installed,
    level,
    builtHullTierKeys,
    upgradeJob,
    updatedAtMs: raw.updatedAtMs,
  };
}

export function readPlanetOrbitShipyardDetail(planetId: string): PlanetFacilityModuleDetail {
  return normalizeOrbitShipyardDetail(
    readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD),
  );
}

export function isPlanetOrbitShipyardInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD);
}

export type PlanetShipyardListingMode =
  | { mode: 'none' }
  | { mode: 'filtered'; builtHullTierKeys: string[] };

export function resolvePlanetShipyardListingMode(planetId: string): PlanetShipyardListingMode {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed) return { mode: 'none' };
  return {
    mode: 'filtered',
    builtHullTierKeys: detail.builtHullTierKeys ?? resolveShipyardBuiltHullTierKeysForLevel(detail.level),
  };
}

export function isPlanetTradeShipTabEnabled(planetId: string): boolean {
  const mode = resolvePlanetShipyardListingMode(planetId);
  if (mode.mode === 'filtered' && mode.builtHullTierKeys.length > 0) return true;
  if (!isPlanetCsvShipyardWorldEnabled(planetId)) return false;
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  return resolveTradePortNpcShipIdsForZone(zoneIndex).length > 0;
}
