// ============================================================
// Firebase Realtime Database — ArcCore path helpers
// ============================================================

import { getApp } from '@react-native-firebase/app';
import { getDatabase } from '@react-native-firebase/database';
import {
  ARCORE_RTDB_BOOT_READ_TIMEOUT_MS,
  ARCORE_RTDB_DATABASE_URL,
} from './arccoreRtdbConfig';

export const ARCORE_RTDB_ROOT = 'arccore';

let rtdbUnavailableForSession = false;

export function isArcCoreRtdbAvailableForSession(): boolean {
  return !rtdbUnavailableForSession;
}

export function markArcCoreRtdbUnavailableForSession(reason?: string): void {
  rtdbUnavailableForSession = true;
  if (__DEV__ && reason) {
    console.log(`[ArcCore/RTDB] session disabled: ${reason}`);
  }
}

/** 계정 purge·URL 교정 후 — 같은 JS 세션에서 RTDB 재시도 가능하도록 해제 */
export function clearArcCoreRtdbUnavailableForSession(): void {
  rtdbUnavailableForSession = false;
}

/**
 * ArcCore RTDB 핸들 — Asia URL 명시.
 * `getDatabase()` 기본(google-services firebase_url)만 쓰면 US `.firebaseio.com` 404로
 * boot sync가 offline으로 오인된다(2026-08-06 검수).
 */
export function getRtdb() {
  if (rtdbUnavailableForSession) {
    throw new Error('arccore_rtdb_unavailable');
  }
  return getDatabase(getApp(), ARCORE_RTDB_DATABASE_URL);
}

export function arccoreRtdbRef(relativePath: string) {
  const trimmed = relativePath.replace(/^\/+/, '').replace(/\/+$/, '');
  return getRtdb().ref(trimmed ? `${ARCORE_RTDB_ROOT}/${trimmed}` : ARCORE_RTDB_ROOT);
}

/** `.on()` 리스너 금지 — 단발 read + 타임아웃 */
export async function readRtdbValueOnce<T>(relativePath: string): Promise<T | null> {
  const readPromise = arccoreRtdbRef(relativePath)
    .once('value')
    .then((snap) => {
      const val = snap.val();
      if (val == null || typeof val !== 'object') return null;
      return val as T;
    });

  let tid: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      tid = setTimeout(
        () =>
          reject(
            new Error(
              `rtdb_read_timeout path=${relativePath} url=${ARCORE_RTDB_DATABASE_URL}`,
            ),
          ),
        ARCORE_RTDB_BOOT_READ_TIMEOUT_MS,
      );
    });
    return await Promise.race([readPromise, timeoutPromise]);
  } finally {
    if (tid) clearTimeout(tid);
  }
}
