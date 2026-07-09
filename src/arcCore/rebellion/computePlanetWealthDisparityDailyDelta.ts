// ============================================================
// WDI 일일 Δ — 순수 함수 (단위 테스트·배치 공용)
// ============================================================

import type { WealthDisparityGlobalPolicy } from '../balance/wealthDisparityPolicy';
import { PLANET_ATTACK_KIND } from '../planetAttack/planetAttackKind';

export type WealthDisparityDailyDeltaInput = {
  currentWdi: number;
  rebellionPhase: 'none' | 'simmering' | 'overthrow';
  /** CSV baseline population (0~100) */
  baselinePopulation: number;
  /** runtime population gauge */
  runtimePopulation: number;
  /** attackDamage.daily.byKind — 당일 키 일치 가정 */
  attackDailyByKind: Record<string, number>;
  /** contestedAftermath gap population (negative = below galaxy avg) */
  contestedAftermathPopGap?: number;
  /** dev_population_dome level 0~15 */
  populationDomeLevel: number;
  /** dailyUpkeepCredits > dailyArcFeeCredits */
  fiscalDeficit: boolean;
  domeWdiReductionPerDay: number;
};

export type WealthDisparityDailyDeltaResult = {
  delta: number;
  pressureRise: number;
  stabilizationFall: number;
};

function clampWdi(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computePlanetWealthDisparityDailyDelta(
  input: WealthDisparityDailyDeltaInput,
  policy: WealthDisparityGlobalPolicy,
): WealthDisparityDailyDeltaResult {
  if (input.rebellionPhase === 'overthrow') {
    const fall = Math.min(policy.maxDailyWdiFall, policy.postOverthrowDecayPerDay);
    return { delta: -fall, pressureRise: 0, stabilizationFall: fall };
  }

  let pressureRise = 0;

  const pGap = Math.max(0, input.baselinePopulation - input.runtimePopulation);
  if (pGap > 0) {
    pressureRise += pGap * policy.pDeclineVsBaselineWeight * 0.1;
  }

  let attackEvents = 0;
  for (const [kind, count] of Object.entries(input.attackDailyByKind)) {
    const n = Number(count) || 0;
    if (n <= 0) continue;
    if (kind === PLANET_ATTACK_KIND.ARC_CORE_SPY_INFILTRATION) {
      pressureRise += n * policy.spyEventWeight;
    } else {
      attackEvents += n;
    }
  }
  pressureRise += attackEvents * policy.attackEventWeight;

  const popGap = input.contestedAftermathPopGap ?? 0;
  if (popGap < 0) {
    pressureRise += Math.abs(popGap) * policy.contestedAftermathPopGapWeight;
  }

  if (input.fiscalDeficit) {
    pressureRise += policy.fiscalDeficitWeight * 3;
  }

  let stabilizationFall = policy.naturalDecayPerDay + input.domeWdiReductionPerDay;
  if (pressureRise <= 0.01) {
    stabilizationFall += policy.naturalDecayPerDay * 0.5;
  }

  let delta = pressureRise - stabilizationFall;
  delta = Math.max(-policy.maxDailyWdiFall, Math.min(policy.maxDailyWdiRise, delta));

  return {
    delta,
    pressureRise,
    stabilizationFall,
  };
}

export function applyWealthDisparityDailyDelta(currentWdi: number, delta: number): number {
  return clampWdi(currentWdi + delta);
}

export function resolveWealthDisparityTierFromWdi(
  wdi: number,
  policy: Pick<WealthDisparityGlobalPolicy, 'wdiUnrestMin' | 'wdiDangerMin'>,
): 'stable' | 'unrest' | 'danger' {
  const w = clampWdi(wdi);
  if (w >= policy.wdiDangerMin) return 'danger';
  if (w >= policy.wdiUnrestMin) return 'unrest';
  return 'stable';
}

/** 결정론적 일일 전복 roll — planetId + kstDayKey 시드 */
export function computeRebellionOverthrowRoll01(planetId: string, kstDayKey: string): number {
  const seed = `${planetId}:${kstDayKey}:rebellion_overthrow`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function computeRebellionOverthrowProbability(
  wdi: number,
  factionMul: number,
  policy: {
    wdiDangerMin: number;
    overthrowBaseProbAtDanger: number;
    overthrowProbSpanToMax: number;
  },
): number {
  const w = clampWdi(wdi);
  if (w < policy.wdiDangerMin) return 0;
  const span = Math.max(1, 100 - policy.wdiDangerMin);
  const t = (w - policy.wdiDangerMin) / span;
  const base = policy.overthrowBaseProbAtDanger + t * policy.overthrowProbSpanToMax;
  return Math.max(0, Math.min(1, base * Math.max(0, factionMul)));
}

export function shouldRebellionOverthrowSucceed(
  planetId: string,
  kstDayKey: string,
  wdi: number,
  factionMul: number,
  policy: {
    wdiDangerMin: number;
    overthrowBaseProbAtDanger: number;
    overthrowProbSpanToMax: number;
  },
): boolean {
  const prob = computeRebellionOverthrowProbability(wdi, factionMul, policy);
  if (prob <= 0) return false;
  return computeRebellionOverthrowRoll01(planetId, kstDayKey) < prob;
}
