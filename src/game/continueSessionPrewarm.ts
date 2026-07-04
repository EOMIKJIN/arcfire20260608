import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { useNpcCaptainProgressStore } from '../store/npcCaptainProgressStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { resolvePlanetNearbyPresence } from '../npc/nearbyOrbitPresenceSystem';
import { buildCsvStaticIndexesFull } from './buildCsvStaticIndexes';
import { markBootPerf, measureBootPhase } from './bootPerformance';
import { listArcNpcTrafficRowsFromTables } from '../arcCore/arcNpcTrafficTableRegistry';
import { runCriticalSessionAssetPrewarm } from '../assetPipeline/runCriticalSessionAssetPrewarm';
import { resumePlayerToLastHubPlanet, resolveResumeHubPlanetId } from './galaxyMapSessionResume';

/** 이어하기 로딩 UI 최소 유지 시간(ms) — prewarm 완료 후에도 짧게 유지 */
export const CONTINUE_SESSION_MIN_LOADING_MS = 1200;

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * 타이틀「이어하기」→ 인게임 진입 직전에 실행하는 경량 프리로드.
 * 루트 `_layout`에서 이미 대부분 hydrate 되어도, 행성·궤도 경로의 JS·스토어 접근을 한 번 더 깨워 첫 프레임 스파이크를 줄인다.
 * (향후: `expo-asset`·스토리 이미지 프리캐시, 무거운 서브모듈 분할 로드 등을 여기서 확장)
 */
export async function runContinueSessionPrewarm(): Promise<void> {
  await measureBootPhase('continue_prewarm_start', 'continue_prewarm_end', async () => {
    buildCsvStaticIndexesFull();
    // 차원항로(continue-warp) 화면은 Reanimated 워프 애니메이션이 상시 돌아간다.
    // InteractionManager.runAfterInteractions는 인터랙션/전환이 안 풀리면 영구 대기 →
    // prewarm Promise 미완 → planet으로 navigate 못 함(검은 화면 정지). 단순 1프레임 yield로 교체.
    await yieldToUi();

    await runCriticalSessionAssetPrewarm();

    resumePlayerToLastHubPlanet();
    const p = usePlayerStore.getState().player;
    const planetId = p ? resolveResumeHubPlanetId(p) : 'arcadia_prime';
    const systemId = p?.currentSystemId ?? 'arcadia';

    await Promise.all([
      usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync(),
      useNpcCaptainProgressStore.getState().loadLocalNpcCaptainProgress(),
    ]);

    const clanWar = useClanWarFoundationStore.getState();
    clanWar.syncNpcAiClanTerritoryFromGalaxy(useWorldStore.getState().systems, {
      skipOccupationSeedPipeline: true,
    });
    useNpcCaptainProgressStore.getState().ensureCaptainsRegistered(NPC_CAPTAINS_FROM_CSV.map((c) => c.id));

    void resolvePlanetNearbyPresence(planetId, systemId);
    void listArcNpcTrafficRowsFromTables();
    await yieldToUi();
  });
}
