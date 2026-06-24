import { clearCapitalRealtimeCombatPresentationCaches } from '../combat/clearCapitalRealtimeCombatCaches';
import { releaseAllPlanetSessionResources } from './planetSessionRegistry';
import { invalidatePlanetMemoCachesForPlanet, invalidateAllPlanetMemoCaches } from './planetMemoCache';
import { resetHubInboundDroneDodgeBridge } from '../arcCore/inboundDrone/hubInboundDroneDodgeBridge';
import { runStageNativeReclaimPass } from './nativeReclaim/runStageNativeReclaimPass';
import { runPlanetChangeNativeReclaimLight } from './nativeReclaim/runPlanetChangeNativeReclaimLight';
import { emitMemProfileMarker } from './devMemoryProfileBridge';

export type PlanetMainStageReleaseReason = 'route_blur' | 'planet_change';

/** blur + unmount 이중 release 방지 (views/native floor 계단 방지) */
let lastPlanetMainReleaseKey = '';
let lastPlanetMainReleaseAtMs = 0;
const PLANET_MAIN_RELEASE_DEDUPE_MS = 800;

/**
 * 메인스테이지(행성 허브) 이탈 또는 다른 행성으로 착륙 시, 이전 행성 세션과 연결된
 * 프레젠테이션 계층 정리 훅.
 *
 * 정책:
 *   - `planet_change`: 이전 행성 자원만 정리 (`previousPlanetId` 필수)
 *   - `route_blur`: 메인스테이지 화면 자체를 떠난다 → 모든 행성 세션 자원 정리
 *
 * 정리 대상:
 *   1) 콘텐츠 시스템이 `registerPlanetSessionResource`로 등록한 자원 (월드오브젝트·NPC·스토리 등)
 *   2) 행성 단위 메모 캐시 (`memoizePerPlanet` 헬퍼 기반)
 *   3) 전투 프레젠테이션 캐시(현재는 빈 함수 placeholder)
 *
 * 영속 데이터(게임 진행 스토어·CSV 지표·행성 코어 런타임)는 절대 건드리지 않는다.
 */
export function releasePlanetMainStageSession(opts: {
  reason: PlanetMainStageReleaseReason;
  previousPlanetId?: string | null;
}): void {
  const releaseKey = `${opts.reason}:${opts.previousPlanetId ?? ''}`;
  const now = Date.now();
  if (
    releaseKey === lastPlanetMainReleaseKey
    && now - lastPlanetMainReleaseAtMs < PLANET_MAIN_RELEASE_DEDUPE_MS
  ) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[MEM] releasePlanetMainStageSession dedupe ${releaseKey}`);
    }
    return;
  }
  lastPlanetMainReleaseKey = releaseKey;
  lastPlanetMainReleaseAtMs = now;

  releaseAllPlanetSessionResources({
    reason: opts.reason,
    previousPlanetId: opts.previousPlanetId ?? null,
  });

  if (opts.reason === 'planet_change' && opts.previousPlanetId) {
    invalidatePlanetMemoCachesForPlanet(opts.previousPlanetId);
  } else if (opts.reason === 'route_blur') {
    invalidateAllPlanetMemoCaches();
  }

  clearCapitalRealtimeCombatPresentationCaches();
  resetHubInboundDroneDodgeBridge();

  if (opts.reason === 'planet_change' && opts.previousPlanetId) {
    runPlanetChangeNativeReclaimLight(opts.previousPlanetId);
    emitMemProfileMarker({
      stage: 'planet_hub',
      event: 'planet_change',
      detail: opts.previousPlanetId ?? '',
    });
    return;
  }

  const keepPlanetIds = opts.reason === 'route_blur' && opts.previousPlanetId?.trim()
    ? [opts.previousPlanetId.trim()]
    : [];

  runStageNativeReclaimPass({
    stage: 'planet_hub',
    reason: opts.reason,
    keepPlanetIds,
    reclaimHubSkia: true,
    releaseGpuLayers: true,
  });
  emitMemProfileMarker({
    stage: 'planet_hub',
    event: opts.reason === 'route_blur' ? 'route_blur' : 'manual',
    detail: opts.previousPlanetId ?? '',
  });
}
