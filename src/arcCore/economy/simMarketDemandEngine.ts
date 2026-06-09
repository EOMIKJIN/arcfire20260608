// ============================================================
// 가상 유저(10만 규모) 수요 시뮬 — 표본 500봇 × 스케일
// ============================================================

import {
  LevelBandTargets_FROM_BALANCE_CSV,
  AiVirtualPlayerDensity_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import {
  getEconomyPriceMicroPolicyNum,
  resolveVirtualPlayerDensityPlanetType,
} from '../balance/balanceTableRegistry';
import type { EconomyCategoryKey } from './economyPriceOverlayStore';

export type SimMarketDemandResult = {
  categoryPressures: Record<EconomyCategoryKey, number>;
  virtualPopulation: number;
  sampleCount: number;
  observedCreditsPerHour: number;
  targetCreditsPerHour: number;
};

function emptyPressures(): Record<EconomyCategoryKey, number> {
  return {
    weapon: 0,
    mineral: 0,
    food: 0,
    tech: 0,
    luxury: 0,
    contraband: 0,
    trade_route: 0,
    capital_ship: 0,
  };
}

function pickArchetype(seed: number): 'combat' | 'trade' | 'explore' {
  const roll = seed % 100;
  if (roll < 45) return 'combat';
  if (roll < 80) return 'trade';
  return 'explore';
}

function bandForLevel(level: number) {
  return (
    LevelBandTargets_FROM_BALANCE_CSV.find(
      (b) => level >= Number(b.minLevel) && level <= Number(b.maxLevel),
    ) ?? LevelBandTargets_FROM_BALANCE_CSV[0]
  );
}

function densityForBot(botId: number) {
  const planetTypes = ['safe', 'neutral', 'pvp', 'endgame'] as const;
  const planetType = planetTypes[botId % planetTypes.length]!;
  const key = resolveVirtualPlayerDensityPlanetType(planetType);
  return (
    AiVirtualPlayerDensity_FROM_BALANCE_CSV.find((d) => d.planetType === key)
    ?? AiVirtualPlayerDensity_FROM_BALANCE_CSV.find((d) => d.planetType === 'default')
    ?? AiVirtualPlayerDensity_FROM_BALANCE_CSV[0]
  );
}

/** 카테고리별 수요·공급 압력(-1..1). 양수=수요 과잉→가격 상승 압력 */
export function runVirtualMarketDemandSim(): SimMarketDemandResult {
  const virtualPopulation = getEconomyPriceMicroPolicyNum('virtual_population_size', 100_000);
  const sampleCount = getEconomyPriceMicroPolicyNum('sample_bot_count', 500);
  const scale = virtualPopulation / Math.max(1, sampleCount);

  const demandUnits = emptyPressures();
  const supplyUnits = emptyPressures();
  let totalCredits = 0;
  let totalMinutes = 0;

  for (let i = 0; i < sampleCount; i += 1) {
    const density = densityForBot(i);
    const combatShare = Number(density?.combatShare ?? 0.45);
    const tradeShare = Number(density?.tradeShare ?? 0.35);

    let archetype = pickArchetype(i * 17 + 3);
    const r = (i * 13) % 100;
    if (r < combatShare * 100) archetype = 'combat';
    else if (r < (combatShare + tradeShare) * 100) archetype = 'trade';
    else archetype = 'explore';

    const level = 1 + (i % 60);
    const band = bandForLevel(level);
    const minutesPlayed = 30 + (i * 7) % 180;
    const creditsPerHour = Number(band?.targetCreditsPerHour ?? 1200);
    const creditsEarned = Math.round((minutesPlayed / 60) * creditsPerHour);
    totalCredits += creditsEarned * scale;
    totalMinutes += minutesPlayed * scale;

    const spendBudget = creditsEarned * (archetype === 'trade' ? 0.55 : 0.25);

    if (archetype === 'combat') {
      demandUnits.weapon += spendBudget * 0.45;
      demandUnits.capital_ship += spendBudget * 0.08;
      supplyUnits.mineral += spendBudget * 0.12;
    } else if (archetype === 'trade') {
      demandUnits.trade_route += spendBudget * 0.35;
      demandUnits.food += spendBudget * 0.12;
      demandUnits.tech += spendBudget * 0.1;
      demandUnits.luxury += spendBudget * 0.08;
      demandUnits.contraband += spendBudget * 0.04;
      supplyUnits.mineral += spendBudget * 0.15;
      supplyUnits.food += spendBudget * 0.1;
    } else {
      demandUnits.luxury += spendBudget * 0.15;
      demandUnits.tech += spendBudget * 0.08;
      demandUnits.mineral += spendBudget * 0.1;
      supplyUnits.food += spendBudget * 0.05;
    }

    if (level >= 20) demandUnits.weapon += spendBudget * 0.06;
    if (level >= 35) demandUnits.contraband += spendBudget * 0.03;
  }

  const pressures = emptyPressures();
  for (const key of Object.keys(demandUnits) as EconomyCategoryKey[]) {
    const d = demandUnits[key];
    const s = supplyUnits[key];
    const total = d + s + 1;
    pressures[key] = Math.max(-1, Math.min(1, (d - s) / total));
  }

  const observedCreditsPerHour = totalMinutes > 0 ? (totalCredits / totalMinutes) * 60 : 0;
  const midBand = LevelBandTargets_FROM_BALANCE_CSV[Math.floor(LevelBandTargets_FROM_BALANCE_CSV.length / 2)];
  const targetCreditsPerHour = Number(midBand?.targetCreditsPerHour ?? 1200);

  return {
    categoryPressures: pressures,
    virtualPopulation,
    sampleCount,
    observedCreditsPerHour,
    targetCreditsPerHour,
  };
}

/** 압력 → 목표 배율(1 ± pressure × gain) */
export function pressureToTargetMultiplier(pressure: number, gain = 0.1): number {
  return 1 + Math.max(-1, Math.min(1, pressure)) * gain;
}
