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
import {
  HUB_INBOUND_SETTLE_RECLAIM_MS,
  POST_SKIA_PEAK_FOLLOWUP_MS,
} from './processMemoryBudgetPolicy';
import { runPlanetHubSoftNativeReclaimPass } from './runPlanetHubSoftNativeReclaimPass';
import { consumeHubSoftReclaimPending } from './hubPendingSoftReclaim';
import { debugPlanetGpuLayerSnapshot } from '../planetStageGpuSupervisor';

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

  /**
   * inbound peak — RN 성운 remount는 Image 재로딩 깜빡임만 키우고,
   * 회수 본체(signalHubSkia + Picture invalidate + Fresco)는 이미 위에서 수행.
   * 전투 orbit 종료 등 non-inbound만 remount(30m cooldown).
   */
  const skipInboundBackdropRemount =
    reason.includes('hub_inbound') || reason.includes('inbound_settle');
  if (!skipInboundBackdropRemount) {
    scheduleHubBackdropNativeRemountAfterTrim(`${reason}:post_skia_peak`);
  }

  emitMemProfileMarker({
    stage: 'planet_hub',
    event: 'manual',
    detail: reason,
  });

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const gpuLayers = debugPlanetGpuLayerSnapshot().map((l) => l.id).join(',') || '-';
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubPostSkiaPeakReclaimPass reason=${reason} keep=${keep.join(',') || '-'} gpuLayers=${gpuLayers}`);
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
  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * settle soft는 trail/VFX 완전 이탈(hub_inbound_vfx_cleared)에서만.
   * flying→0 peak는 dodge force-unmount·1차 trim만 — trail 잔존(~0.5s) 중 settle은 조기/coalesce 무효화 유발.
   */
  const scheduleInboundSettle =
    reason === 'hub_inbound_vfx_cleared'
    || reason.startsWith('hub_inbound_vfx_cleared:');

  const run = () => {
    if (cancelled) return;
    InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      runPlanetHubPostSkiaPeakReclaimPass(planetId, reason);
      followupTimer = setTimeout(() => {
        if (cancelled) return;
        runPlanetHubPostSkiaPeakReclaimPass(planetId, `${reason}:followup_90s`);
      }, POST_SKIA_PEAK_FOLLOWUP_MS);
      if (scheduleInboundSettle) {
        settleTimer = setTimeout(() => {
          if (cancelled) return;
          /** pending은 soft 본문 성공 시에만 소비 — coalesce no-op에 pending 유실 금지 */
          const ran = runPlanetHubSoftNativeReclaimPass(
            planetId,
            `${reason}:inbound_settle`,
            { bypassCoalesce: true },
          );
          if (ran) consumeHubSoftReclaimPending();
          runCombatSkiaPresentationReclaim();
          void trimNativeBitmapCachesAsync();
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              `[MEM] hubInboundSettleReclaim reason=${reason} after_ms=${HUB_INBOUND_SETTLE_RECLAIM_MS} softRan=${ran ? 1 : 0}`,
            );
          }
        }, HUB_INBOUND_SETTLE_RECLAIM_MS);
      }
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
    if (settleTimer) clearTimeout(settleTimer);
  };
}
