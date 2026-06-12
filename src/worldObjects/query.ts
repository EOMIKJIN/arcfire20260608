import { memoizePerPlanetSystem } from '../game/planetMemoCache';
import { listPlanetWorldObjectsFromProviders } from './providers/registry';
import type { WorldObject, WorldObjectKind } from './types';

type PlanetLike = { id: string; name?: string };
type SystemLike = { id: string };

export interface PlanetWorldObjectQueryInput {
  planet: PlanetLike;
  system: SystemLike;
  nowMs?: number;
}

const listPlanetWorldObjectsMemo = memoizePerPlanetSystem(
  'planet_world_objects_v2',
  (planetId: string, systemId: string) =>
    listPlanetWorldObjectsFromProviders({ planetId, systemId }),
);

function uncachedListPlanetWorldObjects(
  planetId: string,
  systemId: string,
): WorldObject[] {
  return listPlanetWorldObjectsFromProviders({ planetId, systemId });
}

/**
 * 월드오브젝트 공통 조회 진입점.
 * 종류별 소스는 `providers/registry` — 행성·성계 키 메모 캐시.
 */
export function listPlanetWorldObjects(input: PlanetWorldObjectQueryInput): WorldObject[] {
  return listPlanetWorldObjectsMemo(input.planet.id, input.system.id);
}

export function listPlanetWorldObjectsByPlanetSystem(
  planetId: string,
  systemId: string,
): WorldObject[] {
  return listPlanetWorldObjectsMemo(planetId, systemId);
}

export function listPlanetWorldObjectsByKind(
  planetId: string,
  systemId: string,
  kind: WorldObjectKind,
): WorldObject[] {
  return listPlanetWorldObjectsMemo(planetId, systemId).filter((o) => o.kind === kind);
}

export function getPlanetWorldObject(
  planetId: string,
  systemId: string,
  objectId: string,
): WorldObject | undefined {
  return listPlanetWorldObjectsMemo(planetId, systemId).find((o) => o.id === objectId);
}

/** 메모 우회 — 아크코어·디버그용(일반 UI는 memo 경로 사용) */
export function listPlanetWorldObjectsUncached(
  planetId: string,
  systemId: string,
): WorldObject[] {
  return uncachedListPlanetWorldObjects(planetId, systemId);
}
