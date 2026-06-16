// ============================================================
// 온보딩 — 캐릭터 선택 → 닉네임 → 로컬·Firestore 등록 (단일 파이프라인)
// ============================================================

import { bootstrapAccountData, persistAccountDataBundle } from '../account/accountLifecycle';
import { checkNicknameAvailable, createUserDocOnNicknameConfirm } from '../firebase/firestore';
import { syncUserDataWithServer } from '../firebase/userDataSync';
import {
  isRemoteNetworkTimeoutError,
  REMOTE_NETWORK_TIMEOUT_ALERT,
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

export class PilotRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PilotRegistrationError';
  }
}

async function runRemoteRegistrationStep<T>(label: string, step: () => Promise<T>): Promise<T> {
  try {
    return await withRemoteNetworkTimeout(label, step);
  } catch (e) {
    if (isRemoteNetworkTimeoutError(e)) {
      throw new PilotRegistrationError(REMOTE_NETWORK_TIMEOUT_ALERT.message);
    }
    throw e;
  }
}

/** character-select 초안 + CSV 검증 */
export async function resolveOnboardingProfessionId(): Promise<string> {
  const draft = (await getOnboardingProfessionId())?.trim();
  const id = draft || getDefaultPlayerProfession().id;
  if (!getPlayerProfessionById(id)) {
    throw new PilotRegistrationError('선택한 캐릭터 정보를 불러올 수 없습니다. 다시 선택해 주세요.');
  }
  return id;
}

/**
 * 신규 파일럿 등록 — 실패 시 onboarding profession 초안 유지(재시도 가능).
 * 성공 시에만 profession 초안 삭제.
 */
export async function completePilotRegistration(uid: string, nickname: string): Promise<void> {
  const trimmedNick = nickname.trim();
  if (!uid) throw new PilotRegistrationError('인증 정보가 없습니다.');
  if (!trimmedNick) throw new PilotRegistrationError('닉네임을 입력하세요.');

  const playerStore = usePlayerStore.getState();
  const existing = playerStore.player;
  if (existing?.uid && existing.uid !== uid) {
    throw new PilotRegistrationError('다른 계정 데이터가 남아 있습니다. 앱을 재시작해 주세요.');
  }
  if (existing?.uid === uid && existing.nickname?.trim() && existing.flags.introSeen) {
    throw new PilotRegistrationError('이미 등록된 파일럿입니다.');
  }

  const available = await runRemoteRegistrationStep('check_nickname', () =>
    checkNicknameAvailable(trimmedNick),
  );
  if (!available) {
    throw new PilotRegistrationError('이미 사용 중인 닉네임입니다.');
  }

  const professionId = await resolveOnboardingProfessionId();

  playerStore.createPlayer(uid, trimmedNick, professionId);
  const created = usePlayerStore.getState().player;
  if (!created) {
    throw new PilotRegistrationError('캐릭터 생성에 실패했습니다.');
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
    throw new PilotRegistrationError('캐릭터 저장에 실패했습니다.');
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

  useMissionStore.getState().initMissions();

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
}
