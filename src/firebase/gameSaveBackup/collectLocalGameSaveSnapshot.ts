import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { resolveAppVersion } from '../firestoreClientConfig';
import type {
  GameSaveBackupDoc,
  GameSaveBackupReason,
  GameSaveBackupSnapshot,
} from './gameSaveBackupContract';
import {
  GAME_SAVE_BACKUP_RETENTION_MS,
  GAME_SAVE_BACKUP_SCHEMA_VERSION,
} from './gameSaveBackupContract';
import { PLAYER_GAME_SAVE_BACKUP_KEYS } from './gameSaveBackupKeys';
import { slimGameSaveSnapshotForUpload } from './slimGameSaveSnapshotForUpload';

function parseWorldSummary(raw: string | undefined): { unlockedSystemCount: number; synthUnlockCount: number } {
  if (!raw) {
    const live = useWorldStore.getState().unlockedSystemIds;
    const synth = live.filter((id) => id.startsWith('synth_'));
    return { unlockedSystemCount: live.length, synthUnlockCount: synth.length };
  }
  try {
    const parsed = JSON.parse(raw) as { unlockedSystemIds?: string[] };
    const unlocked = parsed.unlockedSystemIds ?? [];
    return {
      unlockedSystemCount: unlocked.length,
      synthUnlockCount: unlocked.filter((id) => id.startsWith('synth_')).length,
    };
  } catch {
    return { unlockedSystemCount: 0, synthUnlockCount: 0 };
  }
}

function parsePlayerSummary(raw: string | undefined): {
  nickname: string | null;
  currentPlanetId: string | null;
  playerLevel: number | null;
} {
  const live = usePlayerStore.getState().player;
  if (!raw) {
    return {
      nickname: live?.nickname ?? null,
      currentPlanetId: live?.currentPlanetId ?? null,
      playerLevel: live?.level ?? null,
    };
  }
  try {
    const parsed = JSON.parse(raw) as { nickname?: string; currentPlanetId?: string; level?: number };
    return {
      nickname: parsed.nickname ?? live?.nickname ?? null,
      currentPlanetId: parsed.currentPlanetId ?? live?.currentPlanetId ?? null,
      playerLevel: typeof parsed.level === 'number' ? parsed.level : live?.level ?? null,
    };
  } catch {
    return {
      nickname: live?.nickname ?? null,
      currentPlanetId: live?.currentPlanetId ?? null,
      playerLevel: live?.level ?? null,
    };
  }
}

/** 로컬 AsyncStorage에서 플레이어 계정 게임 저장 스냅샷 수집 */
export async function collectLocalGameSaveSnapshot(
  uid: string,
  reason: GameSaveBackupReason,
  nowMs: number = Date.now(),
): Promise<GameSaveBackupDoc> {
  const pairs = await AsyncStorage.multiGet([...PLAYER_GAME_SAVE_BACKUP_KEYS]);
  const snapshot: GameSaveBackupSnapshot = {};
  let worldRaw: string | undefined;
  let playerRaw: string | undefined;
  for (const [key, value] of pairs) {
    if (value == null || value === '') continue;
    snapshot[key] = value;
    if (key === 'arcfire_world_v1') worldRaw = value;
    if (key === 'arcfire_player_v1') playerRaw = value;
  }
  const worldSummary = parseWorldSummary(worldRaw);
  const playerSummary = parsePlayerSummary(playerRaw);
  const { snapshot: slimSnapshot, omittedKeys } = slimGameSaveSnapshotForUpload(snapshot);

  return {
    schemaVersion: GAME_SAVE_BACKUP_SCHEMA_VERSION,
    uid,
    nickname: playerSummary.nickname,
    createdAtMs: nowMs,
    expiresAtMs: nowMs + GAME_SAVE_BACKUP_RETENTION_MS,
    reason,
    appVersion: resolveAppVersion(),
    payloadMode: 'inline',
    snapshot: slimSnapshot,
    omittedKeys: omittedKeys.length > 0 ? omittedKeys : undefined,
    summary: {
      unlockedSystemCount: worldSummary.unlockedSystemCount,
      synthUnlockCount: worldSummary.synthUnlockCount,
      currentPlanetId: playerSummary.currentPlanetId,
      playerLevel: playerSummary.playerLevel,
    },
  };
}

/** @deprecated — estimateGameSaveDocCharSize 사용 */
export function estimateGameSaveSnapshotCharSize(doc: { snapshot: GameSaveBackupSnapshot }): number {
  let total = 0;
  for (const v of Object.values(doc.snapshot)) {
    total += v.length;
  }
  return total;
}
