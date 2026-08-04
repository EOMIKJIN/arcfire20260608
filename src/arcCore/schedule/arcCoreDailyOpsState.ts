import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';

const STORAGE_KEY = 'arcfire_arc_core_daily_ops_v1';

type Persisted = {
  /** KST 일자 키 (YYYY-MM-DD) — "시작" 관측용. 게이트에 쓰지 않음(레거시 호환 유지만). */
  lastBatchDayKey: string | null;
  /** [보완 #1] lastBatchDayKey 별칭 — AsyncStorage 문서·감사용 */
  lastBatchDate?: string | null;
  /** 마지막 "완료" 시각만 — markArcCoreDailyBatchCompleted에서만 갱신 */
  lastBatchAtMs: number | null;
  /**
   * 게이트 정본(신규, task_id=daily-ops-batch-incomplete-fix-20260803 Wave A) — 마지막으로
   * 배치가 끝까지 "완료"된 KST dayKey. shouldRunArcCoreDailyBatch는 이 값만 본다.
   * 예전엔 lastBatchDayKey(시작 시점 선기록)로 게이트했는데, 배치가 시작만 하고 중간에
   * 멈춰도(예외·O(N²) 성능 폭주 등) 그 날은 "이미 실행됨"으로 착각해 재시도를 영구 차단했다
   * — 2026-07-18 이후 배치가 시작만 되고 완료를 못 하던 회귀의 핵심 원인.
   */
  lastBatchCompletedDayKey: string | null;
};

let mem: Persisted = { lastBatchDayKey: null, lastBatchAtMs: null, lastBatchCompletedDayKey: null };
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
      const atMs = typeof parsed.lastBatchAtMs === 'number' ? parsed.lastBatchAtMs : null;
      let completedDayKey =
        typeof parsed.lastBatchCompletedDayKey === 'string' ? parsed.lastBatchCompletedDayKey : null;
      // 마이그레이션 — 구 페이로드(completedDayKey 필드 없음)는 lastBatchAtMs 기준 KST
      // dayKey를 완료일로 간주한다. atMs도 없으면(진짜 첫 실행) null 그대로 — 즉시 재시도 대상.
      if (completedDayKey === null && atMs !== null) {
        const policy = resolveArcCoreDailyOpsPolicy();
        completedDayKey = formatArcCoreOpsDayKey(atMs, policy.timeZone);
      }
      mem = { lastBatchDayKey: dayKey, lastBatchAtMs: atMs, lastBatchCompletedDayKey: completedDayKey };
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

/** 게이트 정본 — shouldRunArcCoreDailyBatch가 참조할 값 */
export function getArcCoreDailyOpsLastBatchCompletedDayKey(): string | null {
  return mem.lastBatchCompletedDayKey;
}

async function persistState(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

/**
 * 배치 **시작 시점** 관측 기록(게이트에는 더 이상 쓰이지 않음) — 배치(청크 실행 수십 초)
 * 도중 앱이 강제종료돼도 "시작"만으로 그 날을 완료 취급하지 않는다(Wave A).
 * 같은 날 무한 재시도(2026-07-19 회귀)는 SubCore의 세션 내 batchRunning·실패 쿨다운으로 막는다.
 */
export async function markArcCoreDailyBatchStarted(nowMs: number): Promise<void> {
  const policy = resolveArcCoreDailyOpsPolicy();
  const dayKey = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  mem = { ...mem, lastBatchDayKey: dayKey, lastBatchDate: dayKey };
  await persistState();
}

export async function markArcCoreDailyBatchCompleted(nowMs: number): Promise<void> {
  const policy = resolveArcCoreDailyOpsPolicy();
  const dayKey = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  mem = {
    ...mem,
    lastBatchDayKey: dayKey,
    lastBatchDate: dayKey,
    lastBatchAtMs: nowMs,
    lastBatchCompletedDayKey: dayKey,
  };
  await persistState();
}

/**
 * 서비스 개시일 월드 경제 리셋 — 배치 게이트를 비워 다음 probe/12:00에 재가동.
 * 계정 purge와 무관 · `resetArcCoreWorldEconomyForServiceLaunch` 전용.
 */
export async function clearArcCoreDailyOpsStateForServiceLaunch(): Promise<void> {
  mem = { lastBatchDayKey: null, lastBatchAtMs: null, lastBatchCompletedDayKey: null };
  hydrated = true;
  await persistState();
}
