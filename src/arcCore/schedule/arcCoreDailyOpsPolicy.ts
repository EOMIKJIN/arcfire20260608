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

/** 오늘 배치 시각(분)을 지났고, 오늘 아직 배치하지 않았으면 true */
export function shouldRunArcCoreDailyBatch(nowMs: number, lastBatchDayKey: string | null): boolean {
  const policy = resolveArcCoreDailyOpsPolicy();
  if (!policy.enabled) return false;
  const todayKey = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  if (lastBatchDayKey === todayKey) return false;
  const batchMinuteOfDay = policy.batchRunHour * 60 + policy.batchRunMinute;
  const nowMinute = arcCoreOpsMinutesOfDay(nowMs, policy.timeZone);
  return nowMinute >= batchMinuteOfDay;
}
