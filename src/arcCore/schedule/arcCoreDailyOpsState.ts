import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';

const STORAGE_KEY = 'arcfire_arc_core_daily_ops_v1';

type Persisted = {
  lastBatchDayKey: string | null;
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
      mem = {
        lastBatchDayKey: typeof parsed.lastBatchDayKey === 'string' ? parsed.lastBatchDayKey : null,
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
  mem = {
    lastBatchDayKey: formatArcCoreOpsDayKey(nowMs, policy.timeZone),
    lastBatchAtMs: nowMs,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}
