// ============================================================
// 온보딩 — 캐릭터 선택 → 닉네임 → 로컬·Firestore 등록 (단일 파이프라인)
// ============================================================

import { bootstrapAccountData, persistAccountDataBundle } from '../account/accountLifecycle';
import { runArcCoreShadowPairingPass } from '../arcCore/shadow/runArcCoreShadowPairingPass';
import { checkNicknameAvailable, createUserDocOnNicknameConfirm } from '../firebase/firestore';
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

async function runRemoteRegistrationStep<T>(label: string, step: () => Promise<T>): Promise<T> {
  try {
    return await withRemoteNetworkTimeout(label, step);
  } catch (e) {
    if (isRemoteNetworkTimeoutError(e)) {
      throw new PilotRegistrationError('network_timeout');
    }
    throw e;
  }
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

  const available = await runRemoteRegistrationStep('check_nickname', () =>
    checkNicknameAvailable(trimmedNick, { excludeUid: uid }),
  );
  if (!available) {
    throw new PilotRegistrationError('nickname_taken');
  }

  // 닉네임 예약 확정(create-only 문서) — 동시 가입 레이스 최종 차단.
  // 오프라인이면 예약을 미루고 진행(정기 동기화의 소급 예약이 재시도).
  const reserved = await runRemoteRegistrationStep('reserve_nickname', () =>
    reserveNickname(trimmedNick, uid),
  );
  if (!reserved) {
    const state = await checkNicknameRegistry(trimmedNick, { excludeUid: uid });
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

  await runRemoteRegistrationStep('create_user_doc', () =>
    createUserDocOnNicknameConfirm(player.uid, player.nickname, {
      professionId: player.pilotProfile?.professionId,
    }),
  );
  await usePlayerStore.getState().persist();
  await persistAccountDataBundle();
  await useClanWarFoundationStore.getState().persistClanWarFoundation();
  await runRemoteRegistrationStep('sync_user_data', () => syncUserDataWithServer());
  await clearOnboardingProfessionId();

  // 아크코어 섀도우 페어링 — 온보딩 성공 직후 1회 (실패 시 부트 소급 패스가 재시도)
  void runArcCoreShadowPairingPass();
}
