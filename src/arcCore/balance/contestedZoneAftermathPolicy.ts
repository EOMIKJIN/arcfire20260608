// ============================================================
// arc_core_contested_zone_aftermath_policy.csv · contested_zone_stat_aftermath.csv
// ============================================================

import {
  ArcCoreContestedZoneAftermathPolicy_FROM_BALANCE_CSV,
  ContestedZoneStatAftermath_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

let policyKv: Map<string, string> | null = null;
let aftermathByPlanetId: Map<string, (typeof ContestedZoneStatAftermath_FROM_BALANCE_CSV)[number]> | null =
  null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      ArcCoreContestedZoneAftermathPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function getAftermathByPlanetId(): Map<
  string,
  (typeof ContestedZoneStatAftermath_FROM_BALANCE_CSV)[number]
> {
  if (!aftermathByPlanetId) {
    aftermathByPlanetId = new Map(
      ContestedZoneStatAftermath_FROM_BALANCE_CSV.map((row) => [row.planetId, row] as const),
    );
  }
  return aftermathByPlanetId;
}

function policyNum(key: string, fallback: number): number {
  const n = Number(getPolicyKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

function policyBool(key: string, fallback: boolean): boolean {
  const raw = String(getPolicyKv().get(key) ?? '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export type ContestedZoneAftermathGlobalPolicy = {
  enabled: boolean;
  driftRatePerDay: number;
  maxDailyStatGainPerMetric: number;
  maxDailyStatDropPerMetric: number;
  galaxyReferenceEnabled: boolean;
  minDevLevelSumBypass: number;
};

export type ContestedZoneStatAftermathOffsets = {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
};

export function resolveContestedZoneAftermathGlobalPolicy(): ContestedZoneAftermathGlobalPolicy {
  return {
    enabled: policyBool('enabled', true),
    driftRatePerDay: Math.max(0, Math.min(1, policyNum('drift_rate_per_day', 0.16))),
    maxDailyStatGainPerMetric: Math.max(0.5, policyNum('max_daily_stat_gain_per_metric', 3)),
    maxDailyStatDropPerMetric: Math.max(0.5, policyNum('max_daily_stat_drop_per_metric', 3)),
    galaxyReferenceEnabled: policyBool('galaxy_reference_enabled', true),
    minDevLevelSumBypass: Math.max(0, Math.floor(policyNum('min_dev_level_sum_bypass', 0))),
  };
}

export function getContestedZoneStatAftermathRow(
  planetId: string,
): (typeof ContestedZoneStatAftermath_FROM_BALANCE_CSV)[number] | undefined {
  return getAftermathByPlanetId().get(planetId.trim());
}

export function resolveContestedZoneStatAftermathOffsets(
  planetId: string,
): ContestedZoneStatAftermathOffsets | null {
  const row = getContestedZoneStatAftermathRow(planetId);
  if (!row) return null;
  const parse = (raw: string | undefined) => {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : 0;
  };
  return {
    resource: parse(row.offsetResource),
    population: parse(row.offsetPopulation),
    defense: parse(row.offsetDefense),
    technology: parse(row.offsetTechnology),
    environment: parse(row.offsetEnvironment),
  };
}

export function listContestedZoneStatAftermathPlanetIds(): string[] {
  return ContestedZoneStatAftermath_FROM_BALANCE_CSV.map((row) => String(row.planetId).trim()).filter(
    Boolean,
  );
}
