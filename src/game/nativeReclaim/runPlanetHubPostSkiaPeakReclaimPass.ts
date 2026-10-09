import { InteractionManager } from 'react-native';

import { scheduleNativeHeapPurgeAfterStageExit, trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { emitMemProfileMarker } from '../devMemoryProfileBridge';
import { prunePlanetNebulaProfilesExceptPlanetIds } from '../../store/planetNebulaStore';
import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { shouldSkipHubPeakBackdropRemount } from './hubPeakBackdropRemountPolicy';
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
export function runPlanetHubPostSkiaPeakReclaimPass(
  planetId: string,
  reason: string,
  opts?: { deferBitmapTrimToSettle?: boolean },
): void {
  const keep = resolveSinglePlanetSessionKeepIds(planetId);

  runCombatSkiaPresentationReclaim();
  signalHubSkiaNativeReclaim(reason);
  prunePlanetNebulaProfilesExceptPlanetIds(keep);
  compactPlanetMemoRegistryShells();

  /**
   * settle이 뒤따르는 경로는 deferred(Fresco trim 포함)를 settle soft의 1회로 합친다(E6).
   * 그 밖의 경로(전투 orbit 종료·웨이브 간)는 기존 그대로.
   */
  if (!opts?.deferBitmapTrimToSettle) {
    scheduleDeferredNativeReclaimPass({
      stage: 'planet_hub',
      reason: `${reason}:post_skia_peak`,
      keepPlanetIds: keep,
    });
    void trimNativeBitmapCachesAsync();
  }
  if (reason === 'hub_inbound_vfx_cleared') {
    scheduleNativeHeapPurgeAfterStageExit();
  }

  /**
   * peak 직후 remount 금지 — 회수 본체는 위(signalHubSkia·Picture·Fresco trim).
   * 전투 종료 remount는 native 계단과 동시에 관측됨. 15분 deep remount는 유지.
   */
  if (
    typeof __DEV__ !== 'undefined'
    && __DEV__
    && shouldSkipHubPeakBackdropRemount(reason)
  ) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] backdropRemount peak skip reason=${reason}`);
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
      runPlanetHubPostSkiaPeakReclaimPass(planetId, reason, {
        deferBitmapTrimToSettle: scheduleInboundSettle,
      });
      /**
       * 인바운드 웨이브(약 61초 간격)는 다음 웨이브의 effect cleanup이 항상 90초 타이머를 취소했다(실행 0회).
       * → settle 경로는 followup을 만들지 않는다(E6). 전투 orbit 종료·웨이브 간은 유지.
       */
      if (!scheduleInboundSettle) {
        followupTimer = setTimeout(() => {
          if (cancelled) return;
          runPlanetHubPostSkiaPeakReclaimPass(planetId, `${reason}:followup_90s`);
        }, POST_SKIA_PEAK_FOLLOWUP_MS);
      }
      if (scheduleInboundSettle) {
        settleTimer = setTimeout(() => {
          if (cancelled) return;
          /**
           * pending은 soft 본문 성공 시에만 소비 — coalesce no-op에 pending 유실 금지.
           * soft 본문이 전투 Skia 회수와 deferred(Fresco trim 1회)를 이미 수행 — 뒤이은 중복 호출 제거(E6).
           */
          const ran = runPlanetHubSoftNativeReclaimPass(
            planetId,
            `${reason}:inbound_settle`,
            { bypassCoalesce: true },
          );
          if (ran) consumeHubSoftReclaimPending();
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
