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
import { usePlayerStore } from '../store/playerStore';
import { showArcAlert } from '../utils/showArcAlert';
import { purgeAccountLedgerProfileSkillByUid } from './accountLifecycle';

export type LocalAccountResetParams = {
  uid: string | null | undefined;
  currentClanId: string | null;
};

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
