/**
 * 선술집 ArcCore 인스턴스 의뢰 — 난이도 측정·등급(EASY~EXPERT)·보상 스케일.
 * CSV tq_* 보상 = NORMAL 티어 기준선; 런타임 등급에 따라 CR/EXP 배율 적용.
 */

import type { Mission, MissionReward, ZoneType } from '../types';
import { MISSION_COMBAT_CAPTAINS_FROM_CSV, NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import type { TavernInstancePlanetContext } from './arcCoreInstanceMissionPlanetContext';
import { deriveMissionPlayCategory } from './missionCategory';

export type TavernInstanceMissionDifficultyTier = 'easy' | 'normal' | 'hard' | 'expert';

export type TavernInstanceDifficultyFactors = {
  baseDc: number;
  levelRequired: number;
  deliveryHopCount: number;
  routeZoneRisk: number;
  transitEncounterRisk: number;
  combatEnemyRisk: number;
  cargoQuantityRisk: number;
  exploreHopRisk: number;
};

export type TavernInstanceDifficultyResult = {
  score: number;
  tier: TavernInstanceMissionDifficultyTier;
  factors: TavernInstanceDifficultyFactors;
};

export const TAVERN_INSTANCE_DIFFICULTY_REWARD_MUL: Record<
  TavernInstanceMissionDifficultyTier,
  { credits: number; exp: number }
> = {
  easy: { credits: 0.8, exp: 0.8 },
  normal: { credits: 1.0, exp: 1.0 },
  hard: { credits: 1.3, exp: 1.3 },
  expert: { credits: 1.65, exp: 1.65 },
};

const ENEMY_TEMPLATE_RISK: Record<string, number> = {
  pirate_fighter: 12,
  pirate_cruiser: 24,
  bounty_hunter: 32,
};

function zoneRiskPoints(zone: ZoneType | null | undefined): number {
  if (zone === 'pvp') return 30;
  if (zone === 'neutral') return 15;
  return 5;
}

function transitEncounterRiskPoints(zone: ZoneType | null | undefined, isCombatMission: boolean): number {
  let chance = 0.1;
  if (zone === 'neutral') chance = 0.3;
  if (zone === 'pvp') chance = 0.7;
  if (isCombatMission) chance = Math.min(1, chance + 0.4);
  return Math.round(chance * 22);
}

export function resolveDifficultyTierFromScore(score: number): TavernInstanceMissionDifficultyTier {
  if (score >= 75) return 'expert';
  if (score >= 55) return 'hard';
  if (score >= 35) return 'normal';
  return 'easy';
}

function sumBuyGoodsQuantity(objectives: Mission['objectives']): number {
  let total = 0;
  for (const obj of objectives) {
    if (obj.type !== 'buy_goods') continue;
    total += Math.max(0, obj.quantity ?? 1);
  }
  return total;
}

function resolveCaptainInitialLevel(captainId: string): number {
  for (const row of NPC_CAPTAINS_FROM_CSV) {
    if (row.id === captainId) return row.progression.initialLevel;
  }
  return 1;
}

function pickMissionCombatCaptainId(enemyTemplateId: string, planetId: string): string | null {
  const candidates = MISSION_COMBAT_CAPTAINS_FROM_CSV.filter(
    (row) => row.enemyTemplateId === enemyTemplateId,
  );
  if (candidates.length === 0) return null;
  let bestCaptainId: string | null = null;
  let bestPriority = -1;
  const consider = (rows: typeof candidates) => {
    for (const row of rows) {
      if (row.priority < bestPriority) continue;
      if (row.priority === bestPriority && bestCaptainId) continue;
      bestCaptainId = row.captainId;
      bestPriority = row.priority;
    }
  };
  consider(candidates.filter((row) => row.planetId === planetId));
  if (bestCaptainId) return bestCaptainId;
  consider(candidates.filter((row) => row.planetId == null || row.planetId === ''));
  return bestCaptainId;
}

function resolveCombatEnemyRisk(template: Mission, offerPlanetId: string): number {
  let maxRisk = 0;
  for (const obj of template.objectives) {
    if (obj.type !== 'defeat_enemy') continue;
    const base = ENEMY_TEMPLATE_RISK[obj.targetId] ?? 10;
    const captainId = pickMissionCombatCaptainId(obj.targetId, offerPlanetId);
    const levelBonus = (captainId ? resolveCaptainInitialLevel(captainId) : 1) * 2;
    const qtyBonus = Math.max(0, (obj.quantity ?? 1) - 1) * 4;
    maxRisk = Math.max(maxRisk, base + levelBonus + qtyBonus);
  }
  return maxRisk;
}

/** 배송·항행·탐사 거리·구역·전투·dc·레벨을 합산해 0~100+ 점수 → 등급. */
export function computeTavernInstanceMissionDifficulty(
  template: Mission,
  ctx: TavernInstancePlanetContext,
  offerPlanetId: string,
): TavernInstanceDifficultyResult {
  const play = deriveMissionPlayCategory(template);
  const isCombatMission = play === 'combat';
  const originZone = ctx.originSystemZone;
  const targetZone = ctx.targetSystemZone ?? originZone;
  const routeZoneRisk = Math.max(zoneRiskPoints(originZone), zoneRiskPoints(targetZone));
  const transitEncounterRisk = Math.max(
    transitEncounterRiskPoints(originZone, isCombatMission),
    transitEncounterRiskPoints(targetZone, isCombatMission),
  );

  const deliveryHopCount = ctx.deliveryHopCount ?? 0;
  const hopRisk =
    deliveryHopCount <= 0
      ? 0
      : deliveryHopCount === 1
        ? 8
        : deliveryHopCount === 2
          ? 18
          : deliveryHopCount === 3
            ? 28
            : 38;

  let exploreHopRisk = 0;
  if (template.type === 'explore' || play === 'travel') {
    exploreHopRisk = hopRisk > 0 ? hopRisk : 6;
  }

  const cargoQty = sumBuyGoodsQuantity(template.objectives);
  const cargoQuantityRisk = cargoQty <= 2 ? 0 : cargoQty <= 3 ? 3 : cargoQty <= 4 ? 6 : 9;

  const combatEnemyRisk = isCombatMission ? resolveCombatEnemyRisk(template, offerPlanetId) : 0;

  const baseDc = Math.max(0, template.dc ?? 0);
  const levelRequired = Math.max(1, template.levelRequired ?? 1);

  const factors: TavernInstanceDifficultyFactors = {
    baseDc,
    levelRequired,
    deliveryHopCount,
    routeZoneRisk,
    transitEncounterRisk,
    combatEnemyRisk,
    cargoQuantityRisk,
    exploreHopRisk,
  };

  let score = 0;
  score += baseDc * 2.5;
  score += levelRequired * 4;
  score += hopRisk;
  score += routeZoneRisk * 0.45;
  score += transitEncounterRisk;
  score += combatEnemyRisk;
  score += cargoQuantityRisk;
  score += exploreHopRisk * 0.6;

  if (play === 'delivery') {
    score += transitEncounterRisk * 0.35;
  }

  const tier = resolveDifficultyTierFromScore(Math.round(score));
  return { score: Math.round(score), tier, factors };
}

export function scaleTavernInstanceMissionRewards(
  base: MissionReward,
  tier: TavernInstanceMissionDifficultyTier,
): MissionReward {
  const mul = TAVERN_INSTANCE_DIFFICULTY_REWARD_MUL[tier];
  return {
    credits: Math.max(100, Math.round(base.credits * mul.credits)),
    exp: Math.max(50, Math.round(base.exp * mul.exp)),
    items: base.items ? [...base.items] : undefined,
    skillPointBonus: base.skillPointBonus,
  };
}

export function formatTavernInstanceDifficultyTierLabel(
  tier: TavernInstanceMissionDifficultyTier,
): string {
  switch (tier) {
    case 'easy':
      return 'EASY';
    case 'normal':
      return 'NORMAL';
    case 'hard':
      return 'HARD';
    case 'expert':
      return 'EXPERT';
    default:
      return 'NORMAL';
  }
}
