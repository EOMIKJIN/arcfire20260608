import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveSkillAutoCombatPolicy, skillTurnMs } from './skillAutoCombatPolicy';
import {
  applyJumpBoostToTransitMs,
  applyPostCapNavFuelDiscount,
  listMarketSenseNeighborLabels,
  resolveSensorFogExtraHops,
  resolveWormholeFinderSkipHops,
  wormholeFinderShortcutRoll,
} from './playerOwnedSkillNavAdjust';
import {
  applyRepairDroneDurabilityHeal,
  resolvePlayerHangarShipCap,
  resolvePlayerInventorySlotCount,
} from './playerOwnedSkillFleetAdjust';
import { applyBlackMarketBossToCatalogIds } from './playerOwnedSkillTradeAdjust';

test('auto combat policy turn is 8 seconds', () => {
  const p = resolveSkillAutoCombatPolicy();
  assert.equal(p.turnSec, 8);
  assert.equal(skillTurnMs(), 8000);
  assert.equal(p.monopolyBuyPct, 30);
});

test('jump_boost shortens transit ms by 30%', () => {
  assert.equal(applyJumpBoostToTransitMs(3000, []), 3000);
  assert.equal(applyJumpBoostToTransitMs(3000, ['jump_boost']), 2100);
});

test('star_pathfinder uncharted extra is after the quoted credits', () => {
  const known = applyPostCapNavFuelDiscount(1000, {
    ownedSkillIds: ['star_pathfinder'],
    destSystemId: 'arcadia',
    visitedSystemIds: ['arcadia'],
  });
  assert.equal(known.credits, 1000);
  const fresh = applyPostCapNavFuelDiscount(1000, {
    ownedSkillIds: ['star_pathfinder'],
    destSystemId: 'draco_nebula',
    visitedSystemIds: ['arcadia'],
  });
  assert.equal(fresh.uncharted, true);
  assert.equal(fresh.credits, 850);
});

test('cargo and hangar caps follow fleet skills', () => {
  assert.equal(resolvePlayerInventorySlotCount([]), 100);
  assert.equal(resolvePlayerInventorySlotCount(['cargo_stacking']), 110);
  assert.equal(resolvePlayerHangarShipCap([]), 30);
  assert.equal(resolvePlayerHangarShipCap(['wingman_recruit', 'carrier_command']), 33);
});

test('repair drone heals durability out of combat', () => {
  assert.equal(applyRepairDroneDurabilityHeal(80, []), 80);
  assert.equal(applyRepairDroneDurabilityHeal(80, ['repair_drone']), 81);
  assert.equal(applyRepairDroneDurabilityHeal(100, ['repair_drone']), 100);
});

test('sensor fog extra hop is 1 when sensor_array is owned', () => {
  assert.equal(resolveSensorFogExtraHops([]), 0);
  assert.equal(resolveSensorFogExtraHops(['sensor_array']), 1);
});

test('wormhole finder skip is deterministic for the same route', () => {
  const roll = wormholeFinderShortcutRoll('arcadia', 'minerva');
  assert.ok(roll >= 0 && roll < 100);
  const skip = resolveWormholeFinderSkipHops({
    ownedSkillIds: ['wormhole_finder'],
    hopCount: 3,
    fromSystemId: 'arcadia',
    destSystemId: 'minerva',
  });
  assert.equal(skip === 1, roll < 15);
  assert.equal(resolveWormholeFinderSkipHops({
    ownedSkillIds: ['wormhole_finder'],
    hopCount: 1,
    fromSystemId: 'arcadia',
    destSystemId: 'minerva',
  }), 0);
});

test('black market boss appends contraband sku', () => {
  assert.deepEqual(applyBlackMarketBossToCatalogIds(['food'], []), ['food']);
  assert.deepEqual(applyBlackMarketBossToCatalogIds(['food'], ['black_market_boss']), ['food', 'contraband']);
  assert.deepEqual(applyBlackMarketBossToCatalogIds(['food', 'contraband'], ['black_market_boss']), ['food', 'contraband']);
});

test('market sense neighbor lines include a cargo price', () => {
  const lines = listMarketSenseNeighborLabels('arcadia', {
    arcadia: {
      id: 'arcadia',
      name: '아르카디아',
      connections: ['vega_outpost'],
      planets: [{ name: '아르카디아', tradeGoods: ['food'] } as never],
    } as never,
    vega_outpost: {
      id: 'vega_outpost',
      name: '베가',
      connections: ['arcadia'],
      planets: [{ name: '베가', tradeGoods: ['food'] } as never],
    } as never,
  });
  assert.equal(lines.length, 1);
  assert.match(lines[0]!, /베가 · 식량 팩 42/);
});
