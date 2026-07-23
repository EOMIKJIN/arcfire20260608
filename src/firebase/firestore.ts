import { increment, serverTimestamp } from '@react-native-firebase/firestore';
import { Player } from '../types';
import {
  deleteDoc,
  getDocFromCache,
  getDocFromServer,
  setDoc,
  userDocRef,
} from './firestoreRefs';
import { ensureFirebaseAnonymousAuth } from './firebaseAnonymousAuth';
import { checkNicknameRegistry } from './nicknameRegistry';

/** 재설치 등 — 로컬·캐시 힌트 있을 때 서버 복구 상한(ms) */
const CLOUD_PLAYER_RESTORE_MS = 2_000;
const ADMIN_UID_ALLOWLIST = new Set(
  (process.env.EXPO_PUBLIC_ADMIN_DEVICE_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
);

function snapExists(snap: { exists: boolean | (() => boolean) }): boolean {
  return typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
}

function parsePlayerFromSnap(snap: unknown): Player | null {
  const docSnap = snap as {
    exists: boolean | (() => boolean);
    data?: () => Record<string, unknown> | undefined;
  };
  if (!snapExists(docSnap)) return null;
  const data = docSnap.data?.();
  if (!data) return null;
  const nested = data.player;
  if (nested && typeof nested === 'object') return nested as unknown as Player;
  return data as unknown as Player;
}

async function getServerSnapWithTimeout(
  ref: ReturnType<typeof userDocRef>,
  ms: number,
): Promise<Awaited<ReturnType<typeof getDocFromServer>> | null> {
  return Promise.race([
    getDocFromServer(ref),
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
  const ref = userDocRef(uid);
  const hadLocalMeta = opts?.hadLocalAccountMeta === true;
  try {
    let cacheHadDoc = false;
    try {
      const cached = await getDocFromCache(ref);
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

    // 서버 read 전 Anonymous Auth 확보 — rules(request.auth != null) 통과 필수.
    // 재부팅 이후에는 세션이 영속되어 즉시 반환된다(최초 1회만 sign-in 지연).
    await ensureFirebaseAnonymousAuth();
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

export type CheckNicknameAvailableOptions = {
  /**
   * 계정 초기화·재등록 시 — Firestore 오프라인 캐시·미삭제 본인 문서(`users/{uid}`)는
   * '이미 사용 중'으로 오판하지 않도록 제외한다.
   */
  excludeUid?: string;
};

/**
 * 닉네임 사용 가능 확인 — nicknames 예약 레지스트리 단발 get.
 * (종전 users 컬렉션 query 방식은 rules 열거 차단·레이스 문제로 폐기 · 10만 유저 대비)
 * 오프라인에서는 로컬 플레이를 막지 않는다(예약은 온라인 복귀 시 최종 반영).
 */
export async function checkNicknameAvailable(
  nickname: string,
  opts?: CheckNicknameAvailableOptions,
): Promise<boolean> {
  const n = nickname.trim();
  if (!n) return false;
  const state = await checkNicknameRegistry(n, { excludeUid: opts?.excludeUid });
  return state !== 'taken';
}

export async function registerNickname(_nickname: string): Promise<void> {
  return;
}

export function isAdminDeviceUid(uid: string): boolean {
  if (!uid) return false;
  // 정식 출시: 'local-guest' 폴백 uid 자동 admin 금지 — env allowlist만
  return ADMIN_UID_ALLOWLIST.has(uid);
}

export async function deleteUserCloudSave(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await ensureFirebaseAnonymousAuth();
    await deleteDoc(userDocRef(uid));
  } catch (e) {
    console.warn('[firestore] deleteUserCloudSave failed (offline/queued):', e);
  }
}

export async function createUserDocOnNicknameConfirm(
  uid: string,
  nickname: string,
  options?: { professionId?: string },
): Promise<void> {
  if (!uid) return;
  const safeNickname = nickname.trim() || 'Unknown';
  const professionId = options?.professionId?.trim();
  try {
    await ensureFirebaseAnonymousAuth();
    await setDoc(
      userDocRef(uid),
      {
        uid,
        nickname: safeNickname,
        ...(professionId ? { professionId } : {}),
        isAdmin: isAdminDeviceUid(uid),
        createdAt: serverTimestamp(),
        server_updatedAt: serverTimestamp(),
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
    await setDoc(
      userDocRef(uid),
      {
        uid,
        [itemField]: increment(deltaQty),
        [txnsField]: [],
        server_updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('[firestore] incrementInventoryItemOnServer skipped (offline/queued):', e);
  }
}
