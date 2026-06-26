import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorldExpansionTimingPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { ArcCoreRtdbWorldExpansionMasterState } from '../firebase/arccoreRtdbTypes';
import { ARCORE_RTDB_SCHEMA_VERSION } from '../firebase/arccoreRtdbTypes';

const POLICY_CACHE_KEY = 'arcfire_world_expansion_global_policy_v1';

export type ArcCoreWorldExpansionGlobalPolicy = {
  globalScheduleEnabled: boolean;
  epochDayKey: string;
  timeZone: string;
  resetGeneration: number;
  systemsPerDay: number;
  /** RTDB 우선 · 없으면 csv */
  source: 'rtdb' | 'csv' | 'default';
};

const DEFAULT_POLICY: ArcCoreWorldExpansionGlobalPolicy = {
  globalScheduleEnabled: true,
  epochDayKey: '2026-06-01',
  timeZone: 'Asia/Seoul',
  resetGeneration: 1,
  systemsPerDay: 1,
  source: 'default',
};

let rtdbPolicyOverride: ArcCoreWorldExpansionGlobalPolicy | null = null;

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

function isValidDayKey(raw: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw);
}

export function normalizeRtdbWorldExpansionMasterState(
  raw: unknown,
): ArcCoreWorldExpansionGlobalPolicy | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ArcCoreRtdbWorldExpansionMasterState>;
  if (o.schemaVersion !== ARCORE_RTDB_SCHEMA_VERSION) return null;
  const epochDayKey = typeof o.epochDayKey === 'string' ? o.epochDayKey.trim() : '';
  if (!isValidDayKey(epochDayKey)) return null;
  const timeZone =
    typeof o.timeZone === 'string' && o.timeZone.trim() ? o.timeZone.trim() : DEFAULT_POLICY.timeZone;
  return {
    globalScheduleEnabled: o.globalScheduleEnabled !== false,
    epochDayKey,
    timeZone,
    resetGeneration: parsePositiveInt(String(o.resetGeneration ?? ''), DEFAULT_POLICY.resetGeneration),
    systemsPerDay: parsePositiveInt(String(o.systemsPerDay ?? ''), DEFAULT_POLICY.systemsPerDay),
    source: 'rtdb',
  };
}

export async function hydrateWorldExpansionGlobalPolicyCache(): Promise<void> {
  if (rtdbPolicyOverride) return;
  try {
    const raw = await AsyncStorage.getItem(POLICY_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as ArcCoreWorldExpansionGlobalPolicy;
    if (parsed && typeof parsed.epochDayKey === 'string' && isValidDayKey(parsed.epochDayKey)) {
      rtdbPolicyOverride = parsed;
    }
  } catch {
    /* ignore */
  }
}

/** RTDB boot sync 성공 시 호출 — 이후 reconcile 트리거 */
export async function ingestRtdbWorldExpansionMasterState(raw: unknown): Promise<boolean> {
  const normalized = normalizeRtdbWorldExpansionMasterState(raw);
  if (!normalized) return false;
  rtdbPolicyOverride = normalized;
  try {
    await AsyncStorage.setItem(POLICY_CACHE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
  return true;
}

function resolveCsvFallbackPolicy(): ArcCoreWorldExpansionGlobalPolicy {
  const row = WorldExpansionTimingPolicy_FROM_BALANCE_CSV[0];
  const epochDayKey =
    typeof row?.epochDayKey === 'string' && isValidDayKey(String(row.epochDayKey).trim())
      ? String(row.epochDayKey).trim()
      : DEFAULT_POLICY.epochDayKey;
  const timeZone =
    typeof row?.timeZone === 'string' && String(row.timeZone).trim()
      ? String(row.timeZone).trim()
      : DEFAULT_POLICY.timeZone;
  return {
    globalScheduleEnabled: parseBool(String(row?.globalScheduleEnabled ?? 'true')),
    epochDayKey,
    timeZone,
    resetGeneration: parsePositiveInt(String(row?.resetGeneration ?? ''), DEFAULT_POLICY.resetGeneration),
    systemsPerDay: parsePositiveInt(String(row?.systemsPerDay ?? ''), DEFAULT_POLICY.systemsPerDay),
    source: 'csv',
  };
}

/** RTDB(캐시) > CSV > default */
export function resolveArcCoreWorldExpansionGlobalPolicy(): ArcCoreWorldExpansionGlobalPolicy {
  if (rtdbPolicyOverride) return rtdbPolicyOverride;
  const csv = resolveCsvFallbackPolicy();
  if (csv.globalScheduleEnabled) return csv;
  return { ...DEFAULT_POLICY, globalScheduleEnabled: csv.globalScheduleEnabled, source: 'csv' };
}

export function isArcCoreGlobalWorldExpansionEnabled(): boolean {
  return resolveArcCoreWorldExpansionGlobalPolicy().globalScheduleEnabled;
}
