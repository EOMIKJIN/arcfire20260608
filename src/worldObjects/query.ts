import {
  invalidatePlanetWorldObjectsListCache,
  listPlanetWorldObjectsCached,
} from './planetWorldObjectsListCache';
import type { WorldObject, WorldObjectKind } from './types';

type PlanetLike = { id: string; name?: string };
type SystemLike = { id: string };

export interface PlanetWorldObjectQueryInput {
  planet: PlanetLike;
  system: SystemLike;
  nowMs?: number;
}

export { invalidatePlanetWorldObjectsListCache, resolvePlanetWorldObjectsListRevision } from './planetWorldObjectsListCache';

/**
 * 월드오브젝트 조회 — revision-keyed bounded cache (행성당 1 슬롯).
 * 런타임 store 변경 시 invalidatePlanetWorldObjectsListCache 또는 revision 변경으로 갱신.
 */
export function listPlanetWorldObjects(input: PlanetWorldObjectQueryInput): WorldObject[] {
  return listPlanetWorldObjectsCached(input.planet.id, input.system.id);
}

export function listPlanetWorldObjectsByPlanetSystem(
  planetId: string,
  systemId: string,
): WorldObject[] {
  return listPlanetWorldObjectsCached(planetId, systemId);
}

export function listPlanetWorldObjectsByKind(
  planetId: string,
  systemId: string,
  kind: WorldObjectKind,
): WorldObject[] {
  return listPlanetWorldObjectsCached(planetId, systemId).filter((o) => o.kind === kind);
}

export function getPlanetWorldObject(
  planetId: string,
  systemId: string,
  objectId: string,
): WorldObject | undefined {
  return listPlanetWorldObjectsCached(planetId, systemId).find((o) => o.id === objectId);
}

/** 디버그·아크코어 — 캐시 우회 */
export function listPlanetWorldObjectsUncached(
  planetId: string,
  systemId: string,
): WorldObject[] {
  invalidatePlanetWorldObjectsListCache(planetId);
  return listPlanetWorldObjectsCached(planetId, systemId);
}
