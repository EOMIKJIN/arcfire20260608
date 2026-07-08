/** 로컬 APK 전용 — 클라우드 인증 없음 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

export interface LocalUser {
  uid: string;
}

const AUTH_STORAGE_KEY = 'arcfire_local_auth_v1';
const AUTH_FRESH_START_ONCE_KEY = 'arcfire_auth_fresh_start_once_v1';
let currentGuest: LocalUser | null = null;
let authInitPromise: Promise<LocalUser> | null = null;
/** 이번 앱 실행에서 fresh-start 플래그를 소비했는지(타이틀 클라우드 복구 스킵용) */
let freshStartConsumedThisBoot = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveDeviceScopedUid(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    try {
      // cold 부팅에서 getAndroidId() 지연 시 1회당 대기 상한 — 과하면 첫 화면 진입이 수초 늘어남
      const androidId = await Promise.race<string | null>([
        Application.getAndroidId(),
        (async () => {
          await sleep(550);
          return null;
        })(),
      ]);
      if (typeof androidId === 'string' && androidId.trim().length > 0) {
        return androidId.trim();
      }
    } catch {
      /* ignore */
    }
    if (i < 4) {
      await sleep(120);
    }
  }
  return 'local-guest';
}

async function writeGuest(user: LocalUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  currentGuest = user;
}

export async function initGuestAuth(): Promise<LocalUser> {
  if (currentGuest?.uid) return currentGuest;
  if (!authInitPromise) {
    authInitPromise = (async () => {
      const deviceUid = await resolveDeviceScopedUid();
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<LocalUser>;
          if (typeof parsed.uid === 'string' && parsed.uid.trim().length > 0) {
            const persisted = parsed.uid.trim();
            currentGuest = { uid: persisted || deviceUid };
            if (persisted !== deviceUid) {
              await writeGuest({ uid: deviceUid });
            }
            return currentGuest;
          }
        }
      } catch {
        /* ignore */
      }
      await writeGuest({ uid: deviceUid });
      return { uid: deviceUid };
    })().finally(() => {
      authInitPromise = null;
    });
  }
  return authInitPromise;
}

export async function rotateGuestAuthIdentity(): Promise<LocalUser> {
  const next = { uid: await resolveDeviceScopedUid() };
  await writeGuest(next);
  return next;
}

/** 계정 초기화 직후 1회: 타이틀에서 클라우드 복원을 건너뛰도록 표시 */
export async function markFreshStartAfterReset(): Promise<void> {
  await AsyncStorage.setItem(AUTH_FRESH_START_ONCE_KEY, '1');
}

/** 타이틀 진입 시 1회 — AsyncStorage 플래그를 소비하고 클라우드 복원을 건너뛴다. */
export async function consumeFreshStartForTitle(): Promise<boolean> {
  if (freshStartConsumedThisBoot) return true;
  try {
    const raw = await AsyncStorage.getItem(AUTH_FRESH_START_ONCE_KEY);
    if (raw === '1') {
      await AsyncStorage.removeItem(AUTH_FRESH_START_ONCE_KEY);
      freshStartConsumedThisBoot = true;
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** purge 직후·타이틀 마운트 전 — 플래그가 아직 남아 있는지(소비 전). */
export async function hasPendingFreshStartAfterReset(): Promise<boolean> {
  if (freshStartConsumedThisBoot) return true;
  try {
    const raw = await AsyncStorage.getItem(AUTH_FRESH_START_ONCE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

/** `consumeFreshStartForTitle()`가 이번 부팅에서 true였는지(메모리만, 1회) */
export function wasFreshStartThisBoot(): boolean {
  return freshStartConsumedThisBoot;
}

export async function getCurrentUserEnsured(): Promise<LocalUser> {
  if (currentGuest?.uid) return currentGuest;
  return initGuestAuth();
}

export function getCurrentUser(): LocalUser {
  if (currentGuest) return currentGuest;
  // initGuestAuth 호출 이전 fallback(동기 경로 보호)
  const fallback = { uid: 'local-guest' };
  currentGuest = fallback;
  void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

export function onAuthStateChanged(cb: (user: LocalUser | null) => void): () => void {
  cb(getCurrentUser());
  return () => {};
}

export async function signInWithGoogle(): Promise<{ user: LocalUser }> {
  return { user: getCurrentUser() };
}
