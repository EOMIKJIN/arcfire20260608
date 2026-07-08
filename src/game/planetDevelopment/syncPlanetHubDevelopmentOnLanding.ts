import { migrateLegacyPlanetDevModulesForPlanet } from './planetFacilityLegacyMigration';
import { reconcileDefenseSatelliteDevRecordOnLanding } from './planetDefenseSatelliteRuntime';
import { tryCompleteAllPlanetDevJobs } from './planetDevelopmentListRowModel';
import { invalidatePlanetWorldObjectsListCache } from '../../worldObjects/planetWorldObjectsListCacheRegistry';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

/**
 * STAGE 1 착륙·행성 이동·재접속 시 플레이어 행성개발 정본을 디스크·런타임 기준으로 재동기화.
 * - 코어 런타임 hydrate 보장
 * - 레거시 byModuleId 마이그레이션(행성 단위)
 * - 진행 중 install/upgrade job 완료 처리
 * - 월드오브젝트 memo 무효화(방위위성·소행성 런타임 반영)
 */
export async function syncPlanetHubDevelopmentOnLanding(planetId: string): Promise<void> {
  if (!planetId) return;

  const store = usePlanetCoreRuntimeStore.getState();
  if (!store.hydrated) {
    await store.bootstrapFromWorldAsync();
  }

  migrateLegacyPlanetDevModulesForPlanet(planetId);
  reconcileDefenseSatelliteDevRecordOnLanding(planetId);
  tryCompleteAllPlanetDevJobs(planetId);
  invalidatePlanetWorldObjectsListCache(planetId);
}
