// ============================================================
// Firebase Realtime Database — ArcCore path helpers
// ============================================================

import database from '@react-native-firebase/database';
import { ARCORE_RTDB_BOOT_READ_TIMEOUT_MS } from './arccoreRtdbConfig';

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

export function getRtdb() {
  if (rtdbUnavailableForSession) {
    throw new Error('arccore_rtdb_unavailable');
  }
  return database();
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
      tid = setTimeout(() => reject(new Error('rtdb_read_timeout')), ARCORE_RTDB_BOOT_READ_TIMEOUT_MS);
    });
    return await Promise.race([readPromise, timeoutPromise]);
  } finally {
    if (tid) clearTimeout(tid);
  }
}
