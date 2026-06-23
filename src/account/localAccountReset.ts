import { InteractionManager } from 'react-native';
import { clearCombatResumeSnapshot } from '../combat/combatResumeStore';
import { deleteUserCloudSave } from '../firebase/firestore';
import { getCurrentUser, markFreshStartAfterReset } from '../firebase/auth';
import { cancelScheduledUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { usePlanetStageLifecycleStore } from '../game/planetStageLifecycle';
import { clearMiningResumeSnapshot } from '../systems/mining/miningResumeStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useMissionStore } from '../store/missionStore';
import { useNpcCaptainProgressStore } from '../store/npcCaptainProgressStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { usePlayerStore } from '../store/playerStore';
import { useUserSessionStore } from '../store/userSessionStore';
import { applyArcCoreAccountFreshStartSeedUnlock } from '../arcCore/worldExpansionFreshStartSeed';
import { useWorldStore } from '../store/worldStore';
import { useWorldObjectRuntimeStore } from '../store/worldObjectRuntimeStore';
import { useTavernBoardStore } from '../store/tavernBoardStore';
import { useBmExchangeLedgerStore } from '../store/bmExchangeLedgerStore';
import { resetCombatMatchTelemetry } from '../store/combatMatchTelemetryStore';
import { showArcAlert } from '../utils/showArcAlert';
import { clearOnboardingProfessionId } from '../game/onboardingDraftStorage';
import { purgeAccountLedgerProfileSkillByUid } from './accountLifecycle';

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

function resolveResetUids(playerUid: string | null | undefined): string[] {
  const ids = new Set<string>();
  const fromPlayer = playerUid?.trim();
  const fromAuth = getCurrentUser().uid?.trim();
  if (fromPlayer) ids.add(fromPlayer);
  if (fromAuth) ids.add(fromAuth);
  return [...ids];
}

/** 행성 허브 Skia·sim 정지(lifecycle frozen) 이후 — 로컬·클라우드 계정 데이터 삭제 */
export async function purgeLocalAccountData(params: LocalAccountResetParams): Promise<void> {
  cancelScheduledUserCloudSync();

  const resetUids = resolveResetUids(params.uid);
  const primaryUid = resetUids[0] ?? null;
  const { currentClanId } = params;

  clearCombatResumeSnapshot();
  clearMiningResumeSnapshot();

  for (const uid of resetUids) {
    await deleteUserCloudSave(uid);
  }
  // 릴리즈 부팅 지연 시 `local-guest`로 등록된 고아 users 문서가 남으면
  // 이후 deviceUid 재등록에서 동일 닉네임이 '이미 사용 중'으로 오판된다.
  if (primaryUid && primaryUid !== 'local-guest' && !resetUids.includes('local-guest')) {
    await deleteUserCloudSave('local-guest');
  }

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

  await usePlayerStore.getState().resetLocalPlayer();
  await useMissionStore.getState().resetLocalMissions();
  await useNpcCaptainProgressStore.getState().resetLocalNpcCaptainProgress();
  // ── 플레이어 계정 귀속 — 인터랙티브로 누적된 모든 진행을 함께 초기화한다. ──
  // (ArcCore 환경·자율 경제 시스템은 제외: faction vault·trade fee ledger·galaxy 확장)
  // 행성개발(R/P/D/T/E·방위위성·개발 모듈) — planetCoreRuntimeStore
  await usePlanetCoreRuntimeStore.getState().resetLocalPlanetCoreRuntime();
  // 갤럭시 개방·항행 기록(방문/개방 성계) — worldStore (초기 시드 galaxy로 복귀)
  await useWorldStore.getState().resetLocalWorld();
  applyArcCoreAccountFreshStartSeedUnlock();
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

  await markFreshStartAfterReset();
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
    accountResetInProgress = false;
    navigateToTitle();

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
