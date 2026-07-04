import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { tryBeginHubNativeReclaim } from './hubNativeReclaimCoalesce';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';

/**
 * planet hub 체류 — PSS/Native floor 완화 (Skia tear-down 없음).
 * worldmap `runGalaxyMapSoftNativeReclaimPass` 와 대칭.
 * Fresco trim은 deferred 1회만 — 즉시+deferred 이중 trim 시 Native floor 톱니(6/30 handoff).
 */
export function runPlanetHubSoftNativeReclaimPass(planetId: string, reason: string): void {
  if (!tryBeginHubNativeReclaim(reason)) return;

  /** 전투 orbit 비활성 주기 reclaim — module Path/Paint 캐시만 (overlay signal 없음) */
  runCombatSkiaPresentationReclaim();

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
