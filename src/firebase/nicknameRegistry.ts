// ============================================================
// 닉네임 예약 레지스트리 — nicknames/{sha256(정규화 닉네임)}
//
// 목적(정식 출시 · 10만 유저 대비):
//   1) 종전 users 컬렉션 query(list) 기반 중복 검사 → 열거 차단 rules와 충돌 · 레이스 허용
//   2) 예약 문서 create-only 로 동시 가입 중복 닉네임 원천 차단
//   3) 문서에는 uidHash(sha256)만 저장 — 닉네임/uid 어느 쪽도 평문 노출 없음
//
// 규칙(firestore.rules):
//   create: 인증 유저 · 문서 없음일 때만  /  update: uidHash 동일 시만  /  delete: 금지
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import { ensureFirebaseAnonymousAuth } from './firebaseAnonymousAuth';
import { sha256Hex } from '../utils/sha256Hex';

export const NICKNAMES_COLLECTION = 'nicknames';
export const NICKNAME_RESERVED_FLAG_KEY = 'arcfire_nickname_reserved_v1';
/** 예약 read/write 상한 — 온보딩 UX 보호 */
const NICKNAME_REGISTRY_OP_MS = 6_000;

function race<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

/** 닉네임 정규화 — 대소문자·유니코드 정규화 기준 유일성 */
export function normalizeNicknameForKey(nickname: string): string {
  return nickname.trim().normalize('NFC').toLowerCase();
}

export function nicknameRegistryDocId(nickname: string): string {
  return sha256Hex(normalizeNicknameForKey(nickname));
}

export function hashUidForNicknameRegistry(uid: string): string {
  return sha256Hex(`arcfire_nick_owner:${uid.trim()}`);
}

function nicknameDocRef(nickname: string) {
  return doc(getFirestore(), NICKNAMES_COLLECTION, nicknameRegistryDocId(nickname));
}

export type NicknameRegistryCheckResult = 'available' | 'taken' | 'own' | 'offline';

/**
 * 닉네임 사용 가능 확인 — 예약 문서 단발 get.
 * 오프라인/타임아웃은 'offline' — 호출부 정책(허용)에 위임한다(종전 동작 유지).
 */
export async function checkNicknameRegistry(
  nickname: string,
  opts?: { excludeUid?: string },
): Promise<NicknameRegistryCheckResult> {
  const trimmed = nickname.trim();
  if (!trimmed) return 'taken';
  try {
    await ensureFirebaseAnonymousAuth();
    const snap = await race(getDoc(nicknameDocRef(trimmed)), NICKNAME_REGISTRY_OP_MS);
    if (!snap) return 'offline';
    if (!snap.exists()) return 'available';
    const data = snap.data() as { uidHash?: unknown; released?: unknown } | undefined;
    if (data?.released === true) return 'available';
    const uidHash = typeof data?.uidHash === 'string' ? data.uidHash : '';
    const excludeUid = opts?.excludeUid?.trim();
    if (excludeUid && uidHash && uidHash === hashUidForNicknameRegistry(excludeUid)) {
      return 'own';
    }
    return 'taken';
  } catch (e) {
    console.warn('[nicknameRegistry] check failed (offline fallback):', e);
    return 'offline';
  }
}

/**
 * 닉네임 예약 — create 또는 released 재선점(rules). 이미 타인이 선점했으면 false.
 * 본인 재예약(동일 uidHash)은 rules update 허용으로 성공한다.
 */
export async function reserveNickname(nickname: string, uid: string): Promise<boolean> {
  const trimmed = nickname.trim();
  const trimmedUid = uid.trim();
  if (!trimmed || !trimmedUid) return false;
  try {
    await ensureFirebaseAnonymousAuth();
    const ok = await race(
      setDoc(nicknameDocRef(trimmed), {
        uidHash: hashUidForNicknameRegistry(trimmedUid),
        reservedAt: Date.now(),
        released: false,
      }).then(() => true),
      NICKNAME_REGISTRY_OP_MS,
    );
    if (ok) {
      await AsyncStorage.setItem(`${NICKNAME_RESERVED_FLAG_KEY}:${trimmedUid}`, trimmed);
    }
    return ok === true;
  } catch (e) {
    // 타인 선점(permission denied) 포함 — 호출부에서 재검사로 구분
    console.warn('[nicknameRegistry] reserve failed:', e);
    return false;
  }
}

/**
 * 계정 초기화 — 로컬 예약 플래그 제거 + Firestore 예약을 released로 표시(타인 재사용 가능).
 * delete는 rules상 금지 · tombstone(released)만 허용.
 * @param nicknameHint purge 직전 player/profile에서 읽은 닉(플래그 없을 때 보조)
 */
export async function releaseNicknameReservationForAccountPurge(
  uid: string,
  nicknameHint?: string | null,
): Promise<void> {
  const trimmedUid = uid.trim();
  if (!trimmedUid) return;
  const flagKey = `${NICKNAME_RESERVED_FLAG_KEY}:${trimmedUid}`;
  let nickname: string | null = null;
  try {
    nickname = await AsyncStorage.getItem(flagKey);
  } catch {
    /* ignore */
  }
  try {
    await AsyncStorage.removeItem(flagKey);
  } catch {
    /* ignore */
  }
  const fromHint = typeof nicknameHint === 'string' ? nicknameHint.trim() : '';
  const trimmedNick =
    (typeof nickname === 'string' && nickname.trim() ? nickname.trim() : '') || fromHint;
  if (!trimmedNick) return;
  try {
    await ensureFirebaseAnonymousAuth();
    const ref = nicknameDocRef(trimmedNick);
    const snap = await race(getDoc(ref), NICKNAME_REGISTRY_OP_MS);
    if (!snap || !snap.exists()) return;
    const data = snap.data() as { uidHash?: unknown } | undefined;
    const uidHash = typeof data?.uidHash === 'string' ? data.uidHash : '';
    if (uidHash !== hashUidForNicknameRegistry(trimmedUid)) return;
    await race(
      setDoc(
        ref,
        {
          uidHash,
          reservedAt: Date.now(),
          released: true,
        },
        { merge: true },
      ).then(() => true),
      NICKNAME_REGISTRY_OP_MS,
    );
  } catch (e) {
    if (__DEV__) {
      console.warn('[nicknameRegistry] release on purge failed (offline/queued):', e);
    }
  }
}

/**
 * 기존 계정 소급 예약 — uid당 1회(AsyncStorage 플래그).
 * 정기 클라우드 동기화 뒤에 호출되며 이미 예약됐으면 no-op.
 */
export async function ensureNicknameReservedRetro(uid: string, nickname: string): Promise<void> {
  const trimmedUid = uid.trim();
  const trimmedNick = nickname.trim();
  if (!trimmedUid || !trimmedNick) return;
  try {
    const flag = await AsyncStorage.getItem(`${NICKNAME_RESERVED_FLAG_KEY}:${trimmedUid}`);
    if (flag === trimmedNick) return;
    const state = await checkNicknameRegistry(trimmedNick, { excludeUid: trimmedUid });
    if (state === 'offline') return; // 다음 동기화에서 재시도
    if (state === 'taken') {
      // 소급 시점 충돌(먼저 예약한 타 유저 존재) — 게임 진행은 막지 않고 로그만
      console.warn('[nicknameRegistry] retro reserve conflict — nickname already reserved');
      await AsyncStorage.setItem(`${NICKNAME_RESERVED_FLAG_KEY}:${trimmedUid}`, trimmedNick);
      return;
    }
    if (state === 'own') {
      await AsyncStorage.setItem(`${NICKNAME_RESERVED_FLAG_KEY}:${trimmedUid}`, trimmedNick);
      return;
    }
    await reserveNickname(trimmedNick, trimmedUid);
  } catch {
    /* 다음 동기화에서 재시도 */
  }
}
