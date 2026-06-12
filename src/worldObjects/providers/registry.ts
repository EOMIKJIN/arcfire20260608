import { defenseSatelliteWorldObjectProvider } from '../../systems/planetaryDefense/defenseSatelliteWorldObjectProvider';
import { asteroidWorldObjectProvider } from './asteroidWorldObjectProvider';
import type { PlanetWorldObjectProvider, PlanetWorldObjectProviderContext } from './types';
import { wreckWorldObjectProvider } from './wreckWorldObjectProvider';

/** 등록 순서 = `listPlanetWorldObjects` 병합 순서 */
export const PLANET_WORLD_OBJECT_PROVIDERS: readonly PlanetWorldObjectProvider[] = [
  asteroidWorldObjectProvider,
  defenseSatelliteWorldObjectProvider,
  wreckWorldObjectProvider,
];

export function listPlanetWorldObjectsFromProviders(
  ctx: PlanetWorldObjectProviderContext,
): ReturnType<PlanetWorldObjectProvider['list']> {
  const out: ReturnType<PlanetWorldObjectProvider['list']> = [];
  for (const provider of PLANET_WORLD_OBJECT_PROVIDERS) {
    out.push(...provider.list(ctx));
  }
  return out;
}
