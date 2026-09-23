import { PLANET_GLOBE_BAKED_PLANET_IDS } from '../data/generated/planetGlobeBakedPlanetIds';

const BUNDLED_GLOBE_IDS: ReadonlySet<string> = new Set(PLANET_GLOBE_BAKED_PLANET_IDS);

export function hasBundledPlanetGlobeBake(planetId: string): boolean {
  return BUNDLED_GLOBE_IDS.has(planetId);
}
