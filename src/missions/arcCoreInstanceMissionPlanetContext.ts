/**
 * ArcCore 인스턴스 의뢰 — offer 행성 기준 동적 목표(인접·원거리 성계·탐사 행성) 해석.
 * Table-First tq_* 템플릿의 __neighbor_system__ / __discovery_planet__ 플레이스홀더 패치용.
 */

import type { ZoneType } from '../types';
import { listCoreOpenGameplayPlanetIds } from '../world/coreOpenGameplayPlanets';
import {
  listGalaxySystemIdsByHopDistance,
  readGalaxySystemRecord,
  resolveFirstGalaxyNeighborSystemId,
  resolveGalaxySystemHopDistance,
  resolveStarSystemForPlanetId,
  resolveSystemIdForPlanetIdFromGalaxy,
} from '../world/resolvePlanetSystemPosition';

export const TAVERN_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER = '__neighbor_system__';
export const TAVERN_INSTANCE_DISCOVERY_PLANET_PLACEHOLDER = '__discovery_planet__';

const MAX_DELIVERY_HOPS = 3;

export type TavernInstancePlanetContext = {
  planetId: string;
  systemId: string | null;
  neighborSystemId: string | null;
  discoveryPlanetId: string | null;
  /** offer 성계 → 배달/항행 목표 성계 BFS 홉 (0 = 동일 성계). */
  deliveryHopCount: number;
  originSystemZone: ZoneType | null;
  targetSystemZone: ZoneType | null;
};

function hashInstanceSeed(parts: readonly string[]): number {
  let h = 0;
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      h = (h * 31 + part.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(h);
}

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

function pickDeliveryTargetSystemId(
  originSystemId: string,
  planetId: string,
  instanceId?: string,
): { systemId: string | null; hops: number } {
  const origin = originSystemId.trim();
  if (!origin) return { systemId: null, hops: 0 };

  const byHop = listGalaxySystemIdsByHopDistance(origin, MAX_DELIVERY_HOPS);
  const hopWeights: Array<{ hops: number; weight: number }> = [
    { hops: 1, weight: 35 },
    { hops: 2, weight: 40 },
    { hops: 3, weight: 25 },
  ];
  const available = hopWeights.filter((row) => (byHop.get(row.hops)?.length ?? 0) > 0);
  if (available.length === 0) {
    const fallback = resolveFirstGalaxyNeighborSystemId(origin);
    return {
      systemId: fallback,
      hops: fallback ? resolveGalaxySystemHopDistance(origin, fallback) : 0,
    };
  }

  const totalWeight = available.reduce((sum, row) => sum + row.weight, 0);
  const seed = hashInstanceSeed([planetId, instanceId ?? planetId, origin]);
  let pick = seed % totalWeight;
  let chosenHop = available[0]!.hops;
  for (const row of available) {
    if (pick < row.weight) {
      chosenHop = row.hops;
      break;
    }
    pick -= row.weight;
  }

  const candidates = byHop.get(chosenHop) ?? [];
  if (candidates.length === 0) {
    const fallback = resolveFirstGalaxyNeighborSystemId(origin);
    return {
      systemId: fallback,
      hops: fallback ? resolveGalaxySystemHopDistance(origin, fallback) : 0,
    };
  }
  const systemId = candidates[seed % candidates.length] ?? candidates[0] ?? null;
  return {
    systemId,
    hops: systemId ? resolveGalaxySystemHopDistance(origin, systemId) : 0,
  };
}

export function resolveTavernInstancePlanetContext(
  planetId: string,
  options?: { instanceId?: string },
): TavernInstancePlanetContext {
  const pid = planetId.trim();
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(pid);
  const originSystem = systemId ? readGalaxySystemRecord(systemId) : undefined;
  const originSystemZone = originSystem?.zone ?? null;

  const deliveryPick = systemId
    ? pickDeliveryTargetSystemId(systemId, pid, options?.instanceId)
    : { systemId: null as string | null, hops: 0 };

  const neighborSystemId = deliveryPick.systemId
    ?? (systemId ? resolveFirstGalaxyNeighborSystemId(systemId) : null);

  const targetSystem = neighborSystemId ? readGalaxySystemRecord(neighborSystemId) : undefined;
  const targetSystemZone = targetSystem?.zone ?? originSystemZone;

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
    deliveryHopCount: deliveryPick.hops,
    originSystemZone,
    targetSystemZone,
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
