// ============================================================
// 범용 시설 개발 모듈 런타임 — 방위위성(planetDefenseSatelliteRuntime)을 일반화.
// development.byModuleId[모듈id]에 PlanetFacilityModuleDetail 형태로 install·레벨 영속.
// (조선소·무역소 등 신규 시설 모듈이 공유; 방위위성 전용 legacy 미러는 쓰지 않는다)
// ============================================================

import type {
  PlanetDevelopmentDetail,
  PlanetFacilityModuleDetail,
} from '../../store/planetCoreMetricTypes';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

function emptyFacilityModuleDetail(): PlanetFacilityModuleDetail {
  return { version: 1, installed: false, level: 1, upgradeJob: null };
}

/** 모듈 런타임 읽기 — 없거나 형식 불일치 시 기본값(미설치) */
export function readFacilityModuleDetail(
  planetId: string,
  moduleId: string,
): PlanetFacilityModuleDetail {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
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

/**
 * 모듈 런타임 쓰기 — development.byModuleId 정본만 갱신(다른 모듈 보존).
 * 행성 런타임 엔트리가 없으면 갱신 불가 → false 반환(호출부에서 크레딧 차감 전 확인 권장).
 */
export function writeFacilityModuleDetail(
  planetId: string,
  moduleId: string,
  detail: PlanetFacilityModuleDetail,
): boolean {
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return false;
  const prevDev: PlanetDevelopmentDetail = cur.detail?.development?.version === 1
    ? (cur.detail.development as PlanetDevelopmentDetail)
    : { version: 1, byModuleId: {} };
  const byModuleId = { ...prevDev.byModuleId, [moduleId]: detail };
  store.patchPlanetCore(planetId, {
    detail: {
      ...cur.detail,
      development: { version: 1, byModuleId },
    },
  });
  return true;
}

/** 행성 런타임 엔트리 존재 여부 — 설치 등 쓰기 전 사전 확인용 */
export function hasPlanetCoreRuntimeEntry(planetId: string): boolean {
  return Boolean(usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId));
}

export function isFacilityModuleInstalled(planetId: string, moduleId: string): boolean {
  const detail = readFacilityModuleDetail(planetId, moduleId);
  return detail.version === 1 && detail.installed === true;
}
