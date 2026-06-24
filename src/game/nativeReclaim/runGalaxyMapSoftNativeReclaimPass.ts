import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';

/**
 * worldmap 체류·성계 도착 — PSS floor ~800 유지 (gesture·SVG·heavyUi 유지).
 * Fresco trim은 deferred(1.5s)로 ANR 회피.
 */
export function runGalaxyMapSoftNativeReclaimPass(
  reason: string,
  keepPlanetIds?: readonly string[],
): void {
  runSoftNativeReclaimPass(reason);
  scheduleDeferredNativeReclaimPass({
    stage: 'galaxy_map',
    reason,
    keepPlanetIds,
  });
}
