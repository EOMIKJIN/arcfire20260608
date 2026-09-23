// ============================================================
// 수도 방위 — 기존 가중·반란 배율에만 곱함 (CSV 지방 행 무변경)
// ============================================================

import type { TerritorialCombatPolicy } from './arcCoreTerritorialCombatPolicy';
import {
  getArcCoreCapitalDefensePolicy,
  type ArcCoreCapitalDefensePolicy,
} from './arcCoreCapitalDefensePolicy';
import type { CapitalDefenseContext } from './resolveCapitalDefenseContext';
import type { TerritorialRollWeights } from './resolveSupplyEnvelope';

export function applyCapitalDefenseRollWeights(input: {
  ctx: CapitalDefenseContext;
  weights: TerritorialRollWeights;
  policy?: ArcCoreCapitalDefensePolicy;
}): TerritorialRollWeights {
  const policy = input.policy ?? getArcCoreCapitalDefensePolicy();
  const { ctx, weights } = input;
  if (!policy.enabled || ctx.mode !== 'siege_open') return weights;

  const nextBattle = weights.battleWeightPct * policy.capitalBattleWeightMul;
  const nextDeclare = weights.neutralDeclareWeightPct * policy.capitalNeutralDeclareMul;
  const removedBattle = weights.battleWeightPct - nextBattle;
  const removedDeclare = weights.neutralDeclareWeightPct - nextDeclare;
  const absorbed = policy.capitalStatusQuoAbsorb ? removedBattle + removedDeclare : 0;
  return {
    battleWeightPct: nextBattle,
    neutralDeclareWeightPct: nextDeclare,
    statusQuoWeightPct: weights.statusQuoWeightPct + absorbed,
  };
}

export function resolveCapitalDefenseRebellionMul(
  ctx: CapitalDefenseContext,
  policy?: ArcCoreCapitalDefensePolicy,
): number {
  const p = policy ?? getArcCoreCapitalDefensePolicy();
  if (!p.enabled || !ctx.isRouteCapital || ctx.mode === 'not_capital') return 1;
  let mul = p.capitalRebellionOverthrowMul;
  if (ctx.mode === 'hold_defense') mul *= p.capitalRebellionRingMul;
  return mul;
}

export function applyCapitalDefenseCombatPolicy(
  policy: TerritorialCombatPolicy,
  ctx: CapitalDefenseContext,
  defense?: ArcCoreCapitalDefensePolicy,
): TerritorialCombatPolicy {
  const p = defense ?? getArcCoreCapitalDefensePolicy();
  if (!p.enabled || ctx.mode !== 'siege_open') return policy;
  return {
    ...policy,
    defenderAdvantagePct: policy.defenderAdvantagePct + p.capitalDefenderAdvantageBonusPct,
    dominantSideWeightPct: Math.max(0, policy.dominantSideWeightPct - p.capitalAttackerDominantPenaltyPct),
  };
}

export function applyCapitalDefensePoolScore(
  score: number,
  ctx: CapitalDefenseContext,
  policy?: ArcCoreCapitalDefensePolicy,
): number {
  const p = policy ?? getArcCoreCapitalDefensePolicy();
  if (!p.enabled || ctx.mode !== 'siege_open') return score;
  return score - p.capitalPoolScorePenalty;
}
