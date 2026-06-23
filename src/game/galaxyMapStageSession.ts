/**
 * STAGE 2 — 은하계 지도 세션 자원·프레젠테이션 해제
 * scroll만 teardown 하던 releaseGalaxyMapStageMemory 를 full release 로 확장.
 */

import { clearCapitalRealtimeCombatPresentationCaches } from '../combat/clearCapitalRealtimeCombatCaches';
import { releaseGalaxyMapScrollIfRegistered } from './galaxyMapScrollLifecycle';

const deferredTileResetCallbacks = new Set<() => void>();

/** worldmap blur/unmount 시 deferred tile chain 초기화 */
export function registerGalaxyMapDeferredTileReset(reset: () => void): () => void {
  deferredTileResetCallbacks.add(reset);
  return () => {
    deferredTileResetCallbacks.delete(reset);
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

/** STAGE 2 이탈 — scroll + deferred tiles + transit/combat presentation 캐시 */
export function releaseGalaxyMapStageMemoryFull(): void {
  releaseGalaxyMapScrollIfRegistered();
  resetGalaxyMapDeferredTiles();
  clearCapitalRealtimeCombatPresentationCaches();
}
