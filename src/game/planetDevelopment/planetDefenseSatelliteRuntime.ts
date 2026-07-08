import type {
  PlanetCoreMetricsDetail,
  PlanetDefenseSatelliteDetail,
  PlanetDevelopmentDetail,
} from '../../store/planetCoreMetricTypes';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { ensurePlanetCoreRuntimeForDev } from './planetFacilityModuleRuntime';

export const PLANET_DEV_MODULE_DEFENSE_SATELLITE = 'defense_satellite';

function emptyDefenseSatelliteDetail(): PlanetDefenseSatelliteDetail {
  return { version: 1, installed: false, level: 1, upgradeJob: null };
}

function normalizeDefenseSatelliteDetailRaw(
  raw: PlanetDefenseSatelliteDetail | null | undefined,
): PlanetDefenseSatelliteDetail | null {
  if (!raw || raw.version !== 1) return null;
  const installed = raw.installed === true;
  const level = installed
    ? Math.max(1, Math.floor(Number(raw.level) || 1))
    : Math.max(0, Math.floor(Number(raw.level) || 0));
  const job = raw.upgradeJob;
  const upgradeJob =
    job
    && typeof job.targetLevel === 'number'
    && typeof job.startedAtMs === 'number'
    && typeof job.completeAtMs === 'number'
      ? job
      : null;
  return {
    version: 1,
    installed,
    level,
    upgradeJob,
    updatedAtMs: raw.updatedAtMs,
  };
}

function mergeDefenseSatelliteDetails(
  moduleDetail: PlanetDefenseSatelliteDetail | null,
  legacyDetail: PlanetDefenseSatelliteDetail | null,
): PlanetDefenseSatelliteDetail {
  if (!moduleDetail && !legacyDetail) return emptyDefenseSatelliteDetail();
  if (!moduleDetail) return legacyDetail!;
  if (!legacyDetail) return moduleDetail;

  const installed = moduleDetail.installed === true || legacyDetail.installed === true;
  const levelRaw = Math.max(
    moduleDetail.level ?? 0,
    legacyDetail.level ?? 0,
  );
  const level = installed ? Math.max(1, levelRaw) : Math.max(0, levelRaw);
  const upgradeJob = moduleDetail.upgradeJob ?? legacyDetail.upgradeJob ?? null;
  const updatedAtMs = Math.max(moduleDetail.updatedAtMs ?? 0, legacyDetail.updatedAtMs ?? 0) || undefined;
  return {
    version: 1,
    installed,
    level,
    upgradeJob,
    updatedAtMs,
  };
}

function defenseSatelliteDetailNeedsPersistRepair(
  moduleDetail: PlanetDefenseSatelliteDetail | null,
  legacyDetail: PlanetDefenseSatelliteDetail | null,
  merged: PlanetDefenseSatelliteDetail,
): boolean {
  if (!moduleDetail && !legacyDetail) return false;
  const modJson = JSON.stringify(moduleDetail ?? emptyDefenseSatelliteDetail());
  const legJson = JSON.stringify(legacyDetail ?? emptyDefenseSatelliteDetail());
  const mergedJson = JSON.stringify(merged);
  return modJson !== mergedJson || legJson !== mergedJson;
}

/** legacy + byModuleId 병합 — store selector용 pure read */
export function readDefenseSatelliteDetailFromCoreDetail(
  detail: PlanetCoreMetricsDetail | undefined,
): PlanetDefenseSatelliteDetail {
  const fromModule = detail?.development?.byModuleId?.[PLANET_DEV_MODULE_DEFENSE_SATELLITE];
  const moduleDetail = normalizeDefenseSatelliteDetailRaw(
    fromModule && typeof fromModule === 'object'
      ? (fromModule as PlanetDefenseSatelliteDetail)
      : null,
  );
  const legacyDetail = normalizeDefenseSatelliteDetailRaw(detail?.defenseSatellite);
  return mergeDefenseSatelliteDetails(moduleDetail, legacyDetail);
}

/** legacy `detail.defenseSatellite` + development.byModuleId — installed OR 병합 읽기 */
export function readDefenseSatelliteDetailFromPlanet(
  planetId: string,
): PlanetDefenseSatelliteDetail {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  return readDefenseSatelliteDetailFromCoreDetail(runtime?.detail);
}

/**
 * 착륙·재접속 — legacy/byModuleId 분기·누락 런타임 엔트리 복구.
 * (byModuleId만 installed:false인데 legacy installed:true → 궤도 위성 0기 회귀 방지)
 */
export function reconcileDefenseSatelliteDevRecordOnLanding(planetId: string): boolean {
  if (!planetId) return false;
  const store = usePlanetCoreRuntimeStore.getState();
  let runtime = store.getPlanetCoreRuntime(planetId);
  if (!runtime) {
    ensurePlanetCoreRuntimeForDev(planetId);
    runtime = store.getPlanetCoreRuntime(planetId);
  }
  if (!runtime) return false;

  const moduleDetail = normalizeDefenseSatelliteDetailRaw(
    runtime.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_DEFENSE_SATELLITE] as PlanetDefenseSatelliteDetail | undefined,
  );
  const legacyDetail = normalizeDefenseSatelliteDetailRaw(runtime.detail?.defenseSatellite);
  const merged = mergeDefenseSatelliteDetails(moduleDetail, legacyDetail);
  if (!defenseSatelliteDetailNeedsPersistRepair(moduleDetail, legacyDetail, merged)) {
    return false;
  }
  writeDefenseSatelliteDetailToPlanet(planetId, merged);
  return true;
}

export function writeDefenseSatelliteDetailToPlanet(
  planetId: string,
  detail: PlanetDefenseSatelliteDetail,
): void {
  const store = usePlanetCoreRuntimeStore.getState();
  let cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) {
    ensurePlanetCoreRuntimeForDev(planetId);
    cur = store.getPlanetCoreRuntime(planetId);
  }
  if (!cur) return;
  const prevDev: PlanetDevelopmentDetail = cur.detail?.development?.version === 1
    ? (cur.detail.development as PlanetDevelopmentDetail)
    : { version: 1, byModuleId: {} };
  const byModuleId = { ...prevDev.byModuleId, [PLANET_DEV_MODULE_DEFENSE_SATELLITE]: detail };
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      development: { version: 1, byModuleId },
      /** legacy 읽기 호환 — 신규 쓰기는 development.byModuleId 정본 */
      defenseSatellite: detail,
    },
  });
}

export function isDefenseSatelliteInstalledDetail(
  raw: PlanetDefenseSatelliteDetail | undefined,
): boolean {
  return raw?.version === 1 && raw.installed === true;
}

export function isPlanetDefenseSatelliteInstalled(planetId: string): boolean {
  return isDefenseSatelliteInstalledDetail(readDefenseSatelliteDetailFromPlanet(planetId));
}
