// ============================================================
// 행성 유일 소유권 증서 락 — 비동기 공유 세계 규칙 (실시간 MMO 아님)
//
// 기획 잠금:
//   - 행성별 문서 1개 = 전 유저 유일 소유. 한 유저가 여러 행성을 가질 수 있음.
//   - 구매 시 단발 runTransaction 후 로컬 hold. 오프라인이면 로컬 선지급 금지.
//   - 랭킹은 오픈 시 단발 getDocs. onSnapshot·폴링·users 열거 금지.
//   - 함락·반란·해산·계정 초기화 시 클라우드 락 해제(다른 유저 재구매 가능).
//   - 시작 화면·부트 경로 합류 금지.
//
// 인증:
//   게임 uid ≠ Anonymous Auth uid. 쓰기 보호는 문서 authUid == Auth uid.
//   users.boundAuthUid는 재연결 예비 필드(rules 교차참조 안 함 — users update가 열려 있어 위조 가능).
// ============================================================

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
} from '@react-native-firebase/firestore';
import { ensureFirebaseAnonymousAuth } from './firebaseAnonymousAuth';
import {
  PLANET_UNIQUE_DEEDS_COLLECTION,
  PLANET_UNIQUE_DEED_PLANET_ID_MAX,
  PLANET_UNIQUE_DEED_ROSTER_CAP,
  PLANET_UNIQUE_DEED_UID_MAX,
  clipPlanetUniqueDeedField,
  parsePlanetUniqueDeedRow,
  sanitizePlanetUniqueDeedWrite,
  sortPlanetUniqueDeedRows,
  mergePlanetUniqueDeedRosterRows,
  appendUniqueDeedRowIfMissing,
  type PlanetUniqueDeedRow,
  type PlanetUniqueDeedWriteInput,
} from './planetUniqueDeedModel';

export {
  PLANET_UNIQUE_DEEDS_COLLECTION,
  PLANET_UNIQUE_DEED_ROSTER_CAP,
  parsePlanetUniqueDeedRow,
  sanitizePlanetUniqueDeedWrite,
  sortPlanetUniqueDeedRows,
  mergePlanetUniqueDeedRosterRows,
  appendUniqueDeedRowIfMissing,
};
export type { PlanetUniqueDeedRow, PlanetUniqueDeedWriteInput };

export type AcquirePlanetUniqueDeedResult =
  | { ok: true; alreadyOwned: boolean }
  | { ok: false; reason: 'cloud_taken' | 'cloud_offline' | 'cloud_auth' | 'invalid' };

export type FetchPlanetUniqueDeedRosterResult =
  | { ok: true; rows: PlanetUniqueDeedRow[] }
  | { ok: false; reason: 'cloud_offline' | 'cloud_auth' };

const DEED_OP_MS = 8_000;

function race<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

function deedDocRef(planetId: string) {
  return doc(getFirestore(), PLANET_UNIQUE_DEEDS_COLLECTION, planetId);
}

function deedsCollectionRef() {
  return collection(getFirestore(), PLANET_UNIQUE_DEEDS_COLLECTION);
}

function toFirestorePayload(
  input: PlanetUniqueDeedWriteInput,
  authUid: string,
): Record<string, string | number> {
  return {
    planetId: input.planetId,
    ownerUid: input.ownerUid,
    authUid,
    nickname: input.nickname,
    playerLevel: input.playerLevel,
    megaFactionId: input.megaFactionId,
    securedAt: input.securedAt ?? Date.now(),
  };
}

/**
 * 구매 직전 유일 락. 선점 실패·오프라인이면 로컬 hold를 만들지 말 것.
 */
export async function acquirePlanetUniqueDeedLock(
  raw: PlanetUniqueDeedWriteInput,
): Promise<AcquirePlanetUniqueDeedResult> {
  const input = sanitizePlanetUniqueDeedWrite(raw);
  if (!input) return { ok: false, reason: 'invalid' };

  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return { ok: false, reason: 'cloud_auth' };

  try {
    const result = await race(
      runTransaction(getFirestore(), async (tx) => {
        const ref = deedDocRef(input.planetId);
        const snap = await tx.get(ref);
        if (snap.exists()) {
          const current = parsePlanetUniqueDeedRow(
            input.planetId,
            snap.data() as Record<string, unknown> | undefined,
          );
          if (current && current.ownerUid !== input.ownerUid) {
            return { ok: false as const, reason: 'cloud_taken' as const };
          }
          const securedAt = current?.securedAt ?? input.securedAt ?? Date.now();
          tx.set(ref, toFirestorePayload({ ...input, securedAt }, authUid));
          return { ok: true as const, alreadyOwned: true };
        }
        tx.set(ref, toFirestorePayload(input, authUid));
        return { ok: true as const, alreadyOwned: false };
      }),
      DEED_OP_MS,
    );
    if (!result) return { ok: false, reason: 'cloud_offline' };
    return result;
  } catch (e) {
    if (__DEV__) {
      console.log('[planetUniqueDeed] acquire soft-fail:', e instanceof Error ? e.message : e);
    }
    return { ok: false, reason: 'cloud_offline' };
  }
}

export async function peekPlanetUniqueDeedOwner(
  planetId: string,
): Promise<{ ownerUid: string } | null | 'offline'> {
  const id = clipPlanetUniqueDeedField(planetId, PLANET_UNIQUE_DEED_PLANET_ID_MAX);
  if (!id) return null;
  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return 'offline';
  try {
    const snap = await race(getDoc(deedDocRef(id)), DEED_OP_MS);
    if (!snap) return 'offline';
    if (!snap.exists()) return null;
    const row = parsePlanetUniqueDeedRow(id, snap.data() as Record<string, unknown> | undefined);
    return row ? { ownerUid: row.ownerUid } : null;
  } catch {
    return 'offline';
  }
}

export async function releasePlanetUniqueDeedLock(planetId: string): Promise<boolean> {
  const id = clipPlanetUniqueDeedField(planetId, PLANET_UNIQUE_DEED_PLANET_ID_MAX);
  if (!id) return false;
  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return false;
  try {
    const done = await race(deleteDoc(deedDocRef(id)), DEED_OP_MS);
    return done !== null;
  } catch (e) {
    if (__DEV__) {
      console.log('[planetUniqueDeed] release soft-fail:', e instanceof Error ? e.message : e);
    }
    return false;
  }
}

export function scheduleReleasePlanetUniqueDeedLock(planetId: string): void {
  const id = planetId.trim();
  if (!id) return;
  void releasePlanetUniqueDeedLock(id);
}

export function scheduleReleasePlanetUniqueDeedLocks(planetIds: readonly string[]): void {
  for (let i = 0; i < planetIds.length; i += 1) {
    scheduleReleasePlanetUniqueDeedLock(planetIds[i] ?? '');
  }
}

/** 계정 초기화 — 본인 소유 문서만 단발 스캔 후 삭제. Auth 리셋 전에 await. */
export async function releasePlanetUniqueDeedsOwnedBy(ownerUid: string): Promise<number> {
  const uid = clipPlanetUniqueDeedField(ownerUid, PLANET_UNIQUE_DEED_UID_MAX);
  if (!uid) return 0;
  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return 0;
  try {
    const snap = await race(getDocs(deedsCollectionRef()), DEED_OP_MS);
    if (!snap) return 0;
    const targets: string[] = [];
    snap.forEach((docSnap) => {
      const row = parsePlanetUniqueDeedRow(
        docSnap.id,
        docSnap.data() as Record<string, unknown> | undefined,
      );
      if (row && row.ownerUid === uid) targets.push(row.planetId);
    });
    let released = 0;
    for (let i = 0; i < targets.length; i += 1) {
      const ok = await releasePlanetUniqueDeedLock(targets[i]!);
      if (ok) released += 1;
    }
    return released;
  } catch (e) {
    if (__DEV__) {
      console.log('[planetUniqueDeed] release-owned soft-fail:', e instanceof Error ? e.message : e);
    }
    return 0;
  }
}

/** 랭킹 오픈 전용. 타이틀·틱·부트에서 호출 금지. */
export async function fetchPlanetUniqueDeedRoster(): Promise<FetchPlanetUniqueDeedRosterResult> {
  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return { ok: false, reason: 'cloud_auth' };
  try {
    const snap = await race(getDocs(deedsCollectionRef()), DEED_OP_MS);
    if (!snap) return { ok: false, reason: 'cloud_offline' };
    const rows: PlanetUniqueDeedRow[] = [];
    snap.forEach((docSnap) => {
      const row = parsePlanetUniqueDeedRow(
        docSnap.id,
        docSnap.data() as Record<string, unknown> | undefined,
      );
      if (row) rows.push(row);
    });
    return { ok: true, rows: sortPlanetUniqueDeedRows(rows) };
  } catch (e) {
    if (__DEV__) {
      console.log('[planetUniqueDeed] roster soft-fail:', e instanceof Error ? e.message : e);
    }
    return { ok: false, reason: 'cloud_offline' };
  }
}
