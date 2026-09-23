// ============================================================
// planet_dwell_civic_policy.csv — 체류 중력·상한·판단 문턱
// ============================================================

import { PlanetDwellCivicPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetDwellCivicPolicy = {
  gravityFloor: number;
  gravityPopW: number;
  gravityResW: number;
  gravityCreditsW: number;
  gravityTradeW: number;
  gravityShipyardW: number;
  gravityBarW: number;
  gravityFeeW: number;
  gravitySafeZoneBonus: number;
  gravityPvpZonePen: number;
  frontierPhase0Gravity: number;
  frontierPhase1Gravity: number;
  frontierPhase0Cap: number;
  frontierPhase1Cap: number;
  capMin: number;
  capMax: number;
  dailyStatCap: number;
  considerationRatio: number;
  departScore: number;
  hysteresisRatio: number;
  homeBias: number;
  activityBias: number;
  crowdingExp: number;
  scorePower: number;
  civicAccPerWallSec: number;
  creditsNormRef: number;
  feeNormRef: number;
};

const FALLBACK: PlanetDwellCivicPolicy = {
  gravityFloor: 0.06,
  gravityPopW: 0.3,
  gravityResW: 0.16,
  gravityCreditsW: 0.14,
  gravityTradeW: 0.16,
  gravityShipyardW: 0.06,
  gravityBarW: 0.05,
  gravityFeeW: 0.09,
  gravitySafeZoneBonus: 0.1,
  gravityPvpZonePen: 0.2,
  frontierPhase0Gravity: 0.02,
  frontierPhase1Gravity: 0.07,
  frontierPhase0Cap: 0,
  frontierPhase1Cap: 2,
  capMin: 1,
  capMax: 12,
  dailyStatCap: 2,
  considerationRatio: 0.62,
  departScore: 0.08,
  hysteresisRatio: 0.85,
  homeBias: 0.18,
  activityBias: 0.08,
  crowdingExp: 2,
  scorePower: 1.4,
  civicAccPerWallSec: 0.01,
  creditsNormRef: 80_000,
  feeNormRef: 50_000,
};

function num(raw: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  let v = Number.isFinite(n) ? n : fallback;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}

let cached: PlanetDwellCivicPolicy | null = null;

export function resolvePlanetDwellCivicPolicy(): PlanetDwellCivicPolicy {
  if (cached) return cached;
  const byKey = new Map<string, string>();
  for (const row of PlanetDwellCivicPolicy_FROM_BALANCE_CSV) {
    const key = String(row.key ?? '').trim();
    if (!key) continue;
    byKey.set(key, String(row.value ?? ''));
  }
  const g = (key: string, fallback: number, min?: number, max?: number) =>
    num(byKey.get(key), fallback, min, max);
  cached = {
    gravityFloor: g('gravity_floor', FALLBACK.gravityFloor, 0, 1),
    gravityPopW: g('gravity_pop_w', FALLBACK.gravityPopW, 0, 2),
    gravityResW: g('gravity_res_w', FALLBACK.gravityResW, 0, 2),
    gravityCreditsW: g('gravity_credits_w', FALLBACK.gravityCreditsW, 0, 2),
    gravityTradeW: g('gravity_trade_w', FALLBACK.gravityTradeW, 0, 2),
    gravityShipyardW: g('gravity_shipyard_w', FALLBACK.gravityShipyardW, 0, 2),
    gravityBarW: g('gravity_bar_w', FALLBACK.gravityBarW, 0, 2),
    gravityFeeW: g('gravity_fee_w', FALLBACK.gravityFeeW, 0, 2),
    gravitySafeZoneBonus: g('gravity_safe_zone_bonus', FALLBACK.gravitySafeZoneBonus, 0, 2),
    gravityPvpZonePen: g('gravity_pvp_zone_pen', FALLBACK.gravityPvpZonePen, 0, 2),
    frontierPhase0Gravity: g('frontier_phase0_gravity', FALLBACK.frontierPhase0Gravity, 0, 1),
    frontierPhase1Gravity: g('frontier_phase1_gravity', FALLBACK.frontierPhase1Gravity, 0, 1),
    frontierPhase0Cap: Math.round(g('frontier_phase0_cap', FALLBACK.frontierPhase0Cap, 0, 8)),
    frontierPhase1Cap: Math.round(g('frontier_phase1_cap', FALLBACK.frontierPhase1Cap, 0, 8)),
    capMin: Math.round(g('cap_min', FALLBACK.capMin, 0, 24)),
    capMax: Math.round(g('cap_max', FALLBACK.capMax, 1, 48)),
    dailyStatCap: Math.round(g('daily_stat_cap', FALLBACK.dailyStatCap, 1, 8)),
    considerationRatio: g('consideration_ratio', FALLBACK.considerationRatio, 0.2, 1),
    departScore: g('depart_score', FALLBACK.departScore, 0, 1),
    hysteresisRatio: g('hysteresis_ratio', FALLBACK.hysteresisRatio, 0.4, 1),
    homeBias: g('home_bias', FALLBACK.homeBias, 0, 1),
    activityBias: g('activity_bias', FALLBACK.activityBias, 0, 1),
    crowdingExp: g('crowding_exp', FALLBACK.crowdingExp, 1, 4),
    scorePower: g('score_power', FALLBACK.scorePower, 1, 3),
    civicAccPerWallSec: g('civic_acc_per_wall_sec', FALLBACK.civicAccPerWallSec, 0, 0.1),
    creditsNormRef: g('credits_norm_ref', FALLBACK.creditsNormRef, 1, 1_000_000),
    feeNormRef: g('fee_norm_ref', FALLBACK.feeNormRef, 1, 1_000_000),
  };
  return cached;
}

export function invalidatePlanetDwellCivicPolicyCache(): void {
  cached = null;
}
