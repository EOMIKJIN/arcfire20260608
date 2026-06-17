// ============================================================
// 궤도 조선소(dev_orbit_shipyard) 개발 로직 — v0 "설치만"(레벨업 티어는 향후).
// 방위위성과 동일한 install 구조를 범용 facility 런타임으로 공유한다.
// 설치 시 행성 허브의 조선소 시설이 활성(hasShipyard OR 설치됨)된다.
// 설치비는 planet_development_catalog.csv installCostCredits (Table-First).
// ============================================================

import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import {
  hasPlanetCoreRuntimeEntry,
  isFacilityModuleInstalled,
  readFacilityModuleDetail,
  writeFacilityModuleDetail,
} from './planetFacilityModuleRuntime';
import { invalidatePlanetMemoCachesForPlanet } from '../planetMemoCache';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';

export const PLANET_DEV_MODULE_ORBIT_SHIPYARD = 'dev_orbit_shipyard';

export type OrbitShipyardDevSnapshot = {
  /** 플레이어 개발 설치 여부 */
  installedByDev: boolean;
  /** 허브에서 조선소 이용 가능 — 행성 기본 보유(CSV) 또는 개발 설치 */
  operational: boolean;
  /** 행성이 기본(CSV)으로 조선소를 보유 — 개발 불필요 */
  baseOperational: boolean;
  canInstall: boolean;
  installCost: number;
};

/** 최초 설치 비용 — planet_development_catalog.csv installCostCredits */
export function resolveOrbitShipyardInstallCostCredits(): number {
  return getPlanetDevelopmentCatalogRow(PLANET_DEV_MODULE_ORBIT_SHIPYARD)?.installCostCredits ?? 0;
}

export function isPlanetOrbitShipyardInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD);
}

/** 행성이 기본(CSV) 조선소를 이미 보유 중인지 — worldStore.systems(본행성+개방된 synth 포함) */
export function planetHasBaseShipyard(planetId: string): boolean {
  if (!planetId) return false;
  const systems = useWorldStore.getState().systems;
  for (const sysId in systems) {
    const planet = systems[sysId]?.planets.find((p) => p.id === planetId);
    if (planet) return Boolean(planet.hasShipyard);
  }
  return false;
}

export function buildOrbitShipyardDevSnapshot(planetId: string): OrbitShipyardDevSnapshot {
  const baseOperational = planetHasBaseShipyard(planetId);
  const installedByDev = isPlanetOrbitShipyardInstalled(planetId);
  const operational = baseOperational || installedByDev;
  const installCost = resolveOrbitShipyardInstallCostCredits();
  const playerCredits = usePlayerStore.getState().player?.credits ?? 0;
  return {
    installedByDev,
    operational,
    baseOperational,
    installCost,
    canInstall: !operational && playerCredits >= installCost,
  };
}

function spendPlayerCredits(amount: number): boolean {
  if (amount <= 0) return true;
  const ok = usePlayerStore.getState().spendCredits(amount);
  if (ok) void usePlayerStore.getState().persist();
  return ok;
}

export function installPlanetOrbitShipyard(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  if (planetHasBaseShipyard(planetId)) {
    return { ok: false, reason: '이 행성은 이미 조선소를 운영 중입니다.' };
  }
  if (isPlanetOrbitShipyardInstalled(planetId)) {
    return { ok: false, reason: '이미 설치되어 있습니다.' };
  }
  // 크레딧 차감 전 런타임 엔트리 보장 — 설치 기록 유실로 크레딧만 차감되는 사고 방지
  if (!hasPlanetCoreRuntimeEntry(planetId)) {
    return { ok: false, reason: '행성 데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도하세요.' };
  }
  const cost = resolveOrbitShipyardInstallCostCredits();
  if (!spendPlayerCredits(cost)) {
    return { ok: false, reason: '크레딧이 부족합니다.' };
  }
  const prev = readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD);
  const written = writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, {
    ...prev,
    version: 1,
    installed: true,
    level: 1,
    upgradeJob: null,
    updatedAtMs: Date.now(),
  });
  if (!written) {
    // 엔트리가 사라진 극단적 경합 — 차감 크레딧 환불
    usePlayerStore.getState().addCredits(cost);
    void usePlayerStore.getState().persist();
    return { ok: false, reason: '설치 기록에 실패했습니다. 다시 시도하세요.' };
  }
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}
