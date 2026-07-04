import Constants from 'expo-constants';
import * as Application from 'expo-application';
import firestore from '@react-native-firebase/firestore';

const ADMIN_NICKNAME = 'Representative';
const ADMIN_UID_ALLOWLIST = new Set(
  (process.env.EXPO_PUBLIC_ADMIN_UIDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
);

let firestoreConfigured = false;

/** 네이티브 Firestore — 오프라인 캐시·대기 쓰기. userDataSync·gameSaveBackup 공용(순환 import 방지). */
export function configureFirestorePersistence(): void {
  if (firestoreConfigured) return;
  firestoreConfigured = true;
  try {
    const fs = firestore();
    if (typeof (fs as { settings?: (o: Record<string, unknown>) => void }).settings === 'function') {
      (fs as { settings: (o: Record<string, unknown>) => void }).settings({
        ignoreUndefinedProperties: true,
      });
    }
  } catch (e) {
    console.warn('[firestoreClientConfig] Firestore settings skipped:', e);
  }
}

export function resolveAppVersion(): string {
  const nativeVersion = Application.nativeApplicationVersion;
  if (typeof nativeVersion === 'string' && nativeVersion.trim()) return nativeVersion.trim();
  const v = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return '0.0.0';
}

export function resolveRegionCode(): string {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale ?? 'und';
    const region = new Intl.Locale(loc).maximize().region;
    if (region && /^[A-Z]{2}$/.test(region)) return region;
  } catch {
    /* ignore */
  }
  return 'ZZ';
}

export function resolveUserType(uid: string, nickname: string | null | undefined): 'admin' | 'user' {
  if (!uid) return 'user';
  if (ADMIN_UID_ALLOWLIST.has(uid)) return 'admin';
  const nick = (nickname ?? '').trim();
  if (nick === ADMIN_NICKNAME) return 'admin';
  if (uid === 'local-guest' || uid.toLowerCase() === 'local-guest') return 'admin';
  if (uid.startsWith('local-') && uid.toLowerCase().includes('guest')) return 'admin';
  return 'user';
}
