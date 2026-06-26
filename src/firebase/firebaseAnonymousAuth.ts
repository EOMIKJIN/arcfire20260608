// ============================================================
// Firebase Anonymous Auth — RTDB dailyKpi write 전용 (세션 1회)
// tick·렌더·거래 hot path 금지 · InteractionManager 지연 warm-up
// ============================================================

import { InteractionManager } from 'react-native';
import auth from '@react-native-firebase/auth';

const AUTH_TIMEOUT_MS = 6_000;

let cachedAuthUid: string | null = null;
let ensurePromise: Promise<string | null> | null = null;
let warmupScheduled = false;

function readCurrentAuthUid(): string | null {
  if (cachedAuthUid) return cachedAuthUid;
  const uid = auth().currentUser?.uid;
  if (uid) cachedAuthUid = uid;
  return uid ?? null;
}

/**
 * RTDB `learning/devices/{auth.uid}/dailyKpi` write용 Anonymous Auth.
 * 실패 시 null — 로컬 플레이 계속.
 */
export async function ensureFirebaseAnonymousAuth(): Promise<string | null> {
  const existing = readCurrentAuthUid();
  if (existing) return existing;

  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        let user = auth().currentUser;
        if (!user) {
          const credential = await Promise.race([
            auth().signInAnonymously(),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('firebase_anonymous_auth_timeout')), AUTH_TIMEOUT_MS);
            }),
          ]);
          user = credential.user;
        }
        cachedAuthUid = user.uid;
        return cachedAuthUid;
      } catch (e) {
        if (__DEV__) {
          console.log('[Firebase/Auth] anonymous sign-in skipped');
        }
        return null;
      } finally {
        ensurePromise = null;
      }
    })();
  }

  return ensurePromise;
}

export function getFirebaseAuthUidCached(): string | null {
  return readCurrentAuthUid();
}

/** 부트 완료 후 유휴 시점 — 배치 전 Auth warm-up (프레임·부트 비차단) */
export function scheduleFirebaseAnonymousAuthWarmup(): void {
  if (warmupScheduled) return;
  warmupScheduled = true;
  InteractionManager.runAfterInteractions(() => {
    void ensureFirebaseAnonymousAuth();
  });
}

/** 계정 초기화 — KPI 기기 키 분리용 sign-out */
export async function resetFirebaseAnonymousAuthForAccountPurge(): Promise<void> {
  cachedAuthUid = null;
  warmupScheduled = false;
  try {
    if (auth().currentUser) {
      await auth().signOut();
    }
  } catch {
    /* ignore */
  }
}
