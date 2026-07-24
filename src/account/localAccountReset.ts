import { InteractionManager } from 'react-native';
import { clearCombatResumeSnapshot } from '../combat/combatResumeStore';
import { deleteUserCloudSave } from '../firebase/firestore';
import { getCurrentUser, markFreshStartAfterReset } from '../firebase/auth';
import { resetFirebaseAnonymousAuthForAccountPurge } from '../firebase/firebaseAnonymousAuth';
import { clearArcCoreRtdbDailyKpiPushState } from '../arcCore/learning/pushArcCoreDailyKpiToRtdb';
import { cancelScheduledUserCloudSync } from '../firebase/userCloudSyncSchedule';
import {
  cancelScheduledGameSaveBackup,
  uploadPrePurgeGameSaveBackup,
} from '../firebase/gameSaveBackup/scheduleGameSaveBackup';
import { usePlanetStageLifecycleStore } from '../game/planetStageLifecycle';
import { clearMiningResumeSnapshot } from '../systems/mining/miningResumeStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { resetDynamicContestedZonesForAccountPurge } from '../arcCore/territorial/dynamicContestedZoneStore';
import { resetWaveCombatCooldownsForAccountPurge } from '../game/waveDefense/waveCombatCooldownStore';
import { useMissionStore } from '../store/missionStore';
import { useArcCoreInstanceMissionBoardStore } from '../store/arcCoreInstanceMissionBoardStore';
import { useNpcCaptainProgressStore } from '../store/npcCaptainProgressStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { usePlanetMineralLedgerStore } from '../store/planetMineralLedgerStore';
import { usePlayerStore } from '../store/playerStore';
import { useUserSessionStore } from '../store/userSessionStore';
import { syncArcCoreGlobalWorldExpansionSync } from '../arcCore/syncArcCoreGlobalWorldExpansion';
import { useWorldStore } from '../store/worldStore';
import { useWorldObjectRuntimeStore } from '../store/worldObjectRuntimeStore';
import { useTavernBoardStore } from '../store/tavernBoardStore';
import { useBmExchangeLedgerStore } from '../store/bmExchangeLedgerStore';
import { resetCombatMatchTelemetry } from '../store/combatMatchTelemetryStore';
import { showArcAlert } from '../utils/showArcAlert';
import { clearOnboardingProfessionId } from '../game/onboardingDraftStorage';
import { purgeAccountLedgerProfileSkillByUid } from './accountLifecycle';
import { resetArcInboundDroneCampaigns } from '../arcCore/inboundDrone/resetArcInboundDroneCampaigns';
import { purgeAllPlanetHubScanUnlockState } from '../game/planetHub/planetHubScanUnlockState';
import { useArcCoreSpyExpelledStore } from '../store/arcCoreSpyExpelledStore';
import { useArcCorePantheonCodexStore } from '../arcCore/pantheon/arcCorePantheonCodexStore';
import { useAppBootStore } from '../store/appBootStore';
import { runStageUiAfterIdle } from '../navigation/stageNavGate';
import { useArcOverlayStore } from '../ui/overlay/arcOverlayStore';

export type LocalAccountResetParams = {
  uid: string | null | undefined;
  currentClanId: string | null;
};

/**
 * 계정 초기화 진행 중 플래그 — purge 도중 `resetLocalPlayer()`가 player 를 null 로 만들면
 * 행성 허브의 `!player → router.replace('/')` 안전망이 즉시 발화해, 나머지 purge(코어·월드·
 * 세션·fresh-start 플래그)가 끝나기 전에 타이틀이 조기 노출되는 회귀가 있었다. 이 플래그가
 * 켜진 동안에는 화면 측 자동 리다이렉트를 보류하고, 타이틀 이동은 오직 finalize 가
 * "완전한 purge 완료 후" 1회 수행한다(부하정리 완료 후 복귀 보장).
 */
let accountResetInProgress = false;

/** 계정 초기화(purge) 진행 중 여부 — 화면 측 자동 타이틀 리다이렉트 보류용. */
export function isAccountResetInProgress(): boolean {
  return accountResetInProgress;
}

/**
 * 클라우드 단계(pre-purge 백업 + 클라우드 세이브 삭제) 전체 상한.
 * 오프라인이면 개별 상한(백업 12s + 삭제 10s×N)이 직렬로 누적돼 40~60초 동안
 * 메인스테이지가 아무 피드백 없이 떠 있는 회귀(2026-07-19)가 있었다 —
 * 백업/삭제를 병렬로 돌리고 단계 전체를 한 번에 상한 처리한다.
 * (타임아웃돼도 Firestore SDK가 큐잉해 온라인 복귀 시 자동 반영)
 */
const CLOUD_PURGE_PHASE_MAX_WAIT_MS = 15_000;

const ACCOUNT_RESET_OVERLAY_ID = 'account-reset-blocking';

function presentAccountResetBlockingOverlay(): void {
  try {
    const store = useArcOverlayStore.getState();
    store.dismissWhere((e) => e.id === ACCOUNT_RESET_OVERLAY_ID);
    store.present({
      id: ACCOUNT_RESET_OVERLAY_ID,
      kind: 'blocking',
      message: '계정 초기화 중…',
      dismissOnBackdrop: false,
    });
  } catch {
    /* overlay 실패해도 purge는 진행 */
  }
}

function dismissAccountResetBlockingOverlay(): void {
  try {
    useArcOverlayStore.getState().dismissWhere((e) => e.id === ACCOUNT_RESET_OVERLAY_ID);
  } catch {
    /* ignore */
  }
}

function resolveResetUids(playerUid: string | null | undefined): string[] {
  const ids = new Set<string>();
  const fromPlayer = playerUid?.trim();
  const fromAuth = getCurrentUser().uid?.trim();
  if (fromPlayer) ids.add(fromPlayer);
  if (fromAuth) ids.add(fromAuth);
  return [...ids];
}

/**
 * 행성 허브 Skia·sim 정지(lifecycle frozen) 이후 — 로컬·클라우드 계정 데이터 삭제
 *
 * 의도적 purge 제외(ArcCore 세계 축 · 헌법 수정안 §16-A):
 *   `arcCoreShadowIdentityStore` — 섀도우 페어 관계는 기기(uid) 기반으로 계정 초기화
 *   후에도 유지한다 (대표님 결정 2026-07-13).
 */
export async function purgeLocalAccountData(params: LocalAccountResetParams): Promise<void> {
  cancelScheduledUserCloudSync();
  cancelScheduledGameSaveBackup();

  // fresh-start 보호를 **purge 시작 즉시** 기록한다 — 마지막에 기록하면 purge 도중
  // (클라우드 단계 최대 15s) 강제종료 시 플래그 없이 남아, 재시작 부트에서 클라우드
  // 자동 복원이 초기화한 옛 계정을 되살리는 구멍이 생긴다(2026-07-19 전수검사).
  // 플래그는 새 계정 생성 완료·수동 백업 복구 시에만 해제되므로 선기록해도 무해하다.
  await markFreshStartAfterReset();

  const resetUids = resolveResetUids(params.uid);
  const primaryUid = resetUids[0] ?? null;
  const { currentClanId } = params;

  clearCombatResumeSnapshot();
  clearMiningResumeSnapshot();

  // 클라우드 단계 — 백업·삭제를 병렬로 돌리고 단계 전체를 15s 한 번으로 상한.
  // 릴리즈 부팅 지연 시 `local-guest`로 등록된 고아 users 문서가 남으면
  // 이후 deviceUid 재등록에서 동일 닉네임이 '이미 사용 중'으로 오판되므로 함께 삭제한다.
  const deleteUids = [...resetUids];
  if (primaryUid && primaryUid !== 'local-guest' && !resetUids.includes('local-guest')) {
    deleteUids.push('local-guest');
  }
  // 삭제는 즉시 발행한다 — deleteDoc은 호출 즉시 Firestore 로컬 캐시·영속 mutation 큐에
  // 반영되므로(오프라인 포함), 서버 ack를 기다리다 강제종료돼도 재시작 시 SDK가 이어서
  // 커밋하고, 캐시 읽기에서도 문서는 이미 삭제로 보인다. (백업은 users/{uid} 하위
  // 서브컬렉션에만 쓰므로 부모 문서 삭제와 병렬로 돌려도 안전하다.)
  const cloudPhase = Promise.all([
    ...deleteUids.map((uid) =>
      deleteUserCloudSave(uid).catch(() => {
        /* offline — Firestore queue */
      }),
    ),
    ...resetUids.map(async (uid) => {
      try {
        await uploadPrePurgeGameSaveBackup(uid);
      } catch (e) {
        if (__DEV__) {
          console.warn('[localAccountReset] pre-purge game save backup failed', uid, e);
        }
      }
    }),
  ]).then(() => undefined);
  await Promise.race([
    cloudPhase,
    new Promise<void>((resolve) => {
      setTimeout(resolve, CLOUD_PURGE_PHASE_MAX_WAIT_MS);
    }),
  ]);

  if (primaryUid) {
    await useClanWarFoundationStore.getState().purgePlayerAccountWorldState({
      uid: primaryUid,
      currentClanId,
    });
  }
  for (const uid of resetUids) {
    await purgeAccountLedgerProfileSkillByUid(uid);
  }
  await useClanWarFoundationStore.getState().purgeAllNonAiClanWorldState();
  // 플레이어 전투로 편입된 동적 분쟁지역 — 계정 초기화 시 정적 3곳으로 복귀
  await resetDynamicContestedZonesForAccountPurge();
  // 웨이브 전투 승리 재개 대기(30분) — 플레이어 전투 진행 데이터, 함께 리셋
  await resetWaveCombatCooldownsForAccountPurge();

  await usePlayerStore.getState().resetLocalPlayer();
  await useMissionStore.getState().resetLocalMissions();
  await useArcCoreInstanceMissionBoardStore.getState().resetLocalArcCoreInstanceMissionBoard();
  await useNpcCaptainProgressStore.getState().resetLocalNpcCaptainProgress();
  // ── 플레이어 계정 귀속 — 인터랙티브로 누적된 모든 진행을 함께 초기화한다. ──
  // (ArcCore 환경·자율 경제·RED 월드 행성개발은 제외: faction vault·trade fee·RED planetCore 슬롯)
  // 행성개발(BLUE·증서) — purge 시 baseline · RED ArcCore 슬롯만 유지
  await usePlanetCoreRuntimeStore.getState().resetLocalPlanetCoreRuntimeForAccountPurge();
  await usePlanetMineralLedgerStore.getState().resetLocal();
  // 갤럭시 개방·항행 기록(방문/개방 성계) — worldStore (초기 시드 galaxy로 복귀)
  await useWorldStore.getState().resetLocalWorld();
  syncArcCoreGlobalWorldExpansionSync();
  // 행성 월드오브젝트 인스턴스 상태(방위위성 HP·고갈 노드 등) — worldObjectRuntimeStore
  await useWorldObjectRuntimeStore.getState().resetRuntime();
  // 전투 텔레메트리(교전 기록) — combatMatchTelemetry
  await resetCombatMatchTelemetry();
  // 플레이 세션·투여 시간 — userSessionStore
  await useUserSessionStore.getState().resetLocalUserSession();
  // 선술집 공지 보드(클라우드 동기 대상) — tavernBoardStore
  await useTavernBoardStore.getState().resetLocalBoard();
  await useBmExchangeLedgerStore.getState().resetLocal();
  // 캐릭터 선택 중간 초안 — character-select → nickname 사이 professionId
  await clearOnboardingProfessionId();
  // 행성별 inbound 드론 벽시계 캠페인 — SubCore Map + UI store
  resetArcInboundDroneCampaigns();
  purgeAllPlanetHubScanUnlockState();
  await useArcCoreSpyExpelledStore.getState().resetLocal();
  await useArcCorePantheonCodexStore.getState().resetForAccountPurge();

  await clearArcCoreRtdbDailyKpiPushState();
  await resetFirebaseAnonymousAuthForAccountPurge();
  // fresh-start 플래그는 purge **시작부**에서 이미 기록됨(강제종료 대비 선기록).
}

/**
 * 계정 초기화 — Skia 정지 후 데이터 삭제 → 타이틀 replace.
 * purge 실패 시에도 타이틀 이동은 시도하되, 플레이어 잔존 시 오류 안내.
 */
export async function finalizeLocalAccountResetNavigation(
  navigateToTitle: () => void,
  params: LocalAccountResetParams,
): Promise<void> {
  let purgeError: unknown = null;
  accountResetInProgress = true;
  // purge 동안(오프라인 클라우드 상한 포함 수 초~15초) 메인스테이지가 그대로 떠 있어
  // 「초기화가 안 된다」로 보이던 회귀 방지 — 루트 blocking 오버레이로 진행 상태를 표시한다.
  presentAccountResetBlockingOverlay();
  const purgeStartedAtMs = Date.now();
  try {
    await purgeLocalAccountData(params);
  } catch (e) {
    purgeError = e;
    console.warn('[localAccountReset] purgeLocalAccountData failed:', e);
  } finally {
    usePlanetStageLifecycleStore.getState().forceActive();

    const playerStill = usePlayerStore.getState().player;
    if (playerStill) {
      try {
        await usePlayerStore.getState().resetLocalPlayer();
      } catch {
        /* ignore */
      }
    }

    // 완전한 purge 완료 후에만 타이틀 이동(여기까지 화면 측 리다이렉트는 보류됨).
    // 같은 JS 세션 복귀라 bootReady·postBootSettled가 true로 남아 버튼이 즉시 활성되는데,
    // 잔여 정리·전환 인터랙션이 끝날 때까지 로딩 표시를 유지해 입력 가능 시점과 일치시킨다.
    // ⚠️ InteractionManager 단독 의존 금지 — 전환·Reanimated 인터랙션이 안 풀리면 영구 대기해
    //    postBootSettled=false로 타이틀 버튼이 영원히 잠기는 회귀(2026-07-19 계정 초기화 먹통).
    //    runStageUiAfterIdle = IM idle 또는 2.5s 데드라인 중 먼저 오는 쪽에서 반드시 1회 실행.
    useAppBootStore.getState().setPostBootSettled(false);
    accountResetInProgress = false;
    dismissAccountResetBlockingOverlay();
    // eslint-disable-next-line no-console
    if (__DEV__) console.log(`[reset-diag] purge=${Date.now() - purgeStartedAtMs}ms`);
    navigateToTitle();
    runStageUiAfterIdle(() => {
      useAppBootStore.getState().setPostBootSettled(true);
    });

    if (purgeError || usePlayerStore.getState().player) {
      scheduleAccountResetFailedTip();
    }
  }
}

function scheduleAccountResetFailedTip(): void {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      try {
        showArcAlert(
          '초기화 오류',
          '일부 데이터가 남았을 수 있습니다. 앱을 완전히 종료한 뒤 다시 시도해 주세요.',
        );
      } catch {
        /* ignore */
      }
    }, 280);
  });
}

/**
 * 행성 허브에서 계정 초기화 요청 — lifecycle active면 suspend 후 purge, 아니면 즉시 purge.
 */
export function requestLocalAccountResetFromPlanetHub(
  beginSuspend: (navigate: () => void) => void,
  navigateToTitle: () => void,
  params: LocalAccountResetParams,
): void {
  const run = () => {
    void finalizeLocalAccountResetNavigation(navigateToTitle, params);
  };

  const lifecycle = usePlanetStageLifecycleStore.getState().lifecycle;
  if (lifecycle === 'active') {
    beginSuspend(run);
    return;
  }
  run();
}
