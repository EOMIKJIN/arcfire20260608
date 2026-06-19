// ============================================================
// planet_development_aggregate_policy.csv — 행성개발 집계·효율 정본
// ============================================================

import { PlanetDevelopmentAggregatePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

let kv: Map<string, string> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(
      PlanetDevelopmentAggregatePolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return kv;
}

function num(key: string, fallback: number): number {
  const n = Number(getKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

export function resolvePlanetDevCostEfficiencyTechWeightPerPoint(): number {
  return Math.max(0, num('cost_efficiency_tech_weight_per_point', 0.004));
}

export function resolvePlanetDevCostEfficiencyAggregateWeightPerLevel(): number {
  return Math.max(0, num('cost_efficiency_aggregate_weight_per_level', 0.12));
}

export function resolvePlanetDevCostEfficiencyDiscountCapPct(): number {
  return Math.max(0, Math.min(50, num('cost_efficiency_discount_cap_pct', 25)));
}

export function resolvePlanetDevLevelUpStatNudgeDailyFraction(): number {
  return Math.max(0, Math.min(2, num('level_up_stat_nudge_daily_fraction', 1)));
}

export function resolvePlanetDevTdiPgpBmuPerPoint(): number {
  return Math.max(0, Math.floor(num('tdi_pgp_bmu_per_point', 80)));
}

export function resolvePlanetDevUpkeepEfficiencyTechWeightPerPoint(): number {
  return Math.max(0, num('upkeep_efficiency_tech_weight_per_point', 0.003));
}

export function resolvePlanetDevUpkeepEfficiencyAggregateWeightPerLevel(): number {
  return Math.max(0, num('upkeep_efficiency_aggregate_weight_per_level', 0.08));
}

export function resolvePlanetDevUpkeepEfficiencyDiscountCapPct(): number {
  return Math.max(0, Math.min(50, num('upkeep_efficiency_discount_cap_pct', 15)));
}
