import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';

const STORAGE_KEY = 'arcfire_arc_core_daily_ops_v1';

type Persisted = {
  /** KST 일자 키 (YYYY-MM-DD) — 문서상 lastBatchDate와 동일 */
  lastBatchDayKey: string | null;
  /** [보완 #1] lastBatchDayKey 별칭 — AsyncStorage 문서·감사용 */
  lastBatchDate?: string | null;
  lastBatchAtMs: number | null;
};

let mem: Persisted = { lastBatchDayKey: null, lastBatchAtMs: null };
let hydrated = false;

export async function hydrateArcCoreDailyOpsState(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      const dayKey =
        typeof parsed.lastBatchDayKey === 'string'
          ? parsed.lastBatchDayKey
          : typeof parsed.lastBatchDate === 'string'
            ? parsed.lastBatchDate
            : null;
      mem = {
        lastBatchDayKey: dayKey,
        lastBatchAtMs: typeof parsed.lastBatchAtMs === 'number' ? parsed.lastBatchAtMs : null,
      };
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
  }
}

export function getArcCoreDailyOpsLastBatchDayKey(): string | null {
  return mem.lastBatchDayKey;
}

export async function markArcCoreDailyBatchCompleted(nowMs: number): Promise<void> {
  const policy = resolveArcCoreDailyOpsPolicy();
  const lastBatchDate = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  mem = {
    lastBatchDayKey: lastBatchDate,
    lastBatchDate,
    lastBatchAtMs: nowMs,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}
