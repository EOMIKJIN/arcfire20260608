// ============================================================
// 범용 시설 개발 모듈 런타임 — 방위위성·궤도 조선소 등 공통 계약:
//   미설치(installed=false) → 허브·무역 해금 없음
//   설치 Lv.1 → upgradeJob 타이머·레벨별 CSV 해금 (방위위성 development 패턴)
// ============================================================

import type {
  PlanetDevelopmentDetail,
  PlanetFacilityModuleDetail,
} from '../../store/planetCoreMetricTypes';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { useWorldStore } from '../../store/worldStore';

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

/** 행성개발 설치 전 — worldStore 행성 기준 코어 런타임 시드(없을 때만) */
export function ensurePlanetCoreRuntimeForDev(planetId: string): boolean {
  if (hasPlanetCoreRuntimeEntry(planetId)) return true;
  const id = planetId?.trim();
  if (!id) return false;
  const systems = useWorldStore.getState().systems;
  for (const sys of Object.values(systems)) {
    const planet = sys.planets.find((p) => p.id === id);
    if (!planet) continue;
    usePlanetCoreRuntimeStore.getState().patchPlanetCore(id, {});
    return hasPlanetCoreRuntimeEntry(id);
  }
  return false;
}

/** 행성 런타임 엔트리 존재 여부 — 설치 등 쓰기 전 사전 확인용 */
export function hasPlanetCoreRuntimeEntry(planetId: string): boolean {
  return Boolean(usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId));
}

export function isFacilityModuleInstalled(planetId: string, moduleId: string): boolean {
  const detail = readFacilityModuleDetail(planetId, moduleId);
  return detail.version === 1 && detail.installed === true;
}
