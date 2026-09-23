import { planetAttackKstDayKey } from '../arcCore/planetAttack/planetAttackKstDayKey';
import { resolvePlanetSalvageSearchPolicy } from './planetSalvageSearchPolicy';

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SalvageSearchDailyFields = {
  salvageSearchDayKey?: string;
  salvageSearchCountToday?: number;
};

export type SalvageSearchDailyUsage = {
  dayKey: string;
  count: number;
  remaining: number;
  capped: boolean;
  cap: number;
};

export function sanitizeSalvageSearchDayKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  return DAY_KEY_RE.test(key) ? key : undefined;
}

export function sanitizeSalvageSearchCountToday(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10_000, Math.floor(n)));
}

export function resolveSalvageSearchDailyUsage(
  player: SalvageSearchDailyFields | null | undefined,
  nowMs = Date.now(),
): SalvageSearchDailyUsage {
  const policy = resolvePlanetSalvageSearchPolicy();
  const cap = policy.dailySearchCap;
  const dayKey = planetAttackKstDayKey(nowMs);
  const sameDay = sanitizeSalvageSearchDayKey(player?.salvageSearchDayKey) === dayKey;
  const count = sameDay ? sanitizeSalvageSearchCountToday(player?.salvageSearchCountToday) : 0;
  const remaining = Math.max(0, cap - count);
  return {
    dayKey,
    count,
    remaining,
    capped: policy.enabled && remaining <= 0,
    cap,
  };
}

export function nextSalvageSearchDailyUsage(
  player: SalvageSearchDailyFields | null | undefined,
  nowMs = Date.now(),
): SalvageSearchDailyFields | null {
  const usage = resolveSalvageSearchDailyUsage(player, nowMs);
  if (usage.capped) return null;
  return {
    salvageSearchDayKey: usage.dayKey,
    salvageSearchCountToday: usage.count + 1,
  };
}
