// ============================================================
// 아크코어 섀도우 페어링 — 평행우주 1:1 유저 매칭 (Firestore)
//
// 헌법 수정안 §16-A (.cursor/rules/arcfire-shadow-pairing-amendment.mdc):
//   - 온보딩·소급 1회 한정 runTransaction 예외 승인 (2026-07-13 대표님)
//   - onSnapshot·주기 폴링·실시간 분쟁 트랜잭션은 계속 금지
//   - 짝 유저 데이터 읽기는 단발 getDoc(공개 안전 필드)만
//
// 구조:
//   arc_core_shadow_pool/waiting        — 대기 유저 1명 {uid, enqueuedAt}
//   arc_core_shadow_pairs/{uid}         — {uid, shadowUid, pairedAt}
//   (양방향: A→B 페어 확정 시 B→A 문서도 동시 기록)
// ============================================================

import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  setDoc,
} from '@react-native-firebase/firestore';
import { USERS_COLLECTION } from './firestoreRefs';
import type { ArcCoreShadowShipSnapshot } from '../arcCore/shadow/arcCoreShadowShipSnapshot';

export const ARC_CORE_SHADOW_PAIRS_COLLECTION = 'arc_core_shadow_pairs';
export const ARC_CORE_SHADOW_POOL_COLLECTION = 'arc_core_shadow_pool';
/** 공개 안전 미러 — 짝 유저 전함 스냅샷·닉네임만 (전체 프로필 직접 참조 금지 · §16-A) */
export const ARC_CORE_SHADOW_PROFILES_COLLECTION = 'arc_core_shadow_profiles';
const SHADOW_POOL_WAITING_DOC_ID = 'waiting';

export type ArcCoreShadowPairingResult =
  | { status: 'paired'; shadowUid: string; pairedAtMs: number }
  | { status: 'waiting' };

function pairDocRef(uid: string) {
  return doc(getFirestore(), ARC_CORE_SHADOW_PAIRS_COLLECTION, uid);
}

function waitingDocRef() {
  return doc(getFirestore(), ARC_CORE_SHADOW_POOL_COLLECTION, SHADOW_POOL_WAITING_DOC_ID);
}

function parsePairSnap(data: Record<string, unknown> | undefined): {
  shadowUid: string;
  pairedAtMs: number;
} | null {
  const shadowUid = typeof data?.shadowUid === 'string' ? data.shadowUid.trim() : '';
  if (!shadowUid) return null;
  const pairedAtMs =
    typeof data?.pairedAt === 'number' && Number.isFinite(data.pairedAt)
      ? data.pairedAt
      : Date.now();
  return { shadowUid, pairedAtMs };
}

/** 단발 read — 이미 페어가 존재하는지 확인 (트랜잭션 밖 사전 체크). */
export async function fetchExistingArcCoreShadowPair(
  uid: string,
): Promise<{ shadowUid: string; pairedAtMs: number } | null> {
  const trimmed = uid.trim();
  if (!trimmed) return null;
  const snap = await getDoc(pairDocRef(trimmed));
  if (!snap.exists()) return null;
  return parsePairSnap(snap.data() as Record<string, unknown> | undefined);
}

/**
 * 상호 1:1 페어링 — 온보딩·소급 1회 한정 트랜잭션 (헌법 수정안 §16-A 예외).
 * 대기자가 있으면 상호 페어 확정, 없으면 자신을 대기 등록.
 * 홀수 인원 마지막 1명은 waiting 상태로 남아 다음 신규 유저와 매칭된다.
 */
export async function ensureArcCoreShadowPairing(
  uid: string,
): Promise<ArcCoreShadowPairingResult> {
  const selfUid = uid.trim();
  if (!selfUid) return { status: 'waiting' };

  const existing = await fetchExistingArcCoreShadowPair(selfUid);
  if (existing) {
    return { status: 'paired', shadowUid: existing.shadowUid, pairedAtMs: existing.pairedAtMs };
  }

  const db = getFirestore();
  return runTransaction(db, async (tx) => {
    const selfPairSnap = await tx.get(pairDocRef(selfUid));
    if (selfPairSnap.exists()) {
      const parsed = parsePairSnap(selfPairSnap.data() as Record<string, unknown> | undefined);
      if (parsed) {
        return {
          status: 'paired',
          shadowUid: parsed.shadowUid,
          pairedAtMs: parsed.pairedAtMs,
        } as const;
      }
    }

    const waitingSnap = await tx.get(waitingDocRef());
    const waitingData = waitingSnap.exists()
      ? (waitingSnap.data() as Record<string, unknown> | undefined)
      : undefined;
    const waitingUid = typeof waitingData?.uid === 'string' ? waitingData.uid.trim() : '';

    if (waitingUid && waitingUid !== selfUid) {
      const pairedAt = Date.now();
      tx.set(pairDocRef(selfUid), { uid: selfUid, shadowUid: waitingUid, pairedAt });
      tx.set(pairDocRef(waitingUid), { uid: waitingUid, shadowUid: selfUid, pairedAt });
      tx.delete(waitingDocRef());
      return { status: 'paired', shadowUid: waitingUid, pairedAtMs: pairedAt } as const;
    }

    // 대기자 없음(또는 자기 자신) — 자신을 대기 등록
    tx.set(waitingDocRef(), { uid: selfUid, enqueuedAt: Date.now() });
    return { status: 'waiting' } as const;
  });
}

/**
 * 자기 기함 전투 스냅샷 publish — 부트당 1회 (짝 유저의 아크코어 보스로 등장할 스펙).
 * 공개 안전 필드만 기록. 실패는 무시(다음 부트 재시도).
 */
export async function publishArcCoreShadowShipProfile(
  uid: string,
  snapshot: ArcCoreShadowShipSnapshot,
): Promise<void> {
  const trimmed = uid.trim();
  if (!trimmed) return;
  try {
    await setDoc(
      doc(getFirestore(), ARC_CORE_SHADOW_PROFILES_COLLECTION, trimmed),
      { uid: trimmed, ...snapshot },
      { merge: true },
    );
  } catch {
    /* 오프라인 — 다음 부트 publish 재시도 */
  }
}

/** 짝 유저 전함 스냅샷 단발 read — 부트 소급 패스에서 1회 캐시. */
export async function fetchArcCoreShadowShipProfile(
  shadowUid: string,
): Promise<ArcCoreShadowShipSnapshot | null> {
  const trimmed = shadowUid.trim();
  if (!trimmed) return null;
  try {
    const snap = await getDoc(
      doc(getFirestore(), ARC_CORE_SHADOW_PROFILES_COLLECTION, trimmed),
    );
    if (!snap.exists()) return null;
    // 스냅샷 모듈 lazy 로드 — 부트 정적 체인에 generated CSV 인덱스를 끌어오지 않는다
    const { parseArcCoreShadowShipSnapshot } =
      require('../arcCore/shadow/arcCoreShadowShipSnapshot') as typeof import('../arcCore/shadow/arcCoreShadowShipSnapshot');
    return parseArcCoreShadowShipSnapshot(snap.data() as Record<string, unknown> | undefined);
  } catch {
    return null;
  }
}

/**
 * 짝 유저 닉네임 단발 read — 본진(endgame_boss) 격파 공개 시 1회.
 * 공개 안전 필드(nickname)만 사용. 확장 데이터는 arc_core_shadow_profiles 미러로만.
 */
export async function fetchArcCoreShadowNickname(shadowUid: string): Promise<string | null> {
  const trimmed = shadowUid.trim();
  if (!trimmed) return null;
  try {
    const snap = await getDoc(doc(getFirestore(), USERS_COLLECTION, trimmed));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown> | undefined;
    const nickname = typeof data?.nickname === 'string' ? data.nickname.trim() : '';
    return nickname || null;
  } catch {
    return null;
  }
}
