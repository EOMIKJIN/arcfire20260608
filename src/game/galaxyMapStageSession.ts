/**
 * STAGE 2 — 은하계 지도 세션 자원·프레젠테이션 해제
 * planet `releasePlanetMainStageSession` 과 대칭 — memo/nebula/heavyUi/scroll 일괄 정리.
 */

import { clearCapitalRealtimeCombatPresentationCaches } from '../combat/clearCapitalRealtimeCombatCaches';
import { resetHubInboundDroneDodgeBridge } from '../arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { trimArcInboundDroneCampaignsForStageExit } from '../arcCore/inboundDrone/trimArcInboundDroneCampaignsForStageExit';
import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';
import {
  invalidateAllPlanetMemoCaches,
  invalidatePlanetMemoCachesForPlanets,
} from './planetMemoCache';
import { releaseGalaxyMapScrollIfRegistered } from './galaxyMapScrollLifecycle';
import {
  prunePlanetNebulaProfilesExceptPlanetIds,
  prunePlanetNebulaProfilesForPlanets,
  prunePlanetNebulaProfilesLru,
} from '../store/planetNebulaStore';
import { abortHeavyUiSessions } from '../ui/heavyUiDataSession/heavyUiSessionLifecycle';
import { useWorldStore } from '../store/worldStore';
import { runGalaxyMapSoftNativeReclaimPass } from './nativeReclaim/runGalaxyMapSoftNativeReclaimPass';
import { resolveSinglePlanetSessionKeepIds } from './nativeReclaim/singlePlanetSessionKeep';
import { runStageNativeReclaimPass } from './nativeReclaim/runStageNativeReclaimPass';
import { emitMemProfileMarker } from './devMemoryProfileBridge';

export type GalaxyMapStageReleaseReason = 'route_blur' | 'system_change' | 'transit_combat_nav';

export type GalaxyMapStageReleaseOptions = {
  reason?: GalaxyMapStageReleaseReason;
  previousSystemId?: string | null;
  anchorPlanetId?: string | null;
  keepPlanetIds?: readonly string[];
};

const deferredTileResetCallbacks = new Set<() => void>();
const presentationResetCallbacks = new Set<() => void>();

/** blur + unmount 이중 release 방지 */
let lastGalaxyReleaseKey = '';
let lastGalaxyReleaseAtMs = 0;
const GALAXY_RELEASE_DEDUPE_MS = 800;

/** worldmap blur/unmount 시 deferred tile chain 초기화 */
export function registerGalaxyMapDeferredTileReset(reset: () => void): () => void {
  deferredTileResetCallbacks.add(reset);
  return () => {
    deferredTileResetCallbacks.delete(reset);
  };
}

/** worldmap blur — SVG/gesture gate·패널·transit UI state 리셋 */
export function registerGalaxyMapPresentationReset(reset: () => void): () => void {
  presentationResetCallbacks.add(reset);
  return () => {
    presentationResetCallbacks.delete(reset);
  };
}

function resetGalaxyMapDeferredTiles(): void {
  for (const reset of deferredTileResetCallbacks) {
    try {
      reset();
    } catch {
      /* idempotent */
    }
  }
}

function resetGalaxyMapPresentationState(): void {
  for (const reset of presentationResetCallbacks) {
    try {
      reset();
    } catch {
      /* idempotent */
    }
  }
}

function planetIdsForSystem(systemId: string | null | undefined): string[] {
  if (!systemId) return [];
  const system = useWorldStore.getState().systems[systemId];
  if (!system) return [];
  return system.planets.map((p) => p.id);
}

function resolveKeepPlanetIds(opts: GalaxyMapStageReleaseOptions): string[] {
  const keep = new Set<string>();
  for (const id of opts.keepPlanetIds ?? []) {
    if (id) keep.add(id);
  }
  if (opts.anchorPlanetId) keep.add(opts.anchorPlanetId);
  return resolveSinglePlanetSessionKeepIds(
    opts.anchorPlanetId ?? [...keep][0] ?? null,
  );
}

function runGalaxyMapReleaseCore(reason: GalaxyMapStageReleaseReason, opts: GalaxyMapStageReleaseOptions): void {
  clearCapitalRealtimeCombatPresentationCaches();

  /** worldmap → transit combat → worldmap — scroll·presentation만 정리, heavyUi·memo 전량 abort 금지(복귀 loading 고착) */
  if (reason === 'transit_combat_nav') {
    resetGalaxyMapDeferredTiles();
    resetGalaxyMapPresentationState();
    /** scroll teardown은 navigateToCombatAfterTeardown → stopGalaxyMapInteractionLoops 에서 이미 수행. global unregister 재호출 시 freezeOnBlur 복귀 scroll re-arm 실패. */
    resetHubInboundDroneDodgeBridge();
    emitMemProfileMarker({ stage: 'galaxy_map', event: 'transit_combat_nav' });
    return;
  }

  if (reason === 'route_blur') {
    resetGalaxyMapDeferredTiles();
    resetGalaxyMapPresentationState();
    releaseGalaxyMapScrollIfRegistered();
    invalidateAllPlanetMemoCaches();
    const keepIds = resolveKeepPlanetIds(opts);
    abortHeavyUiSessions({ prefix: 'worldmap-screen:' });
    resetHubInboundDroneDodgeBridge();
    trimArcInboundDroneCampaignsForStageExit(keepIds[0] ?? opts.anchorPlanetId ?? null);
    runStageNativeReclaimPass({
      stage: 'galaxy_map',
      reason: 'route_blur',
      keepPlanetIds: keepIds,
    });
    void trimNativeBitmapCachesAsync();
    emitMemProfileMarker({ stage: 'galaxy_map', event: 'route_blur', detail: opts.previousSystemId ?? '' });
    return;
  }

  if (reason === 'system_change') {
    // 지도 화면 유지 중 — gesture·패널·heavyUi 세션 abort 금지 (도착 후 loading… 고착 방지)
    const prevPlanetIds = planetIdsForSystem(opts.previousSystemId);
    if (prevPlanetIds.length > 0) {
      invalidatePlanetMemoCachesForPlanets(prevPlanetIds);
      prunePlanetNebulaProfilesForPlanets(prevPlanetIds);
    }
    const keepIds = resolveKeepPlanetIds(opts);
    if (keepIds.length > 0) {
      prunePlanetNebulaProfilesExceptPlanetIds(keepIds);
    }
    runGalaxyMapSoftNativeReclaimPass('galaxy_system_change', keepIds);
    emitMemProfileMarker({
      stage: 'galaxy_map',
      event: 'system_change',
      detail: opts.previousSystemId ?? '',
    });
  }
}

/** STAGE 2 이탈·성계 전환 — scroll + memo + nebula + heavyUi + presentation */
export function releaseGalaxyMapStageMemoryFull(opts?: GalaxyMapStageReleaseOptions): void {
  const reason = opts?.reason ?? 'route_blur';
  const releaseKey = `${reason}:${opts?.previousSystemId ?? ''}:${opts?.anchorPlanetId ?? ''}`;
  const now = Date.now();
  if (
    releaseKey === lastGalaxyReleaseKey
    && now - lastGalaxyReleaseAtMs < GALAXY_RELEASE_DEDUPE_MS
  ) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[MEM] releaseGalaxyMapStageMemoryFull dedupe ${releaseKey}`);
    }
    return;
  }
  lastGalaxyReleaseKey = releaseKey;
  lastGalaxyReleaseAtMs = now;

  runGalaxyMapReleaseCore(reason, opts ?? {});
}
