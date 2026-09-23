import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission } from '../types';
import {
  computeBarInstanceMissionDifficulty,
  resolveDifficultyTierFromScore,
  scaleBarInstanceMissionRewards,
  BAR_INSTANCE_DIFFICULTY_REWARD_MUL,
  resolveBarInstanceReputationRewardMul,
} from './barInstanceMissionDifficulty';
import type { BarInstancePlanetContext } from './arcCoreInstanceMissionPlanetContext';

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

function makeCtx(partial: Partial<BarInstancePlanetContext>): BarInstancePlanetContext {
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

test('applies dome reputation on top of difficulty tier', () => {
  const base = { credits: 1000, exp: 250 };
  const normal = scaleBarInstanceMissionRewards(base, 'normal', 12);
  assert.equal(resolveBarInstanceReputationRewardMul(12), 1.12);
  assert.equal(normal.credits, 1120);
  assert.equal(normal.exp, 280);
  const expert = scaleBarInstanceMissionRewards(base, 'expert', 45);
  assert.equal(expert.credits, Math.round(1000 * 1.65 * 1.45));
  assert.equal(expert.exp, Math.round(250 * 1.65 * 1.45));
});

test('scales rewards by tier multiplier from NORMAL baseline', () => {
  const base = { credits: 1000, exp: 250 };
  const easy = scaleBarInstanceMissionRewards(base, 'easy');
  const normal = scaleBarInstanceMissionRewards(base, 'normal');
  const hard = scaleBarInstanceMissionRewards(base, 'hard');
  const expert = scaleBarInstanceMissionRewards(base, 'expert');
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
  const easy = computeBarInstanceMissionDifficulty(template, easyCtx, 'arcadia_prime');
  const hard = computeBarInstanceMissionDifficulty(template, hardCtx, 'arcadia_prime');
  assert.ok(hard.score > easy.score);
  assert.ok(
    BAR_INSTANCE_DIFFICULTY_REWARD_MUL[hard.tier].credits
      >= BAR_INSTANCE_DIFFICULTY_REWARD_MUL[easy.tier].credits,
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
  const fighterResult = computeBarInstanceMissionDifficulty(fighter, ctx, 'arcadia_prime');
  const bountyResult = computeBarInstanceMissionDifficulty(bounty, ctx, 'shadow_market');
  assert.ok(bountyResult.score > fighterResult.score);
  assert.notEqual(bountyResult.tier, 'easy');
});
