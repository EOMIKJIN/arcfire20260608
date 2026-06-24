import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';

/**
 * planet hub 체류 — PSS/Native floor 완화 (Skia tear-down 없음).
 * worldmap `runGalaxyMapSoftNativeReclaimPass` 와 대칭.
 */
export function runPlanetHubSoftNativeReclaimPass(planetId: string, reason: string): void {
  const keep = resolveSinglePlanetSessionKeepIds(planetId);
  runSoftNativeReclaimPass(reason);
  scheduleDeferredNativeReclaimPass({
    stage: 'planet_hub',
    reason,
    keepPlanetIds: keep,
  });
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubSoftNativeReclaimPass reason=${reason} keep=${keep.join(',') || '-'}`);
  }
}
