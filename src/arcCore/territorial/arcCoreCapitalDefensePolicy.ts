// ============================================================
// 4대 항로 수도 방위 우세 — Table-First 정본
// (tables/balance/arc_core_capital_defense_policy.csv)
// 플레이어 웨이브는 적용하지 않음(대표님 2026-09-14).
// ============================================================

import { ArcCoreCapitalDefensePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreCapitalDefensePolicy = {
  policyId: string;
  enabled: boolean;
  siegeGateAlliedMin: number;
  capitalNeutralDeclareMul: number;
  capitalBattleWeightMul: number;
  capitalStatusQuoAbsorb: boolean;
  capitalDefenderAdvantageBonusPct: number;
  capitalAttackerDominantPenaltyPct: number;
  capitalRebellionOverthrowMul: number;
  capitalRebellionRingMul: number;
  capitalPoolPromoteBannedWhenRingIntact: boolean;
  capitalPoolScorePenalty: number;
  capitalSeedRestoreIgnoresHostileAdj: boolean;
};

const DEFAULT_POLICY: ArcCoreCapitalDefensePolicy = {
  policyId: 'default_v1',
  enabled: true,
  siegeGateAlliedMin: 1,
  capitalNeutralDeclareMul: 0.15,
  capitalBattleWeightMul: 0.45,
  capitalStatusQuoAbsorb: true,
  capitalDefenderAdvantageBonusPct: 18,
  capitalAttackerDominantPenaltyPct: 20,
  capitalRebellionOverthrowMul: 0.35,
  capitalRebellionRingMul: 0.55,
  capitalPoolPromoteBannedWhenRingIntact: true,
  capitalPoolScorePenalty: 40,
  capitalSeedRestoreIgnoresHostileAdj: true,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return fallback;
}

let cached: ArcCoreCapitalDefensePolicy | null = null;

function buildPolicy(): ArcCoreCapitalDefensePolicy {
  const row =
    ArcCoreCapitalDefensePolicy_FROM_BALANCE_CSV.find((r) => r.policyId === 'default_v1')
    ?? ArcCoreCapitalDefensePolicy_FROM_BALANCE_CSV[0];
  if (!row) return DEFAULT_POLICY;
  return {
    policyId: row.policyId || DEFAULT_POLICY.policyId,
    enabled: parseBool(row.enabled, DEFAULT_POLICY.enabled),
    siegeGateAlliedMin: Math.max(1, Math.round(parseNum(row.siegeGateAlliedMin, DEFAULT_POLICY.siegeGateAlliedMin))),
    capitalNeutralDeclareMul: Math.min(1, Math.max(0, parseNum(row.capitalNeutralDeclareMul, DEFAULT_POLICY.capitalNeutralDeclareMul))),
    capitalBattleWeightMul: Math.min(1, Math.max(0, parseNum(row.capitalBattleWeightMul, DEFAULT_POLICY.capitalBattleWeightMul))),
    capitalStatusQuoAbsorb: parseBool(row.capitalStatusQuoAbsorb, DEFAULT_POLICY.capitalStatusQuoAbsorb),
    capitalDefenderAdvantageBonusPct: Math.max(0, parseNum(row.capitalDefenderAdvantageBonusPct, DEFAULT_POLICY.capitalDefenderAdvantageBonusPct)),
    capitalAttackerDominantPenaltyPct: Math.max(0, parseNum(row.capitalAttackerDominantPenaltyPct, DEFAULT_POLICY.capitalAttackerDominantPenaltyPct)),
    capitalRebellionOverthrowMul: Math.max(0, parseNum(row.capitalRebellionOverthrowMul, DEFAULT_POLICY.capitalRebellionOverthrowMul)),
    capitalRebellionRingMul: Math.max(0, parseNum(row.capitalRebellionRingMul, DEFAULT_POLICY.capitalRebellionRingMul)),
    capitalPoolPromoteBannedWhenRingIntact: parseBool(
      row.capitalPoolPromoteBannedWhenRingIntact,
      DEFAULT_POLICY.capitalPoolPromoteBannedWhenRingIntact,
    ),
    capitalPoolScorePenalty: Math.max(0, parseNum(row.capitalPoolScorePenalty, DEFAULT_POLICY.capitalPoolScorePenalty)),
    capitalSeedRestoreIgnoresHostileAdj: parseBool(
      row.capitalSeedRestoreIgnoresHostileAdj,
      DEFAULT_POLICY.capitalSeedRestoreIgnoresHostileAdj,
    ),
  };
}

export function getArcCoreCapitalDefensePolicy(): ArcCoreCapitalDefensePolicy {
  if (!cached) cached = buildPolicy();
  return cached;
}

export function invalidateArcCoreCapitalDefensePolicyCache(): void {
  cached = null;
}
