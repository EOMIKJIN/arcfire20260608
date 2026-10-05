/**
 * npx tsx --test src/game/hubTutorial/tutorialOpeningRaidLogic.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TUTORIAL_OPENING_RAID_DRAW_MS,
  buildTutorialOpeningRaidSeedSlots,
  shouldTutorialOpeningRaidDraw,
} from './tutorialOpeningRaidLogic';

test('20초 무승부는 플레이어가 살아 있을 때만', () => {
  assert.equal(shouldTutorialOpeningRaidDraw(TUTORIAL_OPENING_RAID_DRAW_MS - 1, true), false);
  assert.equal(shouldTutorialOpeningRaidDraw(TUTORIAL_OPENING_RAID_DRAW_MS, true), true);
  assert.equal(shouldTutorialOpeningRaidDraw(TUTORIAL_OPENING_RAID_DRAW_MS + 500, true), true);
  assert.equal(shouldTutorialOpeningRaidDraw(TUTORIAL_OPENING_RAID_DRAW_MS, false), false);
});

test('습격 시드는 홍월 3척과 플레이어 기함', () => {
  const slots = buildTutorialOpeningRaidSeedSlots('Player_scout_ship');
  assert.equal(slots.length, 4);
  assert.deepEqual(
    slots.filter((slot) => slot.team === 'red').map((slot) => slot.captainId),
    [
      'npc_cpt_enemy_arcadia_01',
      'npc_cpt_enemy_arcadia_03',
      'npc_cpt_enemy_solar_01',
    ],
  );
  assert.equal(slots[0]?.isLeader, true);
  assert.equal(slots[3]?.team, 'blue');
  assert.equal(slots[3]?.captainId, 'Player_pilot');
  assert.equal(slots[3]?.npcShipId, 'Player_scout_ship');
});
