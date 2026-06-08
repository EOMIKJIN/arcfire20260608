import type { Player } from '../types';
import { useAccountProfileStore } from '../store/accountProfileStore';
import { useUserSessionStore } from '../store/userSessionStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useItemLedgerStore } from '../store/itemLedgerStore';
import { usePlayerStore } from '../store/playerStore';
import { useSkillDbStore } from '../store/skillDbStore';

type BootstrapParams = {
  uid: string;
  nickname: string;
  ownedSkillIds?: string[];
  playerLevel?: number;
};

export function bootstrapAccountData({
  uid,
  nickname,
  ownedSkillIds = [],
  playerLevel = 1,
}: BootstrapParams): void {
  const ledger = useItemLedgerStore.getState();
  const profile = useAccountProfileStore.getState();
  const skillDb = useSkillDbStore.getState();
  ledger.ensureAccountLedger(uid);
  profile.ensureAccountProfile(uid, nickname);
  skillDb.ensureSkillDb(uid);
  skillDb.syncOwnedSkills({
    uid,
    ownedSkillIds,
    playerLevel,
    source: 'unknown',
  });
}

/** Firestore에서 플레이어를 복구한 직후 로컬 계정·클랜 DB를 맞춘다 */
export function bootstrapPlayerAfterCloudRestore(player: Player): void {
  const session = useUserSessionStore.getState().record;
  useClanWarFoundationStore
    .getState()
    .ensureSoloClan(player.uid, player.nickname, player.political.megaFactionId);
  bootstrapAccountData({
    uid: player.uid,
    nickname: player.nickname,
    ownedSkillIds: player.skills,
    playerLevel: player.level,
  });
  useAccountProfileStore.getState().syncFromPlayerAndSession(player, session);
}

export async function persistAccountDataBundle(): Promise<void> {
  const ledger = useItemLedgerStore.getState();
  const profile = useAccountProfileStore.getState();
  const skillDb = useSkillDbStore.getState();
  await ledger.persistItemLedger();
  await profile.persistAccountProfiles();
  await skillDb.persistSkillDb();
}

/** 계정 `uid`에 매달린 로컬 DB(아이템 장부·프로필·스킬)만 제거 — 플레이어 스토어는 호출자가 정리한다. */
export async function purgeAccountLedgerProfileSkillByUid(uid: string): Promise<void> {
  if (!uid) return;
  const ledger = useItemLedgerStore.getState();
  const profile = useAccountProfileStore.getState();
  const skillDb = useSkillDbStore.getState();
  ledger.purgeAccountLedger(uid);
  profile.purgeAccountProfile(uid);
  skillDb.purgeAccountSkillDb(uid);
  await persistAccountDataBundle();
}

/**
 * 계정 `uid`에 매달린 로컬 DB(아이템 장부·프로필·스킬)를 제거한다.
 * 로컬 플레이어(`arcfire_player_v1`, 내 함선 `ship.equipSlots` 포함)가 동일 `uid`이면 함께 초기화한다.
 */
export async function purgeAccountDataByUid(uid: string): Promise<void> {
  if (!uid) return;
  const localPlayer = usePlayerStore.getState().player;
  await purgeAccountLedgerProfileSkillByUid(uid);
  if (localPlayer?.uid === uid) {
    await usePlayerStore.getState().resetLocalPlayer();
  }
}
