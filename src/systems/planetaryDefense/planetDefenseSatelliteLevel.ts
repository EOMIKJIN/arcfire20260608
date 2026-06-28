import {
  clampPlanetDefenseSatelliteLevel,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../../game/planetMemoCache';
import {
  isPlanetDefenseSatelliteInstalled,
  readDefenseSatelliteDetailFromPlanet,
} from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import { patchPlanetDefenseSatelliteInstanceState } from './planetDefenseSatelliteInstanceRuntime';

export { isPlanetDefenseSatelliteInstalled } from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';

/** 행성 방위위성 현재 레벨 — 미설치 0, 설치 후 1..max(CSV) */
export function resolvePlanetDefenseSatelliteLevel(planetId: string): number {
  if (!isPlanetDefenseSatelliteInstalled(planetId)) return 0;
  const stored = readDefenseSatelliteDetailFromPlanet(planetId).level;
  if (typeof stored === 'number' && Number.isFinite(stored)) {
    return clampPlanetDefenseSatelliteLevel(stored);
  }
  return 1;
}

export function patchPlanetDefenseSatelliteInstanceLevel(
  planetId: string,
  instanceKey: string,
  level: number,
): void {
  patchPlanetDefenseSatelliteInstanceState(planetId, instanceKey, {
    defenseLevel: clampPlanetDefenseSatelliteLevel(level),
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
}
