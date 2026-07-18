/**
 * 기기 스코프 게임 uid — Firestore 문서 키(비공개 식별자).
 * 클라우드 요청 인증은 Firebase Anonymous Auth(firebaseAnonymousAuth.ts)가 별도로 담당한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

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

function readPlatformDeviceId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    // iOS — identifierForVendor (Android ID 없음: 종전에는 전 iOS 기기가 'local-guest'로 수렴하는 결함)
    return Application.getIosIdForVendorAsync();
  }
  return Promise.resolve(Application.getAndroidId());
}

async function resolveDeviceScopedUid(): Promise<string | null> {
  for (let i = 0; i < 5; i += 1) {
    try {
      // cold 부팅에서 기기 id 조회 지연 시 1회당 대기 상한 — 과하면 첫 화면 진입이 수초 늘어남
      const deviceId = await Promise.race<string | null>([
        readPlatformDeviceId(),
        (async () => {
          await sleep(550);
          return null;
        })(),
      ]);
      if (typeof deviceId === 'string' && deviceId.trim().length > 0) {
        return deviceId.trim();
      }
    } catch {
      /* ignore */
    }
    if (i < 4) {
      await sleep(120);
    }
  }
  return null;
}

/**
 * 기기 id 조회 실패 폴백 — 공유 'local-guest' 대신 기기 로컬 랜덤 uid를 1회 생성·영속.
 * ('local-guest' 공유 uid는 전 기기 세이브 충돌을 일으키므로 정식 출시 금지)
 */
function generateLocalFallbackUid(): string {
  let hex = '';
  for (let i = 0; i < 16; i += 1) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return `localdev_${hex}`;
}

async function writeGuest(user: LocalUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  currentGuest = user;
}

export async function initGuestAuth(): Promise<LocalUser> {
  // sync fallback('local-guest')은 임시값 — 정식 해석 전이면 무시하고 재해석
  if (currentGuest?.uid && currentGuest.uid !== 'local-guest') return currentGuest;
  if (!authInitPromise) {
    authInitPromise = (async () => {
      const deviceUid = await resolveDeviceScopedUid();
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<LocalUser>;
          if (typeof parsed.uid === 'string' && parsed.uid.trim().length > 0) {
            const persisted = parsed.uid.trim();
            // 레거시 'local-guest' 영속값은 기기 id(또는 랜덤 uid)로 승격
            if (persisted !== 'local-guest') {
              currentGuest = { uid: persisted };
              if (deviceUid && persisted !== deviceUid) {
                await writeGuest({ uid: deviceUid });
              }
              return currentGuest;
            }
          }
        }
      } catch {
        /* ignore */
      }
      const resolved = deviceUid ?? generateLocalFallbackUid();
      await writeGuest({ uid: resolved });
      return { uid: resolved };
    })().finally(() => {
      authInitPromise = null;
    });
  }
  return authInitPromise;
}

export async function rotateGuestAuthIdentity(): Promise<LocalUser> {
  const deviceUid = await resolveDeviceScopedUid();
  const next = { uid: deviceUid ?? currentGuest?.uid ?? generateLocalFallbackUid() };
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
  // initGuestAuth 호출 이전 fallback(동기 경로 보호) — 영속하지 않음(임시 메모리 값).
  // 'local-guest'를 AsyncStorage에 쓰면 공유 uid로 고착되므로 금지.
  const fallback = { uid: 'local-guest' };
  currentGuest = fallback;
  void initGuestAuth();
  return fallback;
}

export function onAuthStateChanged(cb: (user: LocalUser | null) => void): () => void {
  cb(getCurrentUser());
  return () => {};
}

export async function signInWithGoogle(): Promise<{ user: LocalUser }> {
  return { user: getCurrentUser() };
}
