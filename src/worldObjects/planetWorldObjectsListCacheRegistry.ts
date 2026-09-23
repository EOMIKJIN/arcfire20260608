import type { WorldObject } from './types';

/** store·provider 의존 없음 — invalidate 전용 (순환 참조 방지) */
const listCache = new Map<string, WorldObject[]>();
const kindCache = new Map<string, WorldObject[]>();

function deleteKeysWithPrefix(cache: Map<string, WorldObject[]>, prefix: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function invalidatePlanetWorldObjectsListCache(planetId?: string): void {
  if (!planetId) {
    listCache.clear();
    kindCache.clear();
    return;
  }
  const prefix = `${planetId}|`;
  deleteKeysWithPrefix(listCache, prefix);
  deleteKeysWithPrefix(kindCache, prefix);
}

export function readPlanetWorldObjectsListCache(
  planetId: string,
  systemId: string,
  revision: string,
): WorldObject[] | undefined {
  return listCache.get(`${planetId}|${systemId}|${revision}`);
}

export function writePlanetWorldObjectsListCache(
  planetId: string,
  systemId: string,
  revision: string,
  list: WorldObject[],
): WorldObject[] {
  const prefix = `${planetId}|${systemId}|`;
  deleteKeysWithPrefix(listCache, prefix);
  deleteKeysWithPrefix(kindCache, prefix);
  const key = `${planetId}|${systemId}|${revision}`;
  listCache.set(key, list);
  return list;
}

export function readPlanetWorldObjectsKindCache(
  planetId: string,
  systemId: string,
  kind: string,
  revision: string,
): WorldObject[] | undefined {
  return kindCache.get(`${planetId}|${systemId}|${kind}|${revision}`);
}

export function writePlanetWorldObjectsKindCache(
  planetId: string,
  systemId: string,
  kind: string,
  revision: string,
  list: WorldObject[],
): WorldObject[] {
  const prefix = `${planetId}|${systemId}|${kind}|`;
  deleteKeysWithPrefix(kindCache, prefix);
  kindCache.set(`${planetId}|${systemId}|${kind}|${revision}`, list);
  return list;
}
