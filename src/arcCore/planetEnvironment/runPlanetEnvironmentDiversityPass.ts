// ============================================================
// 아크코어 — 플레이어 현재 성계 기준 주변 행성(~20) 핵심 5지표 일괄 재조정
// - 행성 **이미지·초상 전용 로직**은 추후 구현; 현재는 `planetCoreRuntimeStore` 수치만 갱신
// - 궤도 수송 누적: `planetDevelopmentAccStore` ← `AiNpcSubCore` 벽시계, 여기서 코어에 합산
// - 궤도 수송·전투 상호작용은 **착륙 중인 행성**에만 적용, 나머지는 구조적 다양성만
// ============================================================

import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { Planet, StarSystem } from '../../types';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { usePlanetDevelopmentAccStore } from '../../store/planetDevelopmentAccStore';
import { rebalanceFromRuntimeRecord } from './planetDiversityRebalance';
import { collectPlanetInteractionSignals, type PlanetInteractionSignals } from './planetInteractionSignals';
import { resolvePlanetCoreStatAuthority } from '../balance/planetCoreStatAuthorityPolicy';
import { resolvePlanetCoreStatAuthorityContext } from '../planetCore/resolvePlanetCoreStatContext';
import {
  applyPlanetCoreGaugeChangeOrIntent,
  isPlanetCoreGaugeIntentBatchActive,
} from '../planetCore/planetCoreGaugeIntent';

/** 현재 성계·연결 성계에서 채울 행성 수 상한 */
const SURROUNDING_PLANET_REBALANCE_MAX = 20;
/** 패스당 행성별 발전도(수송 누적) → 코어 지표에 더할 정수 상한(지표당) */
const DEVELOPMENT_APPLY_MAX_PER_STAT = 3;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function mergeGauge(a: PlanetCoreGaugeView, b: PlanetCoreGaugeView): PlanetCoreGaugeView {
  return {
    resource: clamp100(a.resource + b.resource),
    population: clamp100(a.population + b.population),
    defense: clamp100(a.defense + b.defense),
    technology: clamp100(a.technology + b.technology),
    environment: clamp100(a.environment + b.environment),
  };
}

function findPlanetAndSystem(
  systems: Record<string, StarSystem>,
  planetId: string,
): { planet: Planet; system: StarSystem } | null {
  for (const sys of Object.values(systems)) {
    const p = sys.planets.find((x) => x.id === planetId);
    if (p) return { planet: p, system: sys };
  }
  return null;
}

function findSystemIdForPlanet(systems: Record<string, StarSystem>, planetId: string): string | null {
  for (const sys of Object.values(systems)) {
    if (sys.planets.some((p) => p.id === planetId)) return sys.id;
  }
  return null;
}

/**
 * BFS로 `startSystemId`에서 연결된 성계를 돌며 행성 id를 최대 `maxPlanets`개까지 수집.
 * 한 성계의 모든 행성을 먼저 넣고, 부족하면 이웃 성계로 확장.
 */
export function collectSurroundingPlanetIds(
  systems: Record<string, StarSystem>,
  startSystemId: string,
  maxPlanets: number,
): string[] {
  const visitedSys = new Set<string>();
  const queue: string[] = [startSystemId];
  const ids: string[] = [];

  while (queue.length > 0 && ids.length < maxPlanets) {
    const sid = queue.shift();
    if (!sid || visitedSys.has(sid)) continue;
    visitedSys.add(sid);
    const sys = systems[sid];
    if (!sys) continue;

    for (const p of sys.planets) {
      if (ids.length >= maxPlanets) break;
      ids.push(p.id);
    }

    for (const c of sys.connections) {
      if (!visitedSys.has(c) && systems[c]) queue.push(c);
    }
  }

  return ids;
}

/** 착륙 없이도 `currentSystemId`만 있으면 주변 행성만 조정. 스토어 미부트스트랩이면 noop. */
export function runPlanetEnvironmentDiversityPass(): void {
  const player = usePlayerStore.getState().player;
  const startSystemId = player?.currentSystemId;
  if (!startSystemId) return;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return;

  const systems = useWorldStore.getState().systems;
  const planetIds = collectSurroundingPlanetIds(systems, startSystemId, SURROUNDING_PLANET_REBALANCE_MAX);
  if (planetIds.length === 0) return;

  const landedId = player.currentPlanetId ?? null;
  let landedInteraction: PlanetInteractionSignals | undefined;
  if (landedId) {
    const sid = findSystemIdForPlanet(systems, landedId);
    if (sid) landedInteraction = collectPlanetInteractionSignals(landedId, sid);
  }

  const devStore = usePlanetDevelopmentAccStore.getState();
  const updates: Record<string, PlanetCoreGaugeView> = {};
  for (const planetId of planetIds) {
    const authority = resolvePlanetCoreStatAuthority(
      resolvePlanetCoreStatAuthorityContext(planetId),
    );
    if (!authority.environmentDiversity) continue;
    const hit = findPlanetAndSystem(systems, planetId);
    if (!hit) continue;
    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;
    const interaction = planetId === landedId ? landedInteraction : undefined;
    const rebalanced = rebalanceFromRuntimeRecord(hit.planet, hit.system, runtime, interaction);
    const fromTransport = devStore.consumeIntegerDeltas(planetId, DEVELOPMENT_APPLY_MAX_PER_STAT);
    const before = {
      resource: runtime.resource,
      population: runtime.population,
      defense: runtime.defense,
      technology: runtime.technology,
      environment: runtime.environment,
    };
    const after = mergeGauge(rebalanced, fromTransport);
    const changed = before.resource !== after.resource
      || before.population !== after.population
      || before.defense !== after.defense
      || before.technology !== after.technology
      || before.environment !== after.environment;
    if (!changed) continue;
    applyPlanetCoreGaugeChangeOrIntent(planetId, before, after, 'arc_core', () => {
      updates[planetId] = after;
    });
  }

  if (!isPlanetCoreGaugeIntentBatchActive() && Object.keys(updates).length === 0) return;
  if (!isPlanetCoreGaugeIntentBatchActive()) {
    coreStore.patchPlanetCoresBulk(updates);
  }
}
