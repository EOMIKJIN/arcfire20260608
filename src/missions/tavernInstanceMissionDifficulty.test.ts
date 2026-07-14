import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission } from '../types';
import {
  computeTavernInstanceMissionDifficulty,
  resolveDifficultyTierFromScore,
  scaleTavernInstanceMissionRewards,
  TAVERN_INSTANCE_DIFFICULTY_REWARD_MUL,
} from './tavernInstanceMissionDifficulty';
import type { TavernInstancePlanetContext } from './arcCoreInstanceMissionPlanetContext';

function makeTemplate(partial: Partial<Mission> & Pick<Mission, 'id' | 'type' | 'objectives'>): Mission {
  return {
    title: partial.title ?? 'test',
    description: partial.description ?? 'test',
    rewards: partial.rewards ?? { credits: 1000, exp: 250 },
    prerequisiteIds: [],
    nextMissionId: null,
    dc: partial.dc ?? 8,
    levelRequired: partial.levelRequired ?? 1,
    ...partial,
  };
}

function makeCtx(partial: Partial<TavernInstancePlanetContext>): TavernInstancePlanetContext {
  return {
    planetId: 'arcadia_prime',
    systemId: 'arcadia',
    neighborSystemId: 'solar_port',
    discoveryPlanetId: 'solar_station',
    deliveryHopCount: 1,
    originSystemZone: 'safe',
    targetSystemZone: 'safe',
    ...partial,
  };
}

test('maps score thresholds to EASY/NORMAL/HARD/EXPERT', () => {
  assert.equal(resolveDifficultyTierFromScore(20), 'easy');
  assert.equal(resolveDifficultyTierFromScore(35), 'normal');
  assert.equal(resolveDifficultyTierFromScore(55), 'hard');
  assert.equal(resolveDifficultyTierFromScore(75), 'expert');
});

test('scales rewards by tier multiplier from NORMAL baseline', () => {
  const base = { credits: 1000, exp: 250 };
  const easy = scaleTavernInstanceMissionRewards(base, 'easy');
  const normal = scaleTavernInstanceMissionRewards(base, 'normal');
  const hard = scaleTavernInstanceMissionRewards(base, 'hard');
  const expert = scaleTavernInstanceMissionRewards(base, 'expert');
  assert.equal(easy.credits, 800);
  assert.equal(easy.exp, 200);
  assert.equal(normal.credits, 1000);
  assert.equal(normal.exp, 250);
  assert.equal(hard.credits, 1300);
  assert.equal(hard.exp, 325);
  assert.equal(expert.credits, 1650);
  assert.equal(expert.exp, 413);
});

test('rates short safe delivery easier than multi-hop pvp route', () => {
  const template = makeTemplate({
    id: 'tq_del_01',
    type: 'delivery',
    objectives: [
      { id: 'a', description: '', type: 'buy_goods', targetId: 'food', quantity: 3, complete: false },
      { id: 'b', description: '', type: 'reach_system', targetId: 'solar_port', complete: false },
    ],
  });
  const easyCtx = makeCtx({
    deliveryHopCount: 1,
    originSystemZone: 'safe',
    targetSystemZone: 'safe',
  });
  const hardCtx = makeCtx({
    deliveryHopCount: 3,
    originSystemZone: 'safe',
    targetSystemZone: 'pvp',
  });
  const easy = computeTavernInstanceMissionDifficulty(template, easyCtx, 'arcadia_prime');
  const hard = computeTavernInstanceMissionDifficulty(template, hardCtx, 'arcadia_prime');
  assert.ok(hard.score > easy.score);
  assert.ok(
    TAVERN_INSTANCE_DIFFICULTY_REWARD_MUL[hard.tier].credits
      >= TAVERN_INSTANCE_DIFFICULTY_REWARD_MUL[easy.tier].credits,
  );
});

test('rates bounty template higher than fighter patrol', () => {
  const fighter = makeTemplate({
    id: 'tq_cbt_01',
    type: 'combat',
    dc: 8,
    levelRequired: 1,
    objectives: [
      { id: 'a', description: '', type: 'defeat_enemy', targetId: 'pirate_fighter', quantity: 1, complete: false },
    ],
  });
  const bounty = makeTemplate({
    id: 'tq_bty_04',
    type: 'combat',
    dc: 12,
    levelRequired: 5,
    objectives: [
      { id: 'a', description: '', type: 'defeat_enemy', targetId: 'bounty_hunter', quantity: 1, complete: false },
    ],
  });
  const ctx = makeCtx({ deliveryHopCount: 0, targetSystemZone: 'neutral' });
  const fighterResult = computeTavernInstanceMissionDifficulty(fighter, ctx, 'arcadia_prime');
  const bountyResult = computeTavernInstanceMissionDifficulty(bounty, ctx, 'shadow_market');
  assert.ok(bountyResult.score > fighterResult.score);
  assert.notEqual(bountyResult.tier, 'easy');
});
