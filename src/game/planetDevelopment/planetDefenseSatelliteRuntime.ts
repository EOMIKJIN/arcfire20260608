import type {
  PlanetDefenseSatelliteDetail,
  PlanetDevelopmentDetail,
} from '../../store/planetCoreMetricTypes';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

export const PLANET_DEV_MODULE_DEFENSE_SATELLITE = 'defense_satellite';

function emptyDefenseSatelliteDetail(): PlanetDefenseSatelliteDetail {
  return { version: 1, installed: false, level: 1, upgradeJob: null };
}

/** legacy `detail.defenseSatellite` → byModuleId 마이그레이션 읽기 */
export function readDefenseSatelliteDetailFromPlanet(
  planetId: string,
): PlanetDefenseSatelliteDetail {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  const development = runtime?.detail?.development;
  const fromModule = development?.byModuleId?.[PLANET_DEV_MODULE_DEFENSE_SATELLITE];
  if (fromModule && typeof fromModule === 'object' && (fromModule as PlanetDefenseSatelliteDetail).version === 1) {
    return fromModule as PlanetDefenseSatelliteDetail;
  }
  const legacy = runtime?.detail?.defenseSatellite;
  if (legacy?.version === 1) return legacy;
  return emptyDefenseSatelliteDetail();
}

export function writeDefenseSatelliteDetailToPlanet(
  planetId: string,
  detail: PlanetDefenseSatelliteDetail,
): void {
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
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
