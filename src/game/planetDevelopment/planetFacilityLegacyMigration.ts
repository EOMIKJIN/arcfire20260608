// ============================================================
// 행성개발 모듈 ID 정리 + 플레이어 진행 기준 레벨 정규화
//   parity Lv 등 레거시 고레벨 → Lv1 클램프 (zone 카탈로그는 CSV 유지)
// ============================================================

import type { PlanetDevelopmentDetail, PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import { getPlanetRecord } from '../../world/planetTradePortDb';

const LEGACY_MODULE_PAIRS = [
  { canonical: 'dev_research_lab', legacy: 'dev_laboratory' },
  { canonical: 'dev_population_dome', legacy: 'dev_tavern' },
] as const;

const CSV_WORLD_DEV_PAIRS: ReadonlyArray<{
  moduleId: string;
  csvFlag: 'hasTradePort' | 'hasShipyard' | 'hasTavern';
}> = [
  { moduleId: 'dev_trade_port', csvFlag: 'hasTradePort' },
  { moduleId: 'dev_orbit_shipyard', csvFlag: 'hasShipyard' },
  { moduleId: 'dev_population_dome', csvFlag: 'hasTavern' },
];

function planetCsvFlagEnabled(planetId: string, flag: 'hasTradePort' | 'hasShipyard' | 'hasTavern'): boolean {
  const planet = getPlanetRecord(planetId);
  if (!planet) return false;
  return Boolean(planet[flag]);
}

const DEV_MODULE_IDS_TO_CLAMP = [
  'dev_trade_port',
  'dev_orbit_shipyard',
  'dev_research_lab',
  'dev_population_dome',
  'defense_satellite',
] as const;

function planetCoreStoreState() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
  return mod.usePlanetCoreRuntimeStore.getState();
}

function emptyFacilityModuleDetail(): PlanetFacilityModuleDetail {
  return { version: 1, installed: false, level: 1, upgradeJob: null };
}

function readFacilityModuleDetailLocal(
  planetId: string,
  moduleId: string,
): PlanetFacilityModuleDetail {
  const runtime = planetCoreStoreState().getPlanetCoreRuntime(planetId);
  const fromModule = runtime?.detail?.development?.byModuleId?.[moduleId];
  if (
    fromModule
    && typeof fromModule === 'object'
    && (fromModule as PlanetFacilityModuleDetail).version === 1
  ) {
    return fromModule as PlanetFacilityModuleDetail;
  }
  return emptyFacilityModuleDetail();
}

function isModuleDetailActive(detail: PlanetFacilityModuleDetail): boolean {
  return detail.installed === true || detail.upgradeJob != null;
}

function isModuleDetailEmpty(detail: PlanetFacilityModuleDetail): boolean {
  return !detail.installed && detail.upgradeJob == null;
}

function migrateLegacyFacilityModulePair(
  planetId: string,
  canonicalModuleId: string,
  legacyModuleId: string,
): boolean {
  const store = planetCoreStoreState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return false;

  const legacy = readFacilityModuleDetailLocal(planetId, legacyModuleId);
  const canonical = readFacilityModuleDetailLocal(planetId, canonicalModuleId);
  if (!isModuleDetailActive(legacy) || !isModuleDetailEmpty(canonical)) return false;

  const prevDev: PlanetDevelopmentDetail = cur.detail?.development?.version === 1
    ? (cur.detail.development as PlanetDevelopmentDetail)
    : { version: 1, byModuleId: {} };

  const nextByModuleId = { ...prevDev.byModuleId };
  nextByModuleId[canonicalModuleId] = { ...legacy };
  delete nextByModuleId[legacyModuleId];

  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      development: { version: 1, byModuleId: nextByModuleId },
    },
  });
  return true;
}

/** parity·레거시 시드로 올라간 dev Lv>1 → Lv1 (설치 상태·업그레이드 잡 정리) */
export function normalizePlanetDevModulesToBaselineLevel(planetId: string): boolean {
  const store = planetCoreStoreState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur?.detail?.development?.byModuleId) return false;

  const prevDev = cur.detail.development as PlanetDevelopmentDetail;
  let changed = false;
  const nextByModuleId = { ...prevDev.byModuleId };

  for (const moduleId of DEV_MODULE_IDS_TO_CLAMP) {
    const raw = nextByModuleId[moduleId];
    if (!raw || typeof raw !== 'object' || (raw as PlanetFacilityModuleDetail).version !== 1) continue;
    const detail = raw as PlanetFacilityModuleDetail;
    if (!detail.installed) continue;
    const level = Math.max(1, Math.floor(Number(detail.level) || 1));
    // 진행 중 install/upgrade job — 레거시 클램프 대상 아님
    if (detail.upgradeJob) continue;
    if (level <= 1) continue;
    // 플레이어 install/upgrade 경로(updatedAtMs) — Lv2+ 누적 유지 (부트마다 Lv1 클램프 회귀 방지)
    if (typeof detail.updatedAtMs === 'number' && Number.isFinite(detail.updatedAtMs)) continue;
    nextByModuleId[moduleId] = {
      ...detail,
      level: 1,
      upgradeJob: null,
      updatedAtMs: Date.now(),
    };
    changed = true;
  }

  if (!changed) return false;
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      development: { version: 1, byModuleId: nextByModuleId },
    },
  });
  return true;
}

/** CSV 월드 시설 보유 행성 — 레거시 Lv1 자동시드 dev 모듈만 제거(플레이어 설치·서브메뉴 CSV 유지) */
export function uninstallCsvWorldLegacyDevModules(planetId: string): boolean {
  const store = planetCoreStoreState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur?.detail?.development?.byModuleId) return false;

  const prevDev = cur.detail.development as PlanetDevelopmentDetail;
  let changed = false;
  const nextByModuleId = { ...prevDev.byModuleId };

  for (const { moduleId, csvFlag } of CSV_WORLD_DEV_PAIRS) {
    if (!planetCsvFlagEnabled(planetId, csvFlag)) continue;
    const raw = nextByModuleId[moduleId];
    if (!raw || typeof raw !== 'object' || (raw as PlanetFacilityModuleDetail).version !== 1) continue;
    const detail = raw as PlanetFacilityModuleDetail;
    if (!detail.installed || detail.upgradeJob != null) continue;
    const level = Math.max(1, Math.floor(Number(detail.level) || 1));
    if (level > 1) continue;
    // 플레이어 행성개발 설치(updatedAtMs)는 유지 — 레거시 자동시드(Lv1·타임스탬프 없음)만 제거
    if (typeof detail.updatedAtMs === 'number' && Number.isFinite(detail.updatedAtMs)) continue;
    delete nextByModuleId[moduleId];
    changed = true;
  }

  if (!changed) return false;
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      development: { version: 1, byModuleId: nextByModuleId },
    },
  });
  return true;
}

export function migrateLegacyPlanetDevModulesForPlanet(planetId: string): boolean {
  if (!planetId) return false;
  let migrated = false;
  for (const pair of LEGACY_MODULE_PAIRS) {
    if (migrateLegacyFacilityModulePair(planetId, pair.canonical, pair.legacy)) {
      migrated = true;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedCsvLegacyPlanetDevModulesForPlanet } = require('./planetFacilityCsvLegacySeed') as typeof import('./planetFacilityCsvLegacySeed');
  if (seedCsvLegacyPlanetDevModulesForPlanet(planetId)) migrated = true;
  if (normalizePlanetDevModulesToBaselineLevel(planetId)) migrated = true;
  if (uninstallCsvWorldLegacyDevModules(planetId)) migrated = true;
  // byModuleId/legacy defenseSatellite 분기 복구 — 착륙 대기 없이 전 행성 일괄 복구(부트마다 실행)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { reconcileDefenseSatelliteDevRecordOnLanding } = require('./planetDefenseSatelliteRuntime') as typeof import('./planetDefenseSatelliteRuntime');
  if (reconcileDefenseSatelliteDevRecordOnLanding(planetId)) migrated = true;
  return migrated;
}

export function migrateLegacyPlanetDevModulesAll(): void {
  const byPlanetId = planetCoreStoreState().byPlanetId;
  for (const planetId of Object.keys(byPlanetId)) {
    migrateLegacyPlanetDevModulesForPlanet(planetId);
  }
}
