/**
 * 총사령관 개인의뢰 — 2홉+ 타성계 · 베가 튜토리얼과 비겹침
 * npx tsx --test src/missions/governorQuestDestination.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { resolveBarInstancePlanetContext } from './arcCoreInstanceMissionPlanetContext';
import {
  GOVERNOR_QUEST_EXCLUDE_SYSTEM_IDS,
  GOVERNOR_QUEST_MIN_HOPS,
  isGovernorQuestOfferCaptain,
} from './governorQuestDestinationPolicy';
import { resolveGalaxySystemHopDistance } from '../world/resolvePlanetSystemPosition';

const KYLE = 'npc_cpt_gov_reserve_blue_01';
const ELLEN = 'npc_cpt_arcadia_lane_01';
const TUTORIAL_SYSTEMS = new Set(['vega_outpost', 'vega_base']);

test('Kyle Dell is a governor offer captain', () => {
  assert.equal(isGovernorQuestOfferCaptain(KYLE), true);
  assert.equal(isGovernorQuestOfferCaptain(ELLEN), false);
});

test('governor dest from Arcadia is never Vega and at least 2 hops', () => {
  for (let i = 0; i < 24; i += 1) {
    const ctx = resolveBarInstancePlanetContext('arcadia_prime', {
      instanceId: `arcadia_prime:gov_seed_${i}`,
      minHops: GOVERNOR_QUEST_MIN_HOPS,
      excludeSystemIds: GOVERNOR_QUEST_EXCLUDE_SYSTEM_IDS,
    });
    assert.ok(ctx.neighborSystemId, `seed ${i} missing dest system`);
    assert.ok(!TUTORIAL_SYSTEMS.has(ctx.neighborSystemId), `seed ${i} → ${ctx.neighborSystemId}`);
    assert.ok(
      ctx.discoveryPlanetId && !TUTORIAL_SYSTEMS.has(ctx.discoveryPlanetId),
      `seed ${i} → planet ${ctx.discoveryPlanetId}`,
    );
    assert.ok(
      ctx.deliveryHopCount >= GOVERNOR_QUEST_MIN_HOPS,
      `seed ${i} hops=${ctx.deliveryHopCount}`,
    );
    assert.equal(
      resolveGalaxySystemHopDistance('arcadia', ctx.neighborSystemId),
      ctx.deliveryHopCount,
    );
  }
});

test('governor personal resolver pins 2+ hop dest and skips Vega', () => {
  const src = readFileSync(resolve(__dirname, './captainPersonalMissionResolver.ts'), 'utf8');
  assert.match(src, /GOVERNOR_QUEST_MIN_HOPS/);
  assert.match(src, /GOVERNOR_QUEST_EXCLUDE_SYSTEM_IDS/);
  assert.match(src, /isGovernorQuestOfferCaptain/);
  assert.match(src, /ctx\.neighborSystemId/);
});
