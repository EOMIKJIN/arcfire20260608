// ============================================================
// planet_core_stat_equilibrium_policy.csv — 5대 스탯 균형·쇠퇴 정본
// ============================================================

import { PlanetCoreStatEquilibriumPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

let kv: Map<string, string> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(
      PlanetCoreStatEquilibriumPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
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

export type PlanetCoreStatEquilibriumPolicy = {
  enabled: boolean;
  baselineStatPct: number;
  fullDevTargetPct: number;
  devDriftRatePerDay: number;
  naturalDecayPerDay: number;
  naturalDecayMinDevLevelSum: number;
  fiscalDeficitPopulationDecay: number;
  fiscalDeficitResourceDecay: number;
  fiscalDeficitEnvironmentDecay: number;
  fiscalDeficitTechnologyDecay: number;
  fiscalSurplusPopulationNudge: number;
  fiscalSurplusResourceNudge: number;
  playerUpkeepFailExtraDecay: number;
  playerUpkeepFailPopulationDecay: number;
  maxDailyStatDropPerMetric: number;
  maxDailyStatGainPerMetric: number;
};

export function resolvePlanetCoreStatEquilibriumPolicy(): PlanetCoreStatEquilibriumPolicy {
  return {
    enabled: bool('enabled', true),
    baselineStatPct: Math.max(0, Math.min(100, num('baseline_stat_pct', 50))),
    fullDevTargetPct: Math.max(50, Math.min(100, num('full_dev_target_pct', 87))),
    devDriftRatePerDay: Math.max(0, Math.min(1, num('dev_drift_rate_per_day', 0.14))),
    naturalDecayPerDay: Math.max(0, num('natural_decay_per_day', 0.4)),
    naturalDecayMinDevLevelSum: Math.max(0, Math.floor(num('natural_decay_min_dev_level_sum', 10))),
    fiscalDeficitPopulationDecay: Math.max(0, num('fiscal_deficit_population_decay', 0.9)),
    fiscalDeficitResourceDecay: Math.max(0, num('fiscal_deficit_resource_decay', 0.55)),
    fiscalDeficitEnvironmentDecay: Math.max(0, num('fiscal_deficit_environment_decay', 0.45)),
    fiscalDeficitTechnologyDecay: Math.max(0, num('fiscal_deficit_technology_decay', 0.25)),
    fiscalSurplusPopulationNudge: Math.max(0, num('fiscal_surplus_population_nudge', 0.35)),
    fiscalSurplusResourceNudge: Math.max(0, num('fiscal_surplus_resource_nudge', 0.3)),
    playerUpkeepFailExtraDecay: Math.max(0, num('player_upkeep_fail_extra_decay', 1)),
    playerUpkeepFailPopulationDecay: Math.max(0, num('player_upkeep_fail_population_decay', 0.6)),
    maxDailyStatDropPerMetric: Math.max(0.5, num('max_daily_stat_drop_per_metric', 3)),
    maxDailyStatGainPerMetric: Math.max(0.5, num('max_daily_stat_gain_per_metric', 4)),
  };
}
