/**
 * 행성별 베이크 성운 PNG — `tools/planet-nebula-bake/bake-planet-nebula-images.ts`로 생성.
 * 프로필 시드·팔레트는 `buildNebulaProfile`과 동일(정적 t=0 프레임).
 */
import type { ImageSourcePropType } from 'react-native';
import { PLANET_NEBULA_BAKED_BY_PLANET_ID } from '../data/generated/planetNebulaBakedAssets';

export function resolvePlanetNebulaBakedSource(
  planetId: string | null | undefined,
): ImageSourcePropType | null {
  if (planetId == null) return null;
  const id = String(planetId).trim();
  if (!id) return null;
  return PLANET_NEBULA_BAKED_BY_PLANET_ID[id] ?? null;
}
