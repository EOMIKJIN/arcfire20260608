import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_arc_core_last_daily_unlock_v1';

export type ArcCoreDailyUnlockRecord = {
  systemId: string;
  atMs: number;
};

/**
 * 로컬 `arc_core_daily` 개방 1회 성공 시 호출 — 테스트·지원용으로 마지막 개방 성계 id를 남긴다.
 */
export async function persistArcCoreDailyUnlockRecord(systemId: string): Promise<void> {
  const payload: ArcCoreDailyUnlockRecord = { systemId, atMs: Date.now() };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  /** 일일 개방은 정상 경로에서 자주 호출됨 — `console.warn`은 Metro 노란 경고만 유발하므로 생략. 디버그 시 AsyncStorage `STORAGE_KEY` 또는 필요 시 여기에만 임시 로그 추가. */
}

export async function readArcCoreLastDailyUnlockRecord(): Promise<ArcCoreDailyUnlockRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { systemId?: unknown; atMs?: unknown };
    if (typeof p.systemId !== 'string' || typeof p.atMs !== 'number') return null;
    return { systemId: p.systemId, atMs: p.atMs };
  } catch {
    return null;
  }
}
