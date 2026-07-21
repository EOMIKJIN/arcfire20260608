import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { runStageNativeReclaimPass } from './runStageNativeReclaimPass';

/**
 * worldmap 체류 중 deep reclaim — 5분 soft 틱과 달리 **GPU layer release + Fresco trim** 포함.
 * 허브 전투 GL 잔존(출발 teardown 미회수분)을 체류 중에 걷어내는 안전망(2026-07-21 PSS 900대).
 *
 * 안전 전제: worldmap focus 상태에서만 호출(허브 unmount — 등록 GPU layer는 전부 잔존분).
 * 호출부(worldmap.tsx)가 focus effect interval/timer로 수명 보장 + transit(isMoving) 중 skip.
 */
export function runGalaxyMapResidentDeepReclaimPass(
  reason: string,
  keepPlanetIds?: readonly string[],
): void {
  runStageNativeReclaimPass({
    stage: 'galaxy_map',
    reason,
    keepPlanetIds,
    reclaimHubSkia: false,
    releaseGpuLayers: true,
  });
  void trimNativeBitmapCachesAsync();
}
