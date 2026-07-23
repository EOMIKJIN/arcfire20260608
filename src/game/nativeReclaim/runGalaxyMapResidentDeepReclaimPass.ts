import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { emitMemProfileMarker } from '../devMemoryProfileBridge';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { runStageNativeReclaimPass } from './runStageNativeReclaimPass';

export type GalaxyMapResidentDeepReclaimOptions = {
  /** true — freeze 잔존 허브가 있을 때 dodge/overlay 강제 해제(기본 false) */
  reclaimHubSkia?: boolean;
};

/**
 * worldmap 체류 중 deep reclaim — 5분 soft 틱과 달리 **GPU layer release + Fresco trim** 포함.
 * 허브 전투 GL 잔존(출발 teardown 미회수분)을 체류 중에 걷어내는 안전망(2026-07-21 PSS 900대).
 *
 * 안전 전제: worldmap focus 상태에서만 호출(허브 unmount — 등록 GPU layer는 전부 잔존분).
 * 호출부(worldmap.tsx)가 focus effect interval/timer로 수명 보장 + transit(isMoving) 중 skip·재시도.
 */
export function runGalaxyMapResidentDeepReclaimPass(
  reason: string,
  keepPlanetIds?: readonly string[],
  opts?: GalaxyMapResidentDeepReclaimOptions,
): void {
  const reclaimHubSkia = opts?.reclaimHubSkia === true;
  if (reclaimHubSkia) {
    // replace 후에도 freeze 잔존·핸들러 잔류 시 overlay 강제 하강. 구독 없으면 no-op.
    signalHubSkiaNativeReclaim(reason);
  }

  runStageNativeReclaimPass({
    stage: 'galaxy_map',
    reason,
    keepPlanetIds,
    reclaimHubSkia: false,
    releaseGpuLayers: true,
  });
  void trimNativeBitmapCachesAsync();

  emitMemProfileMarker({
    stage: 'galaxy_map',
    event: 'deep_reclaim',
    detail: reason,
  });

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(
      `[MEM] runGalaxyMapResidentDeepReclaimPass reason=${reason} hubSkia=${reclaimHubSkia}`,
    );
  }
}
