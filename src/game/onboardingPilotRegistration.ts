// ============================================================
// 온보딩 — 캐릭터 선택 → 닉네임 → 로컬·Firestore 등록 (단일 파이프라인)
// ============================================================

import { bootstrapAccountData, persistAccountDataBundle } from '../account/accountLifecycle';
import { runArcCoreShadowPairingPass } from '../arcCore/shadow/runArcCoreShadowPairingPass';
import { checkNicknameAvailable, createUserDocOnNicknameConfirm } from '../firebase/firestore';
import { clearFreshStartAfterAccountCreated } from '../firebase/auth';
import { checkNicknameRegistry, reserveNickname } from '../firebase/nicknameRegistry';
import { syncUserDataWithServer } from '../firebase/userDataSync';
import {
  isRemoteNetworkTimeoutError,
  withRemoteNetworkTimeout,
} from './sessionLoadingPolicy';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import {
  clearOnboardingProfessionId,
  getOnboardingProfessionId,
} from './onboardingDraftStorage';
import {
  getDefaultPlayerProfession,
  getPlayerProfessionById,
} from './playerPilotProfessionModel';

export type PilotRegistrationErrorCode =
  | 'profession_not_found'
  | 'no_auth'
  | 'nickname_required'
  | 'account_mismatch'
  | 'already_registered'
  | 'nickname_taken'
  | 'create_failed'
  | 'save_failed'
  | 'network_timeout';

export class PilotRegistrationError extends Error {
  readonly code: PilotRegistrationErrorCode;

  constructor(code: PilotRegistrationErrorCode) {
    super(code);
    this.name = 'PilotRegistrationError';
    this.code = code;
  }
}

/**
 * 닉네임 조회·예약 — offline/`null` 폴백 계약.
 * hard `network_timeout` throw 금지: Firestore·Auth가 offline이면 getDoc이 내부 6s까지
 * 늘어지는데, 바깥 5초 reject가 먼저 뜨면 신규 등록이 팝업으로 막힌다
 * (실측: purge 직후 `[ArcCore/RTDB] boot sync skip (offline)` + pilotReg.network_timeout).
 * 상한 초과 시 soft-offline으로 로컬 진행(예약은 온라인 복귀 시 소급).
 */
async function runNicknameRemoteStepSoft<T>(
  label: string,
  step: () => Promise<T>,
  onSoftOffline: () => T,
  markSoftOffline: () => void,
): Promise<T> {
  try {
    return await withRemoteNetworkTimeout(label, step);
  } catch (e) {
    markSoftOffline();
    if (__DEV__) {
      const reason = isRemoteNetworkTimeoutError(e) ? 'remote timeout' : 'error';
      console.log(`[pilotReg] ${label} soft-offline (${reason}) — local continue`);
    }
    return onSoftOffline();
  }
}

/** 로컬 계정 확정 후 클라우드 쓰기 — 실패해도 등록 성공. offline이면 await 생략. */
function schedulePilotCloudSync(opts: {
  uid: string;
  nickname: string;
  professionId?: string;
  alreadySoftOffline: boolean;
}): void {
  const run = async () => {
    try {
      await createUserDocOnNicknameConfirm(opts.uid, opts.nickname, {
        professionId: opts.professionId,
      });
    } catch {
      /* createUserDoc 내부도 offline swallow */
    }
    try {
      await syncUserDataWithServer();
    } catch {
      /* 정기 sync가 소급 */
    }
  };

  if (opts.alreadySoftOffline) {
    if (__DEV__) {
      console.log(
        '[pilotReg] cloud sync deferred (firebase offline) — local account OK; retry on reconnect',
      );
    }
    void run();
    return;
  }

  void (async () => {
    try {
      await withRemoteNetworkTimeout('create_user_doc', () =>
        createUserDocOnNicknameConfirm(opts.uid, opts.nickname, {
          professionId: opts.professionId,
        }),
      );
      await withRemoteNetworkTimeout('sync_user_data', () => syncUserDataWithServer());
    } catch {
      if (__DEV__) {
        console.log(
          '[pilotReg] cloud sync deferred (timeout) — local account OK; retry on reconnect',
        );
      }
      void run();
    }
  })();
}

/** character-select 초안 + CSV 검증 */
export async function resolveOnboardingProfessionId(): Promise<string> {
  const draft = (await getOnboardingProfessionId())?.trim();
  const id = draft || getDefaultPlayerProfession().id;
  if (!getPlayerProfessionById(id)) {
    throw new PilotRegistrationError('profession_not_found');
  }
  return id;
}

/**
 * 신규 파일럿 등록 — 실패 시 onboarding profession 초안 유지(재시도 가능).
 * 성공 시에만 profession 초안 삭제.
 */
export async function completePilotRegistration(uid: string, nickname: string): Promise<void> {
  const trimmedNick = nickname.trim();
  if (!uid) throw new PilotRegistrationError('no_auth');
  if (!trimmedNick) throw new PilotRegistrationError('nickname_required');

  const playerStore = usePlayerStore.getState();
  const existing = playerStore.player;
  if (existing?.uid && existing.uid !== uid) {
    throw new PilotRegistrationError('account_mismatch');
  }
  if (existing?.uid === uid && existing.nickname?.trim() && existing.flags.introSeen) {
    throw new PilotRegistrationError('already_registered');
  }

  let cloudSoftOffline = false;
  const markSoftOffline = () => {
    cloudSoftOffline = true;
  };

  // 닉네임 검사·예약은 offline 허용 계약 — hard network_timeout 금지(내부 6s race → 'offline').
  const available = await runNicknameRemoteStepSoft(
    'check_nickname',
    () => checkNicknameAvailable(trimmedNick, { excludeUid: uid }),
    () => true,
    markSoftOffline,
  );
  if (!available) {
    throw new PilotRegistrationError('nickname_taken');
  }

  // 닉네임 예약 확정(create-only 문서) — 동시 가입 레이스 최종 차단.
  // 오프라인이면 예약을 미루고 진행(정기 동기화의 소급 예약이 재시도).
  const reserved = await runNicknameRemoteStepSoft(
    'reserve_nickname',
    () => reserveNickname(trimmedNick, uid),
    () => false,
    markSoftOffline,
  );
  if (!reserved) {
    const state = await runNicknameRemoteStepSoft(
      'recheck_nickname',
      () => checkNicknameRegistry(trimmedNick, { excludeUid: uid }),
      () => 'offline' as const,
      markSoftOffline,
    );
    if (state === 'taken') {
      throw new PilotRegistrationError('nickname_taken');
    }
  }

  const professionId = await resolveOnboardingProfessionId();

  playerStore.createPlayer(uid, trimmedNick, professionId);
  const created = usePlayerStore.getState().player;
  if (!created) {
    throw new PilotRegistrationError('create_failed');
  }

  usePlayerStore.getState().setPlayer({
    ...created,
    flags: {
      ...created.flags,
      introSeen: true,
      firstMissionStarted: true,
    },
  });

  const player = usePlayerStore.getState().player;
  if (!player) {
    throw new PilotRegistrationError('save_failed');
  }

  bootstrapAccountData({
    uid: player.uid,
    nickname: player.nickname,
    ownedSkillIds: player.skills,
    playerLevel: player.level,
  });

  useClanWarFoundationStore.getState().ensureSoloClan(
    player.uid,
    player.nickname,
    player.political.megaFactionId,
  );

  useMissionStore.getState().initTutorialStory();

  // 로컬 persist 먼저 확정 — 클라우드 쓰기는 실패해도 등록 성공(2026-07-19 회귀 방지).
  await usePlayerStore.getState().persist();
  await persistAccountDataBundle();
  await useClanWarFoundationStore.getState().persistClanWarFoundation();
  await clearOnboardingProfessionId();
  // 새 계정 생성 완료 — 초기화 후 클라우드 자동 복원 차단(fresh-start)을 해제한다.
  await clearFreshStartAfterAccountCreated();

  // 클라우드 create/sync — 닉네임 단계에서 이미 soft-offline이면 5s×2 await 생략(경고 스팸·지연 방지).
  // SDK 큐 + 정기 syncUserDataWithServer가 온라인 복귀 시 소급.
  schedulePilotCloudSync({
    uid: player.uid,
    nickname: player.nickname,
    professionId: player.pilotProfile?.professionId,
    alreadySoftOffline: cloudSoftOffline,
  });

  // 아크코어 섀도우 페어링 — 온보딩 성공 직후 1회 (실패 시 부트 소급 패스가 재시도)
  void runArcCoreShadowPairingPass();
}
