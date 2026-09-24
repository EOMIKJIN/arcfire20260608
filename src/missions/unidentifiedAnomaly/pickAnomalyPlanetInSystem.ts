import type { StarSystem } from '../../types';

/** 성계에서 바 행성 우선, 없으면 첫 행성. */
export function pickAnomalyPlanetInSystem(system: StarSystem | undefined | null): string | null {
  const planets = system?.planets;
  if (!planets || planets.length === 0) return null;
  for (let i = 0; i < planets.length; i += 1) {
    if (planets[i]!.hasBar) return planets[i]!.id;
  }
  return planets[0]!.id;
}
