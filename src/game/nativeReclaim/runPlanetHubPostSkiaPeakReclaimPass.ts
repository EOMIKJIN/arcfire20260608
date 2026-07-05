import { InteractionManager } from 'react-native';

import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { emitMemProfileMarker } from '../devMemoryProfileBridge';
import { prunePlanetNebulaProfilesExceptPlanetIds } from '../../store/planetNebulaStore';
import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { scheduleHubBackdropNativeRemountAfterTrim } from './runDeepNativeReclaimPass';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';
import { POST_SKIA_PEAK_FOLLOWUP_MS } from './processMemoryBudgetPolicy';

const POST_SKIA_PEAK_DEFER_MS = 32;

/**
 * heavy hub Skia spike(전투 orbit·드론 dodge) 종료 후 — 프로세스 유지 중 GL floor 회수.
 * route_blur 전량 teardown 없음 · GPU supervisor 일괄 해제 없음(성운 Canvas mount 유지).
 */
export function runPlanetHubPostSkiaPeakReclaimPass(planetId: string, reason: string): void {
  const keep = resolveSinglePlanetSessionKeepIds(planetId);

  runCombatSkiaPresentationReclaim();
  signalHubSkiaNativeReclaim(reason);
  prunePlanetNebulaProfilesExceptPlanetIds(keep);
  compactPlanetMemoRegistryShells();

  scheduleDeferredNativeReclaimPass({
    stage: 'planet_hub',
    reason: `${reason}:post_skia_peak`,
    keepPlanetIds: keep,
  });

  void trimNativeBitmapCachesAsync();

  /** GL floor — Fresco trim 후 RN 백드롭 remount (30m cooldown · deep pass와 동일) */
  scheduleHubBackdropNativeRemountAfterTrim(`${reason}:post_skia_peak`);

  emitMemProfileMarker({
    stage: 'planet_hub',
    event: 'manual',
    detail: reason,
  });

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubPostSkiaPeakReclaimPass reason=${reason} keep=${keep.join(',') || '-'}`);
  }
}

/**
 * React unmount·worklet 정지 후 reclaim — 2×rAF + 짧은 지연(Worklet dispose race 회피).
 */
export function schedulePlanetHubPostSkiaPeakReclaim(
  planetId: string,
  reason: string,
): () => void {
  let cancelled = false;
  let raf1 = 0;
  let raf2 = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let followupTimer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    if (cancelled) return;
    InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      runPlanetHubPostSkiaPeakReclaimPass(planetId, reason);
      followupTimer = setTimeout(() => {
        if (cancelled) return;
        runPlanetHubPostSkiaPeakReclaimPass(planetId, `${reason}:followup_90s`);
      }, POST_SKIA_PEAK_FOLLOWUP_MS);
    });
  };

  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(() => {
      timer = setTimeout(run, POST_SKIA_PEAK_DEFER_MS);
    });
  });

  return () => {
    cancelled = true;
    if (raf1) cancelAnimationFrame(raf1);
    if (raf2) cancelAnimationFrame(raf2);
    if (timer) clearTimeout(timer);
    if (followupTimer) clearTimeout(followupTimer);
  };
}
