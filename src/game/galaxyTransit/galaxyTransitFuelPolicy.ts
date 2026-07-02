// ============================================================
// 은하 이동 연료비 — Table-First (galaxy_transit_fuel_policy · hull_fuel_mul)
// ============================================================

import {
  GalaxyTransitFuelPolicy_FROM_BALANCE_CSV,
  GalaxyTransitHullFuelMul_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

export type GalaxyTransitFuelPolicy = {
  baseCreditsPerHop: number;
  minCreditsPerHop: number;
  referenceHopDistance: number;
  distanceMulMin: number;
  distanceMulMax: number;
  distanceCurveExponent: number;
  hopProgressionRate: number;
  routeLengthExponent: number;
  referenceRouteHopCount: number;
  fuelEfficiencyStatCapPct: number;
};

let policyKv: Map<string, string> | null = null;
let hullMulByTier: Map<string, number> | null = null;

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      GalaxyTransitFuelPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function getHullMulByTier(): Map<string, number> {
  if (!hullMulByTier) {
    hullMulByTier = new Map(
      GalaxyTransitHullFuelMul_FROM_BALANCE_CSV.map((row) => [
        row.hullTierKey,
        Math.max(0.05, num(row.fuelCostMul, 1)),
      ]),
    );
  }
  return hullMulByTier;
}

export function resolveGalaxyTransitFuelPolicy(): GalaxyTransitFuelPolicy {
  const kv = getPolicyKv();
  return {
    baseCreditsPerHop: Math.max(1, Math.floor(num(kv.get('base_credits_per_hop'), 50))),
    minCreditsPerHop: Math.max(1, Math.floor(num(kv.get('min_credits_per_hop'), 50))),
    referenceHopDistance: Math.max(0.01, num(kv.get('reference_hop_distance'), 0.18)),
    distanceMulMin: Math.max(0.1, num(kv.get('distance_mul_min'), 0.85)),
    distanceMulMax: Math.max(0.1, num(kv.get('distance_mul_max'), 2.25)),
    distanceCurveExponent: Math.max(1, num(kv.get('distance_curve_exponent'), 1.45)),
    hopProgressionRate: Math.max(0, num(kv.get('hop_progression_rate'), 0.12)),
    routeLengthExponent: Math.max(1, num(kv.get('route_length_exponent'), 1.18)),
    referenceRouteHopCount: Math.max(1, num(kv.get('reference_route_hop_count'), 3)),
    fuelEfficiencyStatCapPct: Math.max(0, num(kv.get('fuel_efficiency_stat_cap_pct'), 50)),
  };
}

export function resolveGalaxyTransitHullFuelCostMul(hullTierKey: string): number {
  return getHullMulByTier().get(hullTierKey) ?? 1;
}

export function invalidateGalaxyTransitFuelPolicyCache(): void {
  policyKv = null;
  hullMulByTier = null;
}
