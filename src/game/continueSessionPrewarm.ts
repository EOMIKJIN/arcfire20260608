import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { useNpcCaptainProgressStore } from '../store/npcCaptainProgressStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { resolvePlanetNearbyPresence } from '../npc/nearbyOrbitPresenceSystem';
import { buildCsvStaticIndexesFull } from './buildCsvStaticIndexes';
import { logBootPerfSummary, markBootPerf, measureBootPhase } from './bootPerformance';
import { listArcNpcTrafficRowsFromTables } from '../arcCore/arcNpcTrafficTableRegistry';
import { runCriticalSessionAssetPrewarm } from '../assetPipeline/runCriticalSessionAssetPrewarm';
import { resumePlayerToLastHubPlanet, resolveResumeHubPlanetId } from './galaxyMapSessionResume';
import { waitForArcCoreDailyBatchIdle } from '../arcCore/schedule/arcCoreDailyBatchGate';
import { waitForArcCoreWallClockCatchUpIdle } from '../arcCore/schedule/arcCoreWallClockCatchUpGate';

/** 이어하기 로딩 UI 최소 유지 시간(ms) — prewarm 완료 후에도 짧게 유지 */
export const CONTINUE_SESSION_MIN_LOADING_MS = 1200;

export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/** catch-up 합류 상한 — 벽시계 catch-up·territorial probe는 네트워크 호출이 없어 정상적으로는
 * 훨씬 빨리 끝난다. 순수 안전장치. */
const CATCH_UP_JOIN_TIMEOUT_MS = 12_000;
/**
 * 일일 배치 합류 상한(UX soft cap) — 정상 완주는 관측상 수십 초대(오프라인 실측
 * 32.5s, 실기는 더 빠를 수 있음). 45s는 체감상 너무 길다는 대표님 UX 판단으로
 * 20~25s대로 하향(김팀장 Wave R1-b). 초과해도 배치는 백그라운드에서 계속 진행되고
 * (join 포기 ≠ cancel) 완료 시 markCompleted·trend는 정상 반영 — 다음 화면 재진입 시
 * 최신 상태가 보인다.
 */
const DAILY_BATCH_JOIN_TIMEOUT_MS = 24_000;

/**
 * `waitFor...Idle()`은 자체 타임아웃이 없다 — 합류 대상 Promise가 어떤 이유로든(네트워크
 * 행 등) 영원히 안 풀리면 차원항로 로딩 화면이 무한 대기로 보인다(2026-08-04 대표님 실기
 * 재현). 원인(RTDB 오프라인 write 무한대기, `pushArcCoreDailyKpiToRtdb.ts`)은 별도로
 * 타임아웃을 넣어 막았지만, 이 지점에도 상한을 둬 향후 유사 회귀에서도 로딩이 절대
 * 영구 고착되지 않게 한다. 타임아웃돼도 대상 작업 자체는 백그라운드에서 계속 진행된다
 * (join만 포기 — 취소 아님).
 */
function withJoinTimeout(promise: Promise<void>, timeoutMs: number): Promise<void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}

/**
 * 타이틀「이어하기」/차원항로 → 인게임 진입 직전 프리로드·세계 합류 슬롯(정본).
 * 일일 배치·벽시계 catch-up·에셋 prewarm·full CSV index 등 **무거운 작업은 전부 여기**.
 * 시작화면(타이틀) 버튼 활성화 경로에 두지 말 것 (개발규칙 · 2026-08-04 재명기).
 */
export async function runContinueSessionPrewarm(): Promise<void> {
  await measureBootPhase('continue_prewarm_start', 'continue_prewarm_end', async () => {
    buildCsvStaticIndexesFull();
    // 차원항로(continue-warp) 화면은 Reanimated 워프 애니메이션이 상시 돌아간다.
    // InteractionManager.runAfterInteractions는 인터랙션/전환이 안 풀리면 영구 대기 →
    // prewarm Promise 미완 → planet으로 navigate 못 함(검은 화면 정지). 단순 1프레임 yield로 교체.
    await yieldToUi();

    // 부트에서 백그라운드 발화된 벽시계 catch-up·일일 배치 합류 — 타이틀에 두지 않음.
    // (없으면 즉시 반환) 이후 planetCore / presence 가 최신 상태를 읽도록 앞에 둔다.
    // 각각 상한 시간을 둬, 무슨 이유로든 안 끝나도 로딩 화면이 영구 고착되지 않는다.
    // 아래 마커는 __DEV__ 전용 상시 계측(임시 아님) — 실기에서 어느 단계가 긴지 즉시 판별.
    markBootPerf('continue_join_catchup_start');
    await withJoinTimeout(waitForArcCoreWallClockCatchUpIdle(), CATCH_UP_JOIN_TIMEOUT_MS);
    markBootPerf('continue_join_catchup_end');

    markBootPerf('continue_join_daily_start');
    await withJoinTimeout(waitForArcCoreDailyBatchIdle(), DAILY_BATCH_JOIN_TIMEOUT_MS);
    markBootPerf('continue_join_daily_end');

    markBootPerf('continue_assets_start');
    await runCriticalSessionAssetPrewarm();
    markBootPerf('continue_assets_end');

    resumePlayerToLastHubPlanet();
    const p = usePlayerStore.getState().player;
    const planetId = p ? resolveResumeHubPlanetId(p) : 'arcadia_prime';
    const systemId = p?.currentSystemId ?? 'arcadia';

    markBootPerf('continue_bootstrap_start');
    await Promise.all([
      usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync(),
      useNpcCaptainProgressStore.getState().loadLocalNpcCaptainProgress(),
    ]);
    markBootPerf('continue_bootstrap_end');

    const clanWar = useClanWarFoundationStore.getState();
    clanWar.syncNpcAiClanTerritoryFromGalaxy(useWorldStore.getState().systems, {
      skipOccupationSeedPipeline: true,
    });
    useNpcCaptainProgressStore.getState().ensureCaptainsRegistered(NPC_CAPTAINS_FROM_CSV.map((c) => c.id));

    void resolvePlanetNearbyPresence(planetId, systemId);
    void listArcNpcTrafficRowsFromTables();
    await yieldToUi();
  });
  logBootPerfSummary('continue_prewarm');
}
