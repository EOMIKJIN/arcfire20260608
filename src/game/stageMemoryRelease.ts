// ============================================================
// 스테이지 이탈 시 메모리 해제 — `2.1.memory.md` §4
// ============================================================

import { clearCapitalRealtimeCombatPresentationCaches } from '../combat/clearCapitalRealtimeCombatCaches';
import { releaseGalaxyMapStageMemoryFull, type GalaxyMapStageReleaseOptions } from './galaxyMapStageSession';
import { releasePlanetMainStageSession } from './planetMainStageSession';
import { invalidateAllPlanetMemoCaches } from './planetMemoCache';

/** DEV — 스테이지 dispose 로그 (`2.1.memory.md` §11) */
export function logStageMemoryRelease(stageId: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[MEM] ${stageId} disposed`);
}

/** STAGE 1 — Planet Hub 이탈(포커스 blur·언마운트 공통) */
export function releasePlanetHubStageMemory(previousPlanetId?: string | null): void {
  releasePlanetMainStageSession({
    reason: 'route_blur',
    previousPlanetId: previousPlanetId ?? null,
  });
}

/** STAGE 2 — Galaxy Map full release (memo · nebula · heavyUi · scroll) */
export function releaseGalaxyMapStageMemory(opts?: GalaxyMapStageReleaseOptions): void {
  releaseGalaxyMapStageMemoryFull(opts);
}

/** STAGE 3 — Combat 프레젠테이션 캐시 */
export function releaseCombatStageMemory(): void {
  clearCapitalRealtimeCombatPresentationCaches();
}

/** SUB-STAGE — 행성 시설 로컬 상태 해제 표식 */
export function releasePlanetSubStageMemory(_stageId: string): void {
  /* 로컬 cleanup은 usePlanetSubStageMemory 콜백에서 수행 */
}

/** planetMemoCache 전체 비움 — `releasePlanetMainStageSession` 경유가 정본, 안전망용 */
export function ensurePlanetMemoCachesCleared(): void {
  invalidateAllPlanetMemoCaches();
}
