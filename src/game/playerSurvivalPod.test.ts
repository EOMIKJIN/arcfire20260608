/**
 * 생존포드 — 착륙 가능 성계 이동 허용 · 전투 불가
 * npx tsx --test src/game/playerSurvivalPod.test.ts
 */
import assert from 'node:assert/strict';
import { SURVIVAL_POD_NPC_SHIP_ID } from './survivalPodIds';
import {
  isPlayerOnSurvivalPod,
  isPlayerShipCombatCapable,
  resolvePlayerTravelBlock,
  resolveSurvivalPodDestinationBlock,
} from './survivalPodTravel';
import type { Player } from '../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function stubShip(portraitNpcCapitalShipId: string): Player['ship'] {
  return {
    portraitNpcCapitalShipId,
    hull: 1,
    hullMax: 100,
  } as unknown as Player['ship'];
}

function podPlayer(): Pick<Player, 'ship'> {
  return { ship: stubShip(SURVIVAL_POD_NPC_SHIP_ID) };
}

test('1) 생존포드 — 은하 이동 차단 없음(착륙 가능 성계로 재탑승)', () => {
  const p = podPlayer();
  assert.equal(isPlayerOnSurvivalPod(p), true);
  assert.equal(resolvePlayerTravelBlock(p), null);
  assert.equal(isPlayerShipCombatCapable(p.ship), false);
});

test('2) 생존포드 — RED(착륙 불가) 목적지만 차단', () => {
  const p = podPlayer();
  assert.equal(
    resolveSurvivalPodDestinationBlock({ player: p, destStayBlocked: false }),
    null,
  );
  assert.equal(
    resolveSurvivalPodDestinationBlock({ player: p, destStayBlocked: true }),
    'pod_unlandable',
  );
});

test('3) 일반 전함 — 목적지 stay와 무관하게 포드 목적지 게이트 없음', () => {
  const p = {
    ship: stubShip('Player_npc_red_fleet_1'),
  };
  assert.equal(isPlayerOnSurvivalPod(p), false);
  assert.equal(resolvePlayerTravelBlock(p), null);
  assert.equal(
    resolveSurvivalPodDestinationBlock({ player: p, destStayBlocked: true }),
    null,
  );
});

console.log('[playerSurvivalPod] all tests passed');
