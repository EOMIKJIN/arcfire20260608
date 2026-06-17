// ============================================================
// arc_core_daily_ops_policy.csv — 일 1회 운영 배치 시각·대상
// ============================================================

import { ArcCoreDailyOpsPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreDailyOpsPolicy = {
  enabled: boolean;
  timeZone: string;
  batchRunHour: number;
  batchRunMinute: number;
  observationWindowHours: number;
  runPlanetEnergyPass: boolean;
  runPlanetEnvironmentPass: boolean;
  runPlanetMasterBalancePass: boolean;
  runScenarioEconomyPass: boolean;
  runMarketPricePass: boolean;
  runAabsAlignmentPass: boolean;
  runWorldExpansionUnlock: boolean;
};

const FALLBACK: ArcCoreDailyOpsPolicy = {
  enabled: true,
  timeZone: 'Asia/Seoul',
  batchRunHour: 12,
  batchRunMinute: 0,
  observationWindowHours: 24,
  runPlanetEnergyPass: true,
  runPlanetEnvironmentPass: true,
  runPlanetMasterBalancePass: true,
  runScenarioEconomyPass: true,
  runMarketPricePass: true,
  runAabsAlignmentPass: true,
  runWorldExpansionUnlock: true,
};

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parseHour(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(23, Math.max(0, Math.floor(n)));
}

function parseMinute(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(59, Math.max(0, Math.floor(n)));
}

function parseHoursWindow(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(168, Math.max(1, Math.floor(n)));
}

function rowToPolicy(row: (typeof ArcCoreDailyOpsPolicy_FROM_BALANCE_CSV)[number]): ArcCoreDailyOpsPolicy {
  const tz = String(row.timeZone ?? '').trim();
  return {
    enabled: parseBool(row.enabled),
    timeZone: tz || FALLBACK.timeZone,
    batchRunHour: parseHour(row.batchRunHour, FALLBACK.batchRunHour),
    batchRunMinute: parseMinute(row.batchRunMinute, FALLBACK.batchRunMinute),
    observationWindowHours: parseHoursWindow(row.observationWindowHours, FALLBACK.observationWindowHours),
    runPlanetEnergyPass: parseBool(row.runPlanetEnergyPass),
    runPlanetEnvironmentPass: parseBool(row.runPlanetEnvironmentPass),
    runPlanetMasterBalancePass: parseBool(row.runPlanetMasterBalancePass),
    runScenarioEconomyPass: parseBool(row.runScenarioEconomyPass),
    runMarketPricePass: parseBool(row.runMarketPricePass ?? row.runScenarioEconomyPass),
    runAabsAlignmentPass: parseBool(row.runAabsAlignmentPass),
    runWorldExpansionUnlock: parseBool(row.runWorldExpansionUnlock),
  };
}

let cached: ArcCoreDailyOpsPolicy | null = null;

export function resolveArcCoreDailyOpsPolicy(): ArcCoreDailyOpsPolicy {
  if (cached) return cached;
  const row =
    ArcCoreDailyOpsPolicy_FROM_BALANCE_CSV.find((r) => String(r.policyKey ?? '').trim() === 'default')
    ?? ArcCoreDailyOpsPolicy_FROM_BALANCE_CSV[0];
  cached = row ? rowToPolicy(row) : FALLBACK;
  return cached;
}

/** 정책 타임존 기준 YYYY-MM-DD */
export function formatArcCoreOpsDayKey(nowMs: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(nowMs));
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: FALLBACK.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(nowMs));
  }
}

/** 정책 타임존 기준 하루 중 경과 분(0..1439) */
export function arcCoreOpsMinutesOfDay(nowMs: number, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(nowMs));
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    const d = new Date(nowMs);
    return d.getHours() * 60 + d.getMinutes();
  }
}

export type ArcCoreDailyBatchGateInput = {
  /** AsyncStorage `lastBatchDate` (= lastBatchDayKey) */
  lastBatchDayKey: string | null;
  /** 플레이어 `createdAt` — 첫 가입 당일 배치 스킵 판별 */
  signupAtMs?: number | null;
};

/** [보완 #1] 오늘 배치 미실행·누락 보정·첫 가입 당일 예외 */
export function shouldRunArcCoreDailyBatch(nowMs: number, input: ArcCoreDailyBatchGateInput): boolean {
  const policy = resolveArcCoreDailyOpsPolicy();
  if (!policy.enabled) return false;

  const { lastBatchDayKey, signupAtMs } = input;
  const todayKey = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  // [보완 #1] 오늘 이미 실행됨 (lastBatchDate === today)
  if (lastBatchDayKey === todayKey) return false;

  const batchMinuteOfDay = policy.batchRunHour * 60 + policy.batchRunMinute;
  const nowMinute = arcCoreOpsMinutesOfDay(nowMs, policy.timeZone);

  if (typeof signupAtMs === 'number' && Number.isFinite(signupAtMs)) {
    const signupDayKey = formatArcCoreOpsDayKey(signupAtMs, policy.timeZone);
    // [보완 #1] 첫 가입 당일 — lastBatchDate 없으면 배치 스킵(시드 유지)
    if (lastBatchDayKey === null && signupDayKey === todayKey) return false;
    // [보완 #1] 가입 다음날 이후 한 번도 배치 없음 → 누락 보정 즉시
    if (lastBatchDayKey === null && signupDayKey < todayKey) return true;
  }

  // [보완 #1] 이전 날짜 배치 후 앱 꺼짐 → 다음 실행 시 즉시 보정
  if (lastBatchDayKey !== null && lastBatchDayKey < todayKey) return true;

  // [보완 #1] 당일 첫 배치 — 정책 시각(12:00 KST) 이후
  if (lastBatchDayKey === null) return nowMinute >= batchMinuteOfDay;

  return false;
}
