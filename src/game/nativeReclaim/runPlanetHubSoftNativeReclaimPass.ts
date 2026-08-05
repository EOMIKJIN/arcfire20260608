import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { tryBeginHubNativeReclaim } from './hubNativeReclaimCoalesce';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { debugPlanetGpuLayerSnapshot } from '../planetStageGpuSupervisor';

/**
 * planet hub 체류 — PSS/Native floor 완화 + idle sticky Skia dodge 해제.
 * worldmap `runGalaxyMapSoftNativeReclaimPass` 와 대칭.
 * Fresco trim은 deferred 1회만 — 즉시+deferred 이중 trim 시 Native floor 톱니(6/30 handoff).
 */
export function runPlanetHubSoftNativeReclaimPass(planetId: string, reason: string): void {
  if (!tryBeginHubNativeReclaim(reason)) return;

  /** sticky dodge overlay·useImage 상주 해제 — 전투/드론 종료 후 GL/EGL floor 방지 */
  signalHubSkiaNativeReclaim(reason);
  /** 전투 orbit 비활성 주기 reclaim — module Path/Paint 캐시 */
  runCombatSkiaPresentationReclaim();

  const keep = resolveSinglePlanetSessionKeepIds(planetId);
  runSoftNativeReclaimPass(reason);
  /** Fresco는 deferred 1회만 — 즉시+deferred 이중 trim 시 native floor 톱니(6/30) */
  scheduleDeferredNativeReclaimPass({
    stage: 'planet_hub',
    reason,
    keepPlanetIds: keep,
  });
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const gpuLayers = debugPlanetGpuLayerSnapshot().map((l) => l.id).join(',') || '-';
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubSoftNativeReclaimPass reason=${reason} keep=${keep.join(',') || '-'} gpuLayers=${gpuLayers}`);
  }
}
