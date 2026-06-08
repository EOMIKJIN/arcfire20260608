// ============================================================
// AABS 정책 상수 — `2.2.ArcCore_AABS_Final_Spec_v2.2.md` §4
// ============================================================

/** 1회 자동 보정 최대 폭 */
export const AABS_MAX_STEP_RATIO = 0.05;

/** 정본 대비 누적 보정 상한 (±15%) */
export const AABS_MAX_CUMULATIVE_RATIO = 0.15;

/** Sim-Bot 격차 임계 — 20% 이상이면 CRITICAL_DRIFT */
export const AABS_CRITICAL_DRIFT_RATIO = 0.2;

/** 일일 정책 정렬 주기 (24h) */
export const AABS_DAILY_ALIGNMENT_MS = 24 * 60 * 60 * 1000;

/** Sim-Bot 가상 플레이어 수 */
export const AABS_SIM_BOT_COUNT = 200;

/** 유저 체류 이탈 경고 배율 (Post-AABS §2-A) */
export const AABS_USER_DWELL_ALERT_RATIO = 1.5;

/** 가디언 — 인플레이션 붕괴 임계 (50%) */
export const AABS_GUARDIAN_INFLATION_THRESHOLD = 0.5;

export type AabsMultiplierKey =
  | 'expReward'
  | 'creditReward'
  | 'tradeIncome'
  | 'dropWeight'
  | 'miningYield'
  | 'combatDifficulty';

export const AABS_MULTIPLIER_KEYS: readonly AabsMultiplierKey[] = [
  'expReward',
  'creditReward',
  'tradeIncome',
  'dropWeight',
  'miningYield',
  'combatDifficulty',
] as const;

export type AabsDriftSeverity = 'ok' | 'warn' | 'critical';

export type AabsDriftReport = {
  key: AabsMultiplierKey;
  target: number;
  observed: number;
  gapRatio: number;
  severity: AabsDriftSeverity;
  criticalDrift: boolean;
};
