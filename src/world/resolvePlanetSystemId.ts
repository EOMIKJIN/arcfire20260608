import { resolveSystemIdForPlanetIdFromGalaxy } from './resolvePlanetSystemPosition';

/** 행성 id → 소속 성계 id — GALAXY_SYSTEMS 정본(O(1) 스캔, worldStore 무의존) */
export function resolveSystemIdForPlanetId(planetId: string): string | null {
  return resolveSystemIdForPlanetIdFromGalaxy(planetId);
}
