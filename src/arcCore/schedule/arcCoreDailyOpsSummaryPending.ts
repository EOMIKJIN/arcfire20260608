// ============================================================
// 일일 배치 완료 요약 — 허브 1회 알림 (B-UX-3)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_arc_core_daily_ops_summary_pending_v1';

export type ArcCoreDailyOpsSummaryPending = {
  dayKey: string;
  hoursSinceLastBatch: number;
  economyFabric: boolean;
  simOverlayIngest: boolean;
  economyLearning: boolean;
};

export async function setArcCoreDailyOpsSummaryPending(
  summary: ArcCoreDailyOpsSummaryPending,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch {
    /* ignore */
  }
}

/** pending 요약 폐기 — 서비스 개시 월드 리셋 · 계정 초기화 공용 */
export async function clearArcCoreDailyOpsSummaryPending(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated `clearArcCoreDailyOpsSummaryPending` 사용 */
export async function clearArcCoreDailyOpsSummaryPendingForServiceLaunch(): Promise<void> {
  await clearArcCoreDailyOpsSummaryPending();
}

/** 소비 후 삭제 — 허브에서 1회만 표시 */
export async function consumeArcCoreDailyOpsSummaryPending(): Promise<ArcCoreDailyOpsSummaryPending | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<ArcCoreDailyOpsSummaryPending>;
    if (typeof parsed.dayKey !== 'string') return null;
    return {
      dayKey: parsed.dayKey,
      hoursSinceLastBatch:
        typeof parsed.hoursSinceLastBatch === 'number' ? parsed.hoursSinceLastBatch : 0,
      economyFabric: parsed.economyFabric === true,
      simOverlayIngest: parsed.simOverlayIngest === true,
      economyLearning: parsed.economyLearning === true,
    };
  } catch {
    return null;
  }
}
