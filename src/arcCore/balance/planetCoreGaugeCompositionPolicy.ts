// ============================================================
// planet_core_gauge_composition_policy.csv — gauge 합성·일일 cap
// ============================================================

import { PlanetCoreGaugeCompositionPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

let kv: Map<string, string> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(
      PlanetCoreGaugeCompositionPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return kv;
}

function num(key: string, fallback: number): number {
  const n = Number(getKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const raw = String(getKv().get(key) ?? '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export type PlanetCoreGaugeCompositionPolicy = {
  maxDailyChangePctPerMetric: number;
  minDailyChangeAbsPerMetric: number;
  arcCoreIntentWithoutDev: boolean;
  playerDevIntentEnabled: boolean;
};

export function resolvePlanetCoreGaugeCompositionPolicy(): PlanetCoreGaugeCompositionPolicy {
  return {
    maxDailyChangePctPerMetric: Math.max(0.5, Math.min(3, num('max_daily_change_pct_per_metric', 1.5))),
    minDailyChangeAbsPerMetric: Math.max(0.01, num('min_daily_change_abs_per_metric', 0.05)),
    arcCoreIntentWithoutDev: bool('arc_core_intent_without_dev', true),
    playerDevIntentEnabled: bool('player_dev_intent_enabled', true),
  };
}
