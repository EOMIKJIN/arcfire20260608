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

export function getArcCoreDailyOpsLastBatchAtMs(): number | null {
  return mem.lastBatchAtMs;
}

/**
 * 배치 **시작 시점**에 일자 키를 선기록한다 — 배치(청크 실행 수십 초) 도중 앱이
 * 강제종료되면 완료 마크가 영영 안 남아 **매 부팅마다 전체 배치가 재실행**되고,
 * 타이틀·허브 진입과 경합해 멈춤으로 보이는 회귀(2026-07-19 logcat 전수검사)가 있었다.
 * 일일 밸런스 패스는 하루 1회가 계약이므로, 중단된 날은 재실행하지 않는 쪽이 안전하다.
 */
async function markDailyBatchDayKey(nowMs: number, lastBatchAtMs: number | null): Promise<void> {
  const policy = resolveArcCoreDailyOpsPolicy();
  const lastBatchDate = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  mem = {
    lastBatchDayKey: lastBatchDate,
    lastBatchDate,
    lastBatchAtMs,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

export async function markArcCoreDailyBatchStarted(nowMs: number): Promise<void> {
  await markDailyBatchDayKey(nowMs, mem.lastBatchAtMs);
}

export async function markArcCoreDailyBatchCompleted(nowMs: number): Promise<void> {
  await markDailyBatchDayKey(nowMs, nowMs);
}
