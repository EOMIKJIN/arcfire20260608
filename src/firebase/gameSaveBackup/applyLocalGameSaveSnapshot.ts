import AsyncStorage from '@react-native-async-storage/async-storage';
import { hydratePlanetGovernorAssignmentStore } from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { useWorldObjectRuntimeStore } from '../../store/worldObjectRuntimeStore';
import { useAccountProfileStore } from '../../store/accountProfileStore';
import { useArcCoreInstanceMissionBoardStore } from '../../store/arcCoreInstanceMissionBoardStore';
import { useArcCoreSpyExpelledStore } from '../../store/arcCoreSpyExpelledStore';
import { useBmExchangeLedgerStore } from '../../store/bmExchangeLedgerStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { hydrateCombatMatchTelemetryCache } from '../../store/combatMatchTelemetryStore';
import { useItemLedgerStore } from '../../store/itemLedgerStore';
import { useMissionStore } from '../../store/missionStore';
import { useNpcCaptainProgressStore } from '../../store/npcCaptainProgressStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { usePlanetMineralLedgerStore } from '../../store/planetMineralLedgerStore';
import { usePlanetNebulaStore } from '../../store/planetNebulaStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSkillDbStore } from '../../store/skillDbStore';
import { useTavernBoardStore } from '../../store/tavernBoardStore';
import { useUserSessionStore } from '../../store/userSessionStore';
import { useWorldStore } from '../../store/worldStore';
import type { GameSaveBackupSnapshot } from './gameSaveBackupContract';
import { PLAYER_GAME_SAVE_BACKUP_KEYS, PLAYER_GAME_SAVE_BACKUP_KEY_SET } from './gameSaveBackupKeys';

export type ApplyGameSaveSnapshotResult = {
  appliedKeyCount: number;
  removedKeyCount: number;
};

/** Firestore 백업 스냅샷 → AsyncStorage + 스토어 재로드 */
export async function applyLocalGameSaveSnapshot(
  snapshot: GameSaveBackupSnapshot,
): Promise<ApplyGameSaveSnapshotResult> {
  const snapshotKeys = new Set(Object.keys(snapshot));
  const toRemove = PLAYER_GAME_SAVE_BACKUP_KEYS.filter((k) => !snapshotKeys.has(k));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    if (!PLAYER_GAME_SAVE_BACKUP_KEY_SET.has(key)) continue;
    if (typeof value !== 'string' || !value) continue;
    pairs.push([key, value]);
  }
  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }
  await reloadAllLocalGameSaveStores();
  return { appliedKeyCount: pairs.length, removedKeyCount: toRemove.length };
}

/** 부트와 동일 순서 — 백업 복구 후 메모리 스토어 동기화 */
export async function reloadAllLocalGameSaveStores(): Promise<void> {
  await Promise.all([
    usePlayerStore.getState().loadLocalPlayer(),
    useClanWarFoundationStore.getState().loadLocalClanWarFoundation(),
    useMissionStore.getState().loadLocalMissions(),
    useArcCoreInstanceMissionBoardStore.getState().loadLocalArcCoreInstanceMissionBoard(),
    useNpcCaptainProgressStore.getState().loadLocalNpcCaptainProgress(),
    usePlanetNebulaStore.getState().loadLocalProfiles(),
    useTavernBoardStore.getState().loadLocalBoard(),
    useWorldStore.getState().loadLocalWorld(),
    useUserSessionStore.getState().loadLocalUserSession(),
    useItemLedgerStore.getState().loadLocalItemLedger(),
    useAccountProfileStore.getState().loadLocalAccountProfiles(),
    useSkillDbStore.getState().loadLocalSkillDb(),
    usePlanetMineralLedgerStore.getState().loadLocal(),
    useBmExchangeLedgerStore.getState().hydrate(),
    useArcCoreSpyExpelledStore.getState().loadLocal(),
  ]);
  await useWorldObjectRuntimeStore.getState().loadLocalRuntime();
  await useWorldObjectRuntimeStore.getState().bootstrapFromWorld(useWorldStore.getState().systems);
  await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  await hydratePlanetGovernorAssignmentStore();
  await hydrateCombatMatchTelemetryCache();
}
