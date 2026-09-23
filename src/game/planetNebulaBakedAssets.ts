/**
 * 행성별 베이크 성운 PNG — `tools/planet-nebula-bake/bake-planet-nebula-images.ts`로 생성.
 */
import type { ImageSourcePropType } from 'react-native';
import type { ZoneType } from '../types';
import { PLANET_NEBULA_BAKED_BY_PLANET_ID } from '../data/generated/planetNebulaBakedAssets';
import { resolvePlanetNebulaBakeKey } from './planetNebulaBakeKey';

export { resolvePlanetNebulaBakeKey } from './planetNebulaBakeKey';

export function resolvePlanetNebulaBakedSource(
  planetId: string | null | undefined,
  zone?: ZoneType | null,
): ImageSourcePropType | null {
  const key = resolvePlanetNebulaBakeKey(planetId, zone);
  if (!key) return null;
  return PLANET_NEBULA_BAKED_BY_PLANET_ID[key] ?? null;
}
