/**
 * ArcCore 인스턴스 의뢰 — offer 행성 기준 동적 목표(인접 성계·탐사 행성) 해석.
 * Table-First tq_* 템플릿의 __neighbor_system__ / __discovery_planet__ 플레이스홀더 패치용.
 */

import { listCoreOpenGameplayPlanetIds } from '../world/coreOpenGameplayPlanets';
import {
  resolveFirstGalaxyNeighborSystemId,
  resolveStarSystemForPlanetId,
  resolveSystemIdForPlanetIdFromGalaxy,
} from '../world/resolvePlanetSystemPosition';

export const TAVERN_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER = '__neighbor_system__';
export const TAVERN_INSTANCE_DISCOVERY_PLANET_PLACEHOLDER = '__discovery_planet__';

export type TavernInstancePlanetContext = {
  planetId: string;
  systemId: string | null;
  neighborSystemId: string | null;
  discoveryPlanetId: string | null;
};

function resolveFirstPlanetInSystem(systemId: string, excludePlanetId: string): string | null {
  if (!systemId) return null;
  const synthProbe = systemId.startsWith('synth_') ? `${systemId}_p` : null;
  if (synthProbe) {
    const synthSys = resolveStarSystemForPlanetId(synthProbe);
    if (synthSys?.id === systemId) {
      for (const planet of synthSys.planets) {
        if (planet.id !== excludePlanetId) return planet.id;
      }
      return synthSys.planets[0]?.id ?? null;
    }
  }
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (resolveSystemIdForPlanetIdFromGalaxy(planetId) !== systemId) continue;
    if (planetId !== excludePlanetId) return planetId;
  }
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (resolveSystemIdForPlanetIdFromGalaxy(planetId) === systemId) return planetId;
  }
  return null;
}

export function resolveTavernInstancePlanetContext(planetId: string): TavernInstancePlanetContext {
  const pid = planetId.trim();
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(pid);
  const system = systemId ? resolveStarSystemForPlanetId(pid) : undefined;
  const connections = system?.connections ?? [];

  let neighborSystemId: string | null = null;
  for (let i = 0; i < connections.length; i += 1) {
    const candidate = connections[i]?.trim();
    if (candidate && candidate !== systemId) {
      neighborSystemId = candidate;
      break;
    }
  }
  if (!neighborSystemId && connections.length > 0) {
    neighborSystemId = connections[0]?.trim() ?? null;
  }
  if (!neighborSystemId && systemId) {
    neighborSystemId = resolveFirstGalaxyNeighborSystemId(systemId);
  }

  let discoveryPlanetId: string | null = null;
  if (neighborSystemId) {
    discoveryPlanetId = resolveFirstPlanetInSystem(neighborSystemId, pid);
  }
  if (!discoveryPlanetId && systemId) {
    discoveryPlanetId = resolveFirstPlanetInSystem(systemId, pid);
  }
  if (!discoveryPlanetId) {
    discoveryPlanetId = pid;
  }

  return {
    planetId: pid,
    systemId: systemId ?? null,
    neighborSystemId,
    discoveryPlanetId,
  };
}

export function patchTavernInstanceObjectiveTargetId(
  type: string,
  targetId: string,
  ctx: TavernInstancePlanetContext,
): string {
  if (type === 'reach_system' && targetId === TAVERN_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER) {
    const resolved =
      ctx.neighborSystemId
      ?? (ctx.systemId ? resolveFirstGalaxyNeighborSystemId(ctx.systemId) : null)
      ?? ctx.systemId;
    return resolved && resolved !== TAVERN_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER
      ? resolved
      : (ctx.systemId ?? targetId);
  }
  if (type === 'reach_planet' && targetId === TAVERN_INSTANCE_DISCOVERY_PLANET_PLACEHOLDER) {
    return ctx.discoveryPlanetId ?? ctx.planetId;
  }
  return targetId;
}
