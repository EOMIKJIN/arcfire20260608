// ============================================================
// Sim-Bot 200 Engine — `2.2.ArcCore_AABS_Final_Spec_v2.2.md` §2-A
// ============================================================

import { PLAYER_LEVEL_EXP_FROM_CSV } from '../../data/generated';
import {
  LevelBandTargets_FROM_BALANCE_CSV,
  AiVirtualPlayerDensity_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { resolveVirtualPlayerDensityPlanetType } from '../balance/balanceTableRegistry';
import {
  AABS_CRITICAL_DRIFT_RATIO,
  AABS_SIM_BOT_COUNT,
  type AabsDriftReport,
  type AabsMultiplierKey,
} from './aabsConstants';

export type SimBotArchetype = 'combat' | 'trade' | 'explore';

export type SimBotResult = {
  botId: number;
  archetype: SimBotArchetype;
  level: number;
  minutesPlayed: number;
  creditsEarned: number;
  expEarned: number;
};

export type SimBotAggregate = {
  bots: SimBotResult[];
  avgMinutesPerLevel: number;
  avgCreditsPerHour: number;
  driftReports: AabsDriftReport[];
  criticalDriftKeys: AabsMultiplierKey[];
};

function pickArchetype(seed: number): SimBotArchetype {
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

function expToReachLevel(level: number): number {
  const row = PLAYER_LEVEL_EXP_FROM_CSV.find((r) => Number(r.level) === level);
  return row ? Number(row.currentExp) : 0;
}

function densityRowForBot(botId: number) {
  const planetTypes = ['safe', 'neutral', 'pvp', 'endgame'] as const;
  const planetType = planetTypes[botId % planetTypes.length]!;
  const key = resolveVirtualPlayerDensityPlanetType(planetType);
  return (
    AiVirtualPlayerDensity_FROM_BALANCE_CSV.find((d) => d.planetType === key)
    ?? AiVirtualPlayerDensity_FROM_BALANCE_CSV.find((d) => d.planetType === 'default')
    ?? AiVirtualPlayerDensity_FROM_BALANCE_CSV[0]
  );
}

export function runSimBot200Engine(expMul = 1, creditMul = 1): SimBotAggregate {

  const bots: SimBotResult[] = [];
  let totalMinutes = 0;
  let totalLevels = 0;
  let totalCredits = 0;

  for (let i = 0; i < AABS_SIM_BOT_COUNT; i += 1) {
    const density = densityRowForBot(i);
    const combatShare = Number(density?.combatShare ?? 0.45);
    const tradeShare = Number(density?.tradeShare ?? 0.35);
    let archetype = pickArchetype(i * 17 + 3);
    const r = (i * 13) % 100;
    if (r < combatShare * 100) archetype = 'combat';
    else if (r < (combatShare + tradeShare) * 100) archetype = 'trade';
    else archetype = 'explore';

    const level = 1 + (i % 20);
    const band = bandForLevel(level);
    const targetMinPerLevel = Number(band?.targetMinutesPerLevel ?? 30);
    const targetCreditsHour = Number(band?.targetCreditsPerHour ?? 1000);

    const archetypeMinMul = archetype === 'combat' ? 0.92 : archetype === 'trade' ? 1.05 : 1.1;
    const minutesPlayed = Math.round(targetMinPerLevel * level * archetypeMinMul);
    const creditsPerHour = targetCreditsHour * creditMul * (archetype === 'trade' ? 1.08 : 0.95);
    const creditsEarned = Math.round((minutesPlayed / 60) * creditsPerHour);
    const expEarned = Math.round(expToReachLevel(level) * expMul * (archetype === 'combat' ? 1.05 : 0.98));

    bots.push({ botId: i, archetype, level, minutesPlayed, creditsEarned, expEarned });
    totalMinutes += minutesPlayed;
    totalLevels += level;
    totalCredits += creditsEarned;
  }

  const avgMinutesPerLevel = totalMinutes / Math.max(1, totalLevels);
  const avgCreditsPerHour = totalCredits / Math.max(1, totalMinutes / 60);

  const midBand = bandForLevel(Math.round(totalLevels / AABS_SIM_BOT_COUNT));
  const targetMin = Number(midBand?.targetMinutesPerLevel ?? 30);
  const targetCredits = Number(midBand?.targetCreditsPerHour ?? 1000);

  const driftReports: AabsDriftReport[] = [
    buildDrift('expReward', targetMin, avgMinutesPerLevel),
    buildDrift('creditReward', targetCredits, avgCreditsPerHour),
  ];

  const criticalDriftKeys = driftReports.filter((d) => d.criticalDrift).map((d) => d.key);

  return { bots, avgMinutesPerLevel, avgCreditsPerHour, driftReports, criticalDriftKeys };
}

function buildDrift(key: AabsMultiplierKey, target: number, observed: number): AabsDriftReport {
  const gapRatio = target > 0 ? (observed - target) / target : 0;
  const absGap = Math.abs(gapRatio);
  const criticalDrift = absGap >= AABS_CRITICAL_DRIFT_RATIO;
  let severity: AabsDriftReport['severity'] = 'ok';
  if (absGap >= AABS_CRITICAL_DRIFT_RATIO) severity = 'critical';
  else if (absGap >= AABS_CRITICAL_DRIFT_RATIO * 0.5) severity = 'warn';
  return { key, target, observed, gapRatio, severity, criticalDrift };
}
