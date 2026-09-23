// ============================================================
// 행성 체류 중력 — 코어·시설·개척 페이즈·실거래 (순수 함수)
// ============================================================

import { resolvePlanetDwellCivicPolicy, type PlanetDwellCivicPolicy } from './planetDwellCivicPolicy';
import type { PlanetDwellSignal } from './planetDwellTypes';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function normalizeFeeGross(gross: number, policy: PlanetDwellCivicPolicy): number {
  const g = Math.max(0, Number.isFinite(gross) ? gross : 0);
  if (g <= 0) return 0;
  return clamp01(Math.log1p(g) / Math.log1p(policy.feeNormRef));
}

export function computePlanetDwellGravity(
  input: Pick<
    PlanetDwellSignal,
    | 'population'
    | 'resource'
    | 'hasTradePort'
    | 'hasShipyard'
    | 'hasBar'
    | 'zone'
    | 'targetCreditsEarned'
    | 'feeGrossNorm'
    | 'isFrontier'
    | 'colonizationPhase'
  >,
  policy: PlanetDwellCivicPolicy = resolvePlanetDwellCivicPolicy(),
): { gravity: number; logicalCap: number } {
  const phase = Math.max(0, Math.floor(input.colonizationPhase));
  if (input.isFrontier && phase <= 0) {
    return { gravity: policy.frontierPhase0Gravity, logicalCap: policy.frontierPhase0Cap };
  }

  if (input.isFrontier && phase === 1) {
    const facility =
      (input.hasTradePort ? policy.gravityTradeW * 0.35 : 0) +
      (input.hasShipyard ? policy.gravityShipyardW * 0.25 : 0);
    const gravity = clamp01(policy.frontierPhase1Gravity + facility);
    return { gravity, logicalCap: policy.frontierPhase1Cap };
  }

  const pop = clamp01(input.population / 100);
  const res = clamp01(input.resource / 100);
  const credits = clamp01(input.targetCreditsEarned / policy.creditsNormRef);
  let raw =
    pop * policy.gravityPopW +
    res * policy.gravityResW +
    credits * policy.gravityCreditsW +
    (input.hasTradePort ? policy.gravityTradeW : 0) +
    (input.hasShipyard ? policy.gravityShipyardW : 0) +
    (input.hasBar ? policy.gravityBarW : 0) +
    clamp01(input.feeGrossNorm) * policy.gravityFeeW;

  if (input.zone === 'safe') raw += policy.gravitySafeZoneBonus;
  if (input.zone === 'pvp' || input.zone === 'endgame') raw -= policy.gravityPvpZonePen;

  const gravity = Math.max(policy.gravityFloor, Math.min(1, raw));
  const t = (gravity - policy.gravityFloor) / Math.max(1e-6, 1 - policy.gravityFloor);
  const logicalCap = Math.max(
    policy.capMin,
    Math.min(policy.capMax, Math.round(policy.capMin + (policy.capMax - policy.capMin) * t)),
  );
  return { gravity, logicalCap };
}
