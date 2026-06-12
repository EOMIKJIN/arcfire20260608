import { useWorldStore } from '../store/worldStore';
import { getPlanetWorldObject } from './query';
import type { WorldObject } from './types';
import type { PlanetWorldObjectProviderContext } from './providers/types';

/** `planetId`만 알 때 성계·조회 컨텍스트 복원 — 요격·도메인 서비스 공통 */
export function resolvePlanetWorldObjectContext(
  planetId: string,
): PlanetWorldObjectProviderContext | null {
  const systems = useWorldStore.getState().systems;
  for (const sys of Object.values(systems)) {
    const planet = sys.planets.find((p) => p.id === planetId);
    if (planet) {
      return { planetId: planet.id, systemId: sys.id };
    }
  }
  return null;
}

/** `planetId` + 전역 object id — 메모 캐시된 월드오브젝트 리스트 조회 */
export function findPlanetWorldObjectById(
  planetId: string,
  objectId: string,
): WorldObject | undefined {
  const ctx = resolvePlanetWorldObjectContext(planetId);
  if (!ctx) return undefined;
  return getPlanetWorldObject(ctx.planetId, ctx.systemId, objectId);
}
