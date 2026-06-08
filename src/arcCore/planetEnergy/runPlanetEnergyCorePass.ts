// ============================================================
// 아크코어 — 자원(Resource) 스칼라 갱신(에너지·광물망 개념 통합)
// - `mineralDepositModel`: 행성별 shareOfGalaxyByMineral
// - `computeGalaxyMineralUniverseStats`: 프로필이 있는 **전 행성** 합산 → 광물 전역 비중·풍부도 퍼센타일
// - 목표 R: 풍부도(은하 점유 상대) + 전역 비중 정렬도 + 소행성 궤도
// - 타이밍: `AiPlanetsSubCore` timed mission `planet_asteroid_resource_cycle` 완료 시
//
// 로드맵: `buildPlanetMineralDepositIndex()` 자리에 **DB에서 읽은 프로필 맵**을 넣는 경로로 바꾸면,
// 아크코어가 동일 패스로 R을 유지·보정하고, 역으로 R·다른 지표를 근거로 **광물 스폰/재고/가격**
// 를 같은 `AiPlanetsSubCore`(또는 전용 서브코어)에서 갱신하는 단방향/피드백 루프로 확장한다.
//
// ── 되는 것 / 안 되는 것(답변·구현 시 숨기지 말 것; 상세는 AGENTS.md «광물·Resource 고지») ──
// 되는: CSV 인덱스+우주 집계로 목표 R 산출, 패스당 스텝 상한으로 스토어 반영, 궤도 수 반영.
// 안 되는: 실채굴 DB 재집계 없음, mineral_region 비멤버 행성은 우주통계 미참여·폴백 R, 광물 스폰/가격은 미구현.
// ============================================================

import { useWorldStore } from '../../store/worldStore';
import {
  usePlanetCoreRuntimeStore,
  planetCoreRuntimeToGaugeView,
} from '../../store/planetCoreRuntimeStore';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import type { Planet, PlanetMineralDepositProfile } from '../../types';
import {
  computeGalaxyMineralUniverseStats,
  planetMineralAlignmentWithGalaxy,
} from '../../world/computeGalaxyMineralUniverseStats';
import {
  ASTEROID_ORBIT_COUNT_MAX,
  ASTEROID_ORBIT_COUNT_MIN,
  buildPlanetMineralDepositIndex,
  resolvePlanetAsteroidAssignedMineralIds,
  resolvePlanetAsteroidOrbitCount,
} from '../../world/mineralDepositModel';
import { useWorldObjectRuntimeStore } from '../../store/worldObjectRuntimeStore';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function orbit01ForPlanet(planetId: string): number {
  const orbit = resolvePlanetAsteroidOrbitCount(planetId);
  const span = Math.max(1, ASTEROID_ORBIT_COUNT_MAX - ASTEROID_ORBIT_COUNT_MIN);
  return Math.max(0, Math.min(1, (orbit - ASTEROID_ORBIT_COUNT_MIN) / span));
}

function targetResourceFromMineralAndOrbit(input: {
  planet: Planet;
  planetId: string;
  profile: PlanetMineralDepositProfile | undefined;
  universe: ReturnType<typeof computeGalaxyMineralUniverseStats>;
}): number {
  const { planet, planetId, profile, universe } = input;
  const orbitPart = orbit01ForPlanet(planetId);

  if (profile && universe.profilePlanetCount > 0) {
    const pct = universe.planetRichnessPercentile[planetId] ?? 0.5;
    const align = planetMineralAlignmentWithGalaxy(profile, universe.mineralPrevalence);
    return clamp100(16 + pct * 46 + align * 32 + orbitPart * 18);
  }

  const seed = (planet.coreResource + planet.coreTechnology + planet.coreEnvironment) / 150;
  return clamp100(26 + Math.min(1, seed) * 36 + orbitPart * 16);
}

/**
 * 월드 전 행성의 **Resource(자원+에너지 통합)** 를 광물 자동배분·소행성 궤도 수에 맞춰 부드럽게 당긴다.
 * `planetCoreRuntimeStore.hydrated`가 아니면 noop.
 */
export function runPlanetEnergyCorePass(): void {
  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return;

  const systems = useWorldStore.getState().systems;
  const worldObjectRuntime = useWorldObjectRuntimeStore.getState();
  const { profilesByPlanetId } = buildPlanetMineralDepositIndex();
  const universe = computeGalaxyMineralUniverseStats(profilesByPlanetId);

  const updates: Record<string, PlanetCoreGaugeView> = {};
  const orbitCountPatch: Record<string, number> = {};
  const orbitMineralPatch: Record<string, string[]> = {};
  const maxDelta = 7;

  for (const sys of Object.values(systems)) {
    for (const planet of sys.planets) {
      const planetId = planet.id;
      const runtime = coreStore.getPlanetCoreRuntime(planetId);
      if (!runtime) continue;

      const target = targetResourceFromMineralAndOrbit({
        planet,
        planetId,
        profile: profilesByPlanetId.get(planetId),
        universe,
      });
      const orbitCount = resolvePlanetAsteroidOrbitCount(planetId);
      orbitCountPatch[planetId] = orbitCount;
      orbitMineralPatch[planetId] = resolvePlanetAsteroidAssignedMineralIds(planetId, orbitCount);
      const cur = runtime.resource;
      const step = Math.max(-maxDelta, Math.min(maxDelta, target - cur));
      const nextResource = clamp100(cur + step);
      const g = planetCoreRuntimeToGaugeView(runtime);
      if (nextResource !== g.resource) {
        updates[planetId] = { ...g, resource: nextResource };
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    coreStore.patchPlanetCoresBulk(updates);
  }
  worldObjectRuntime.patchAsteroidOrbitCounts(orbitCountPatch, 'arc_core_cycle');
  worldObjectRuntime.patchAsteroidAssignedMineralItemIds(orbitMineralPatch, 'arc_core_cycle');
}
