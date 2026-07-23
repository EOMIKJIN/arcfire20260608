import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteField, serverTimestamp, Timestamp } from '@react-native-firebase/firestore';
import {
  deleteDoc,
  doc,
  gameSaveBackupDocRef,
  gameSaveBackupPayloadChunksCollectionRef,
  gameSaveBackupsCollectionRef,
  getDoc,
  getDocFromCache,
  getDocs,
  limit,
  query,
  setDoc,
  userDocRef,
} from '../firestoreRefs';
import { configureFirestorePersistence } from '../firestoreClientConfig';
import { clearFreshStartAfterAccountCreated, getCurrentUserEnsured } from '../auth';
import { ensureFirebaseAnonymousAuth } from '../firebaseAnonymousAuth';
import { applyLocalGameSaveSnapshot } from './applyLocalGameSaveSnapshot';
import { collectLocalGameSaveSnapshot } from './collectLocalGameSaveSnapshot';
import type {
  AdminGameSaveRestorePending,
  GameSaveBackupDoc,
  GameSaveBackupReason,
  GameSaveBackupSnapshot,
} from './gameSaveBackupContract';
import {
  ADMIN_GAME_SAVE_RESTORE_PENDING_FIELD,
  GAME_SAVE_BACKUP_CHUNK_TARGET_CHARS,
  GAME_SAVE_BACKUP_MAX_PAYLOAD_CHARS,
  GAME_SAVE_BACKUP_MAX_PER_UID,
  GAME_SAVE_BACKUP_RETENTION_MS,
  GAME_SAVE_BACKUP_SCHEMA_VERSION,
} from './gameSaveBackupContract';
import {
  estimateGameSaveDocCharSize,
  perKeySnapshotCharSizes,
} from './slimGameSaveSnapshotForUpload';

const LAST_BACKUP_AT_KEY = 'arcfire_game_save_backup_last_at_v1';

/** Firestore read 상한 — 부트·설정·복구 공통(무한 await 금지) */
const GAME_SAVE_BACKUP_LIST_MS = 6_000;
const GAME_SAVE_BACKUP_FETCH_MS = 12_000;
const GAME_SAVE_BACKUP_PRUNE_MS = 8_000;
const GAME_SAVE_BACKUP_WRITE_MS = 20_000;

function firestoreRace<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export type GameSaveBackupListItem = Pick<
  GameSaveBackupDoc,
  'uid' | 'nickname' | 'createdAtMs' | 'expiresAtMs' | 'reason' | 'summary' | 'appVersion'
> & { backupId: string };

export type ListGameSaveBackupsResult = {
  items: GameSaveBackupListItem[];
  status: 'ok' | 'timeout' | 'error';
};

function mapBackupListSnap(
  snap: Awaited<ReturnType<typeof getDocs>>,
): GameSaveBackupListItem[] {
  const items: GameSaveBackupListItem[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as GameSaveBackupDoc;
    const summary = normalizeBackupSummary(data.summary as Record<string, unknown> | undefined);
    items.push({
      backupId: docSnap.id,
      uid: data.uid,
      nickname: data.nickname ?? null,
      createdAtMs: data.createdAtMs,
      expiresAtMs: data.expiresAtMs,
      reason: data.reason,
      summary,
      appVersion: data.appVersion,
    });
  }
  return items.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

async function readFirestoreBackupList(
  col: ReturnType<typeof gameSaveBackupsCollectionRef>,
  maxItems: number,
): Promise<ListGameSaveBackupsResult> {
  const q = query(col, limit(Math.min(maxItems, GAME_SAVE_BACKUP_MAX_PER_UID)));
  const snap = await readFirestoreBackupQuery(q, GAME_SAVE_BACKUP_LIST_MS);
  if (!snap) {
    console.warn('[gameSaveBackup] list timed out');
    return { items: [], status: 'timeout' };
  }
  try {
    return { items: mapBackupListSnap(snap), status: 'ok' };
  } catch (e) {
    console.warn('[gameSaveBackup] list failed:', e);
    return { items: [], status: 'error' };
  }
}

async function readFirestoreBackupDoc(
  ref: ReturnType<typeof userDocRef>,
  timeoutMs: number = GAME_SAVE_BACKUP_FETCH_MS,
): Promise<Awaited<ReturnType<typeof getDoc>> | null> {
  try {
    const snap = await firestoreRace(getDoc(ref), timeoutMs);
    if (snap) return snap;
  } catch {
    /* server read failed — cache fallback */
  }
  try {
    return await firestoreRace(getDocFromCache(ref), Math.min(timeoutMs, 3_000));
  } catch {
    return null;
  }
}

async function readFirestoreChunkDoc(
  ref: ReturnType<typeof doc>,
): Promise<Awaited<ReturnType<typeof getDoc>> | null> {
  return readFirestoreBackupDoc(ref as ReturnType<typeof userDocRef>, GAME_SAVE_BACKUP_FETCH_MS);
}

async function readFirestoreBackupQuery(
  q: ReturnType<typeof query>,
  timeoutMs: number,
): Promise<Awaited<ReturnType<typeof getDocs>> | null> {
  try {
    return await firestoreRace(getDocs(q), timeoutMs);
  } catch {
    return null;
  }
}

async function setFirestoreBackupDoc(
  ref: ReturnType<typeof gameSaveBackupDocRef>,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const ok = await firestoreRace(
      setDoc(ref, data).then(() => true),
      GAME_SAVE_BACKUP_WRITE_MS,
    );
    return ok === true;
  } catch {
    return false;
  }
}

function buildBackupId(reason: GameSaveBackupReason, nowMs: number): string {
  return `${nowMs}_${reason}`;
}

function splitSnapshotIntoChunks(snapshot: GameSaveBackupSnapshot): GameSaveBackupSnapshot[] {
  const chunks: GameSaveBackupSnapshot[] = [];
  let current: GameSaveBackupSnapshot = {};
  let currentSize = 2;

  const flush = () => {
    if (Object.keys(current).length === 0) return;
    chunks.push(current);
    current = {};
    currentSize = 2;
  };

  for (const [key, value] of Object.entries(snapshot)) {
    const entrySize = key.length + value.length + 6;
    if (Object.keys(current).length > 0 && currentSize + entrySize > GAME_SAVE_BACKUP_CHUNK_TARGET_CHARS) {
      flush();
    }
    current[key] = value;
    currentSize += entrySize;
  }
  flush();
  return chunks.length > 0 ? chunks : [snapshot];
}

async function writeSnapshotChunks(
  uid: string,
  backupId: string,
  snapshot: GameSaveBackupSnapshot,
): Promise<number> {
  const chunks = splitSnapshotIntoChunks(snapshot);
  const writtenIndexes: number[] = [];
  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const chunkRef = doc(gameSaveBackupPayloadChunksCollectionRef(uid, backupId), String(i));
      const ok = await firestoreRace(
        setDoc(chunkRef, { index: i, snapshot: chunks[i] }).then(() => true),
        GAME_SAVE_BACKUP_WRITE_MS,
      );
      if (!ok) throw new Error('chunk_write_timeout');
      writtenIndexes.push(i);
    }
    return chunks.length;
  } catch {
    await Promise.all(
      writtenIndexes.map((i) =>
        deleteDoc(doc(gameSaveBackupPayloadChunksCollectionRef(uid, backupId), String(i))).catch(
          () => {
            /* ignore */
          },
        ),
      ),
    );
    throw new Error('chunk_write_failed');
  }
}

async function deleteSnapshotChunks(uid: string, backupId: string): Promise<void> {
  const col = gameSaveBackupPayloadChunksCollectionRef(uid, backupId);
  const snap = await readFirestoreBackupQuery(query(col, limit(40)), GAME_SAVE_BACKUP_PRUNE_MS);
  if (!snap) return;
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

async function readSnapshotChunks(uid: string, backupId: string, chunkCount: number): Promise<GameSaveBackupSnapshot | null> {
  const merged: GameSaveBackupSnapshot = {};
  for (let i = 0; i < chunkCount; i += 1) {
    const snap = await readFirestoreChunkDoc(
      doc(gameSaveBackupPayloadChunksCollectionRef(uid, backupId), String(i)),
    );
    if (!snap) return null;
    const exists = typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
    if (!exists) return null;
    const data = snap.data() as { snapshot?: GameSaveBackupSnapshot };
    if (!data.snapshot || typeof data.snapshot !== 'object') return null;
    Object.assign(merged, data.snapshot);
  }
  return merged;
}

function normalizeBackupSummary(summaryRaw: Record<string, unknown> | undefined): GameSaveBackupDoc['summary'] {
  const raw = summaryRaw ?? {};
  const legacyUnlocked = Array.isArray(raw.unlockedSystemIds)
    ? (raw.unlockedSystemIds as string[])
    : null;
  return {
    unlockedSystemCount:
      typeof raw.unlockedSystemCount === 'number'
        ? raw.unlockedSystemCount
        : legacyUnlocked?.length ?? 0,
    synthUnlockCount: typeof raw.synthUnlockCount === 'number' ? raw.synthUnlockCount : 0,
    currentPlanetId: typeof raw.currentPlanetId === 'string' ? raw.currentPlanetId : null,
    playerLevel: typeof raw.playerLevel === 'number' ? raw.playerLevel : null,
  };
}

function normalizeBackupDoc(raw: GameSaveBackupDoc & { summary?: Record<string, unknown> }): GameSaveBackupDoc | null {
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== GAME_SAVE_BACKUP_SCHEMA_VERSION) return null;
  return {
    ...raw,
    summary: normalizeBackupSummary(raw.summary as Record<string, unknown> | undefined),
    snapshot: raw.snapshot ?? {},
  };
}

async function readLastBackupAtMs(uid: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(`${LAST_BACKUP_AT_KEY}:${uid}`);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function writeLastBackupAtMs(uid: string, nowMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(`${LAST_BACKUP_AT_KEY}:${uid}`, String(nowMs));
  } catch {
    /* ignore */
  }
}

export async function pruneExpiredGameSaveBackups(uid: string, nowMs: number = Date.now()): Promise<number> {
  configureFirestorePersistence();
  const col = gameSaveBackupsCollectionRef(uid);
  const allSnap = await readFirestoreBackupQuery(
    query(col, limit(GAME_SAVE_BACKUP_MAX_PER_UID + 20)),
    GAME_SAVE_BACKUP_PRUNE_MS,
  );
  if (!allSnap) return 0;
  const docs = allSnap.docs
    .map((d) => {
      const data = d.data() as Partial<GameSaveBackupDoc>;
      return {
        id: d.id,
        ref: d.ref,
        createdAtMs: Number(data.createdAtMs ?? 0),
        expiresAtMs: Number(data.expiresAtMs ?? 0),
      };
    })
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  let removed = 0;
  for (const row of docs) {
    if (row.expiresAtMs > 0 && row.expiresAtMs < nowMs) {
      await deleteSnapshotChunks(uid, row.id).catch(() => {
        /* ignore */
      });
      await deleteDoc(row.ref);
      removed += 1;
    }
  }
  const remaining = docs.filter(
    (row) => !(row.expiresAtMs > 0 && row.expiresAtMs < nowMs),
  );
  if (remaining.length > GAME_SAVE_BACKUP_MAX_PER_UID) {
    for (const extra of remaining.slice(GAME_SAVE_BACKUP_MAX_PER_UID)) {
      await deleteSnapshotChunks(uid, extra.id).catch(() => {
        /* ignore */
      });
      await deleteDoc(extra.ref);
      removed += 1;
    }
  }
  return removed;
}

export async function uploadGameSaveBackup(
  uid: string,
  reason: GameSaveBackupReason,
  nowMs: number = Date.now(),
): Promise<{ ok: boolean; backupId?: string; skipped?: string }> {
  if (!uid?.trim()) return { ok: false, skipped: 'missing_uid' };

  configureFirestorePersistence();
  await ensureFirebaseAnonymousAuth();
  const docBody = await collectLocalGameSaveSnapshot(uid, reason, nowMs);
  if (Object.keys(docBody.snapshot).length === 0) {
    return { ok: false, skipped: 'empty_snapshot' };
  }

  let inlineDoc = { ...docBody, payloadMode: 'inline' as const, snapshot: { ...docBody.snapshot } };
  let size = estimateGameSaveDocCharSize(inlineDoc);

  if (size > GAME_SAVE_BACKUP_MAX_PAYLOAD_CHARS) {
    const backupId = buildBackupId(reason, nowMs);
    let chunkCount = 0;
    try {
      chunkCount = await writeSnapshotChunks(uid, backupId, docBody.snapshot);
    } catch {
      return { ok: false, skipped: 'upload_failed' };
    }
    const chunkedMeta = {
      ...docBody,
      payloadMode: 'chunked' as const,
      chunkCount,
      snapshot: {} as GameSaveBackupSnapshot,
    };
    size = estimateGameSaveDocCharSize(chunkedMeta);
    if (size > GAME_SAVE_BACKUP_MAX_PAYLOAD_CHARS) {
      await deleteSnapshotChunks(uid, backupId).catch(() => {
        /* ignore */
      });
      if (__DEV__) {
        const sizes = perKeySnapshotCharSizes(docBody.snapshot);
        const top = Object.entries(sizes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k, n]) => `${k}=${n}`)
          .join(', ');
        console.warn(
          `[gameSaveBackup] payload too large (${size} chars, chunked meta) — skip upload. top: ${top}`,
        );
      }
      return { ok: false, skipped: 'payload_too_large' };
    }
    const metaOk = await setFirestoreBackupDoc(gameSaveBackupDocRef(uid, backupId), {
      ...chunkedMeta,
      // Firestore TTL 정책용 Timestamp — 콘솔에서 expiresAt TTL 활성화 시 이탈 유저 백업 자동 삭제
      expiresAt: Timestamp.fromMillis(chunkedMeta.expiresAtMs),
      server_savedAt: serverTimestamp(),
    });
    if (!metaOk) {
      await deleteSnapshotChunks(uid, backupId).catch(() => {
        /* ignore */
      });
      return { ok: false, skipped: 'upload_failed' };
    }
    await writeLastBackupAtMs(uid, nowMs);
    void pruneExpiredGameSaveBackups(uid, nowMs).catch(() => {
      /* background prune */
    });
    if (__DEV__) {
      console.log(`[gameSaveBackup] uploaded chunked backup ${backupId} (${chunkCount} chunks)`);
    }
    return { ok: true, backupId };
  }

  const backupId = buildBackupId(reason, nowMs);
  const inlineOk = await setFirestoreBackupDoc(gameSaveBackupDocRef(uid, backupId), {
    ...inlineDoc,
    // Firestore TTL 정책용 Timestamp — 콘솔에서 expiresAt TTL 활성화 시 이탈 유저 백업 자동 삭제
    expiresAt: Timestamp.fromMillis(inlineDoc.expiresAtMs),
    server_savedAt: serverTimestamp(),
  });
  if (!inlineOk) {
    return { ok: false, skipped: 'upload_failed' };
  }
  await writeLastBackupAtMs(uid, nowMs);
  void pruneExpiredGameSaveBackups(uid, nowMs).catch(() => {
    /* background prune */
  });
  if (__DEV__ && docBody.omittedKeys?.length) {
    console.log(`[gameSaveBackup] omitted optional keys: ${docBody.omittedKeys.join(', ')}`);
  }
  return { ok: true, backupId };
}

export async function uploadGameSaveBackupIfDue(
  uid: string,
  reason: GameSaveBackupReason = 'scheduled',
  minIntervalMs: number,
  nowMs: number = Date.now(),
): Promise<{ ok: boolean; backupId?: string; skipped?: string }> {
  const last = await readLastBackupAtMs(uid);
  if (reason === 'scheduled' && nowMs - last < minIntervalMs) {
    return { ok: false, skipped: 'interval' };
  }
  return uploadGameSaveBackup(uid, reason, nowMs);
}

export async function fetchGameSaveBackupDoc(
  uid: string,
  backupId: string,
): Promise<GameSaveBackupDoc | null> {
  configureFirestorePersistence();
  await ensureFirebaseAnonymousAuth();
  const snap = await readFirestoreBackupDoc(gameSaveBackupDocRef(uid, backupId));
  if (!snap) return null;
  const exists = typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
  if (!exists) return null;
  const normalized = normalizeBackupDoc(snap.data() as GameSaveBackupDoc);
  if (!normalized) return null;

  if (normalized.payloadMode === 'chunked') {
    const chunkCount = normalized.chunkCount ?? 0;
    if (chunkCount <= 0) return null;
    const merged = await readSnapshotChunks(uid, backupId, chunkCount);
    if (!merged || Object.keys(merged).length === 0) return null;
    normalized.snapshot = merged;
  }

  if (!normalized.snapshot || typeof normalized.snapshot !== 'object') return null;
  if (Object.keys(normalized.snapshot).length === 0 && normalized.payloadMode !== 'chunked') {
    return null;
  }
  return normalized;
}

export async function listGameSaveBackupsForUid(
  uid: string,
  maxItems: number = 20,
): Promise<ListGameSaveBackupsResult> {
  configureFirestorePersistence();
  await ensureFirebaseAnonymousAuth();
  const col = gameSaveBackupsCollectionRef(uid);
  return readFirestoreBackupList(col, maxItems);
}

export async function restoreGameSaveBackupToLocal(
  uid: string,
  backupId: string,
): Promise<{ ok: boolean; error?: string; appliedKeyCount?: number }> {
  const backupDoc = await fetchGameSaveBackupDoc(uid, backupId);
  if (!backupDoc) return { ok: false, error: 'backup_not_found' };
  if (backupDoc.expiresAtMs < Date.now()) return { ok: false, error: 'backup_expired' };
  if (Object.keys(backupDoc.snapshot).length === 0) {
    return { ok: false, error: 'backup_empty' };
  }
  try {
    const result = await applyLocalGameSaveSnapshot(backupDoc.snapshot);
    // 수동 복구 = 사용자가 계정 데이터를 명시적으로 되살림 — 계정 초기화 직후의
    // 클라우드 자동 복원 차단(fresh-start)을 해제해 상태를 일관되게 유지한다.
    await clearFreshStartAfterAccountCreated();
    return { ok: true, appliedKeyCount: result.appliedKeyCount };
  } catch {
    return { ok: false, error: 'apply_failed' };
  }
}

export async function setAdminGameSaveRestorePending(
  uid: string,
  backupId: string,
  requestedBy: AdminGameSaveRestorePending['requestedBy'] = 'admin_in_app',
  nowMs: number = Date.now(),
): Promise<{ ok: boolean; error?: string }> {
  configureFirestorePersistence();
  const pending: AdminGameSaveRestorePending = {
    backupId,
    requestedAtMs: nowMs,
    expiresAtMs: nowMs + GAME_SAVE_BACKUP_RETENTION_MS,
    requestedBy,
  };
  const ok = await firestoreRace(
    setDoc(
      userDocRef(uid),
      {
        [ADMIN_GAME_SAVE_RESTORE_PENDING_FIELD]: pending,
        server_updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).then(() => true),
    GAME_SAVE_BACKUP_WRITE_MS,
  );
  if (ok !== true) return { ok: false, error: 'pending_write_timeout' };
  return { ok: true };
}

export async function clearAdminGameSaveRestorePending(uid: string): Promise<void> {
  configureFirestorePersistence();
  await setDoc(
    userDocRef(uid),
    {
      [ADMIN_GAME_SAVE_RESTORE_PENDING_FIELD]: deleteField(),
    },
    { merge: true },
  );
}

export type ConsumeAdminRestoreResult =
  | { kind: 'none' }
  | { kind: 'restored'; backupId: string; appliedKeyCount: number }
  | { kind: 'failed'; error: string };

/** 부트·포그라운드 1회 — users/{uid} pending 필드 소비 */
export async function consumePendingAdminGameSaveRestore(uid: string): Promise<ConsumeAdminRestoreResult> {
  if (!uid?.trim()) return { kind: 'none' };
  try {
    configureFirestorePersistence();
    await ensureFirebaseAnonymousAuth();
    const userSnap = await readFirestoreBackupDoc(userDocRef(uid));
    if (!userSnap) return { kind: 'failed', error: 'user_read_timeout' };
    const userExists = typeof userSnap.exists === 'function' ? userSnap.exists() : !!userSnap.exists;
    if (!userExists) return { kind: 'none' };
    const data = userSnap.data() as Record<string, unknown>;
    const pending = data[ADMIN_GAME_SAVE_RESTORE_PENDING_FIELD] as AdminGameSaveRestorePending | undefined;
    if (!pending?.backupId) return { kind: 'none' };
    const nowMs = Date.now();
    if (pending.expiresAtMs < nowMs) {
      await clearAdminGameSaveRestorePending(uid);
      return { kind: 'failed', error: 'pending_expired' };
    }
    const restore = await restoreGameSaveBackupToLocal(uid, pending.backupId);
    if (!restore.ok) return { kind: 'failed', error: restore.error ?? 'restore_failed' };
    await clearAdminGameSaveRestorePending(uid);
    return {
      kind: 'restored',
      backupId: pending.backupId,
      appliedKeyCount: restore.appliedKeyCount ?? 0,
    };
  } catch {
    return { kind: 'failed', error: 'consume_failed' };
  }
}

/** 백업 Firestore 경로 uid — player·device uid 정렬(local-guest 제외) */
export async function resolveGameSaveBackupUid(preferredUid?: string | null): Promise<string | null> {
  const preferred = preferredUid?.trim();
  if (preferred && preferred !== 'local-guest') return preferred;
  try {
    const authUid = (await getCurrentUserEnsured()).uid?.trim();
    if (authUid && authUid !== 'local-guest') return authUid;
  } catch {
    /* ignore */
  }
  return preferred && preferred !== 'local-guest' ? preferred : null;
}

export { GAME_SAVE_BACKUP_RETENTION_MS };
