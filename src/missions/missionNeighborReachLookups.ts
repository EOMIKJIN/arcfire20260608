/**
 * 인접 성계 배달 — offer 행성 → 출발 성계. 착륙/허브 경로에서만 호출.
 */
import type { Mission } from '../types';
import { resolveSystemIdForPlanetIdFromGalaxy } from '../world/resolvePlanetSystemPosition';

export function resolveMissionOfferOriginSystemId(
  mission: Pick<Mission, 'offerPlanetId'>,
): string | null {
  const planetId = mission.offerPlanetId?.trim();
  if (!planetId) return null;
  return resolveSystemIdForPlanetIdFromGalaxy(planetId);
}
