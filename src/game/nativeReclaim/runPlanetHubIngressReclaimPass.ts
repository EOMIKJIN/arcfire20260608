import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { invalidateAllPlanetMemoCaches } from '../planetMemoCache';
import { runStageNativeReclaimPass } from './runStageNativeReclaimPass';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';

export type PlanetHubIngressReclaimOptions = {
  /** true — worldmap·transit combat 등 cold 진입; memo 전량 무효화 후 lazy reload */
  invalidateMemoCaches?: boolean;
};

/**
 * 허브 STAGE focus — worldmap/combat replace 직후 1회.
 * Skia mount 전/직후 PSS floor 정리; hub Skia tear-down 은 하지 않는다.
 */
export function runPlanetHubIngressReclaimPass(
  planetId: string | null,
  reason: string,
  opts?: PlanetHubIngressReclaimOptions,
): void {
  const keep = resolveSinglePlanetSessionKeepIds(planetId);

  if (opts?.invalidateMemoCaches) {
    invalidateAllPlanetMemoCaches();
  }

  runStageNativeReclaimPass({
    stage: 'planet_hub',
    reason,
    keepPlanetIds: keep,
    reclaimHubSkia: false,
    releaseGpuLayers: false,
  });

  void trimNativeBitmapCachesAsync();

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubIngressReclaimPass reason=${reason} keep=${keep.join(',') || '-'}`);
  }
}
