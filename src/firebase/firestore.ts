import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Player } from '../types';

const USERS_COLLECTION = 'users';
/** 재설치 등 — 로컬·캐시 힌트 있을 때 서버 복구 상한(ms) */
const CLOUD_PLAYER_RESTORE_MS = 2_000;
const BATTLES_COLLECTION = 'battles';
const ADMIN_UID_ALLOWLIST = new Set(
  (process.env.EXPO_PUBLIC_ADMIN_DEVICE_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
);

export interface FirestoreUserProfileUpsert {
  uid: string;
  nickname: string;
  createdAt: number;
  lastLogin: number;
  deviceModel: string;
  role?: 'admin' | 'user';
}

export interface FirestoreBattleResultInput {
  uid: string;
  nickname: string;
  win: boolean;
  enemyType: string;
  durationSec: number;
  participantCount: number;
  finishedAt: number;
}

export async function upsertUserProfileToFirestore(payload: FirestoreUserProfileUpsert): Promise<void> {
  if (!payload.uid) return;
  const safeNickname = payload.nickname.trim() || 'Unknown';
  try {
    await firestore().collection(USERS_COLLECTION).doc(payload.uid).set(
      {
        uid: payload.uid,
        nickname: safeNickname,
        role: payload.role ?? 'user',
        createdAt: payload.createdAt,
        lastLogin: payload.lastLogin,
        deviceModel: payload.deviceModel,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('[firestore] upsertUserProfileToFirestore skipped (offline/queued):', e);
  }
}

export async function createBattleResultLogToFirestore(input: FirestoreBattleResultInput): Promise<void> {
  if (!input.uid) return;
  try {
    await firestore().collection(BATTLES_COLLECTION).add({
      uid: input.uid,
      nickname: input.nickname.trim() || 'Unknown',
      win: input.win,
      enemyType: input.enemyType,
      durationSec: input.durationSec,
      participantCount: input.participantCount,
      finishedAt: input.finishedAt,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.warn('[firestore] createBattleResultLogToFirestore skipped (offline/queued):', e);
  }
}

function snapExists(snap: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  return typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
}

function parsePlayerFromSnap(snap: FirebaseFirestoreTypes.DocumentSnapshot): Player | null {
  if (!snapExists(snap)) return null;
  const data = snap.data() as Record<string, unknown> | undefined;
  if (!data) return null;
  const nested = data.player;
  if (nested && typeof nested === 'object') return nested as unknown as Player;
  return data as unknown as Player;
}

async function getServerSnapWithTimeout(
  ref: FirebaseFirestoreTypes.DocumentReference,
  ms: number,
): Promise<FirebaseFirestoreTypes.DocumentSnapshot | null> {
  return Promise.race([
    ref.get({ source: 'server' }),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export type CloudRestoreResult =
  | { kind: 'restored'; player: Player }
  | { kind: 'no_cloud_account' };

export type CloudRestoreOptions = {
  /** `arcfire_account_profile_v1`에 이 uid 닉네임 흔적이 있으면 true */
  hadLocalAccountMeta?: boolean;
};

/**
 * 로컬 플레이어 없을 때 타이틀 등에서 호출.
 * - 캐시에 세이브 있음 → 즉시 복구
 * - 로컬·Firestore 캐시 힌트 없음 → 서버 대기 없이 신규(닉네임)
 * - 힌트 있음 → 짧은 서버 복구만 시도
 */
export async function tryRestorePlayerFromCloud(
  uid: string,
  opts?: CloudRestoreOptions,
): Promise<CloudRestoreResult> {
  if (!uid) return { kind: 'no_cloud_account' };
  const ref = firestore().collection(USERS_COLLECTION).doc(uid);
  const hadLocalMeta = opts?.hadLocalAccountMeta === true;
  try {
    let cacheHadDoc = false;
    try {
      const cached = await ref.get({ source: 'cache' });
      cacheHadDoc = snapExists(cached);
      if (cacheHadDoc) {
        const fromCache = parsePlayerFromSnap(cached);
        if (fromCache) return { kind: 'restored', player: fromCache };
      }
    } catch {
      /* 오프라인 캐시 미사용 환경 */
    }

    if (!cacheHadDoc && !hadLocalMeta) {
      return { kind: 'no_cloud_account' };
    }

    const serverSnap = await getServerSnapWithTimeout(ref, CLOUD_PLAYER_RESTORE_MS);
    if (!serverSnap || !snapExists(serverSnap)) return { kind: 'no_cloud_account' };
    const fromServer = parsePlayerFromSnap(serverSnap);
    if (fromServer) return { kind: 'restored', player: fromServer };
    return { kind: 'no_cloud_account' };
  } catch (e) {
    console.warn('[firestore] tryRestorePlayerFromCloud failed:', e);
    return { kind: 'no_cloud_account' };
  }
}

/** @deprecated 타이틀 `tryRestorePlayerFromCloud` 사용 — 부팅 경로에서 호출하지 않음 */
export async function loadPlayerFromFirestore(_uid: string): Promise<Player | null> {
  const result = await tryRestorePlayerFromCloud(_uid);
  return result.kind === 'restored' ? result.player : null;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const n = nickname.trim();
  if (!n) return false;
  try {
    const snap = await firestore()
      .collection(USERS_COLLECTION)
      .where('nickname', '==', n)
      .limit(1)
      .get();
    return snap.empty;
  } catch (e) {
    // 오프라인에서는 로컬 플레이를 막지 않는다(중복 검증은 온라인 복귀 시 최종 반영).
    console.warn('[firestore] checkNicknameAvailable failed (offline fallback allow):', e);
    return true;
  }
}

export async function registerNickname(_nickname: string): Promise<void> {
  return;
}

export function isAdminDeviceUid(uid: string): boolean {
  if (!uid) return false;
  if (uid === 'local-guest') return true;
  return ADMIN_UID_ALLOWLIST.has(uid);
}

export async function createUserDocOnNicknameConfirm(uid: string, nickname: string): Promise<void> {
  if (!uid) return;
  const safeNickname = nickname.trim() || 'Unknown';
  try {
    await firestore().collection(USERS_COLLECTION).doc(uid).set(
      {
        uid,
        nickname: safeNickname,
        isAdmin: isAdminDeviceUid(uid),
        createdAt: firestore.FieldValue.serverTimestamp(),
        server_updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('[firestore] createUserDocOnNicknameConfirm skipped (offline/queued):', e);
  }
}

export async function incrementInventoryItemOnServer(
  uid: string,
  itemId: string,
  deltaQty: number,
): Promise<void> {
  if (!uid || !itemId || !deltaQty) return;
  const itemField = `inventory.ledgersByUid.${uid}.balances.${itemId}`;
  const txnsField = `inventory.ledgersByUid.${uid}.txns`;
  try {
    await firestore().collection(USERS_COLLECTION).doc(uid).set(
      {
        uid,
        [itemField]: firestore.FieldValue.increment(deltaQty),
        [txnsField]: [],
        server_updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('[firestore] incrementInventoryItemOnServer skipped (offline/queued):', e);
  }
}
