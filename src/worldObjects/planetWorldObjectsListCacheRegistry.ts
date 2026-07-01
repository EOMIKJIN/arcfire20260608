import type { WorldObject } from './types';

/** store·provider 의존 없음 — invalidate 전용 (순환 참조 방지) */
const listCache = new Map<string, WorldObject[]>();

export function invalidatePlanetWorldObjectsListCache(planetId?: string): void {
  if (!planetId) {
    listCache.clear();
    return;
  }
  const prefix = `${planetId}|`;
  for (const key of [...listCache.keys()]) {
    if (key.startsWith(prefix)) listCache.delete(key);
  }
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
  for (const cacheKey of [...listCache.keys()]) {
    if (cacheKey.startsWith(prefix)) listCache.delete(cacheKey);
  }
  const key = `${planetId}|${systemId}|${revision}`;
  listCache.set(key, list);
  return list;
}
