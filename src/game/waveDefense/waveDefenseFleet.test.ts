/**
 * 웨이브 적함 시드 — 행성 targetCombatLevel / npc_enemy_* 연결
 * npx tsx src/game/waveDefense/waveDefenseFleet.test.ts
 */
import assert from 'node:assert/strict';
import { resolvePlanetTargetCombatLevel } from '../../arcCore/balance/balanceTableRegistry';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated/csvNpcCapitalShips';
import {
  buildWaveDefenseEnemyFleet,
  waveDefenseEnemyCount,
  waveDefenseEnemyShipId,
  waveDefenseInvaderShipId,
  waveDefenseInvaderTier,
} from './waveDefenseFleet';

const SHIP_BY_ID = new Map(NPC_CAPITAL_SHIPS_FROM_CSV.map((row) => [row.id, row]));

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('동시 적함 상한 12 · 웨이브1=3', () => {
  assert.equal(waveDefenseEnemyCount(1), 3);
  assert.equal(waveDefenseEnemyCount(3), 12);
  assert.equal(waveDefenseEnemyCount(9), 12);
});

test('planetId 없으면 레거시 t1..t5', () => {
  assert.equal(waveDefenseEnemyShipId(1), 'npc_wave_invader_t1');
  assert.equal(waveDefenseEnemyShipId(5), 'npc_wave_invader_t5');
  assert.equal(waveDefenseEnemyShipId(9), 'npc_wave_invader_t5');
});

test('인베이더 티어 = ceil(level/2)+wave-1 · 상한 30', () => {
  assert.equal(waveDefenseInvaderTier(1, 1), 1);
  assert.equal(waveDefenseInvaderTier(9, 1), 5);
  assert.equal(waveDefenseInvaderTier(60, 1), 30);
  assert.equal(waveDefenseInvaderTier(60, 9), 30);
  assert.equal(waveDefenseInvaderShipId(1, 1), 'npc_wave_invader_t1');
  assert.equal(waveDefenseInvaderShipId(60, 1), 'npc_wave_invader_t30');
});

test('아르카디아 웨이브 — npc_enemy_arcadia 헐(HP>인베이더)', () => {
  const shipId = waveDefenseEnemyShipId(1, 'arcadia_prime');
  assert.match(shipId, /^npc_enemy_arcadia_/);
  const hull = SHIP_BY_ID.get(shipId);
  assert.ok(hull);
  assert.ok((hull.combat.maxHp ?? 0) > 80);
});

test('이터니티 웨이브 — npc_enemy_eternity 헐(목적지 스케일)', () => {
  assert.equal(resolvePlanetTargetCombatLevel('eternal_throne'), 60);
  const shipId = waveDefenseEnemyShipId(1, 'eternal_throne');
  assert.match(shipId, /^npc_enemy_eternity_/);
  const hull = SHIP_BY_ID.get(shipId);
  assert.ok(hull);
  assert.ok((hull.combat.maxHp ?? 0) >= 700);
});

test('시드 슬롯 수·인스턴스 키 · 행성 함장', () => {
  const fleet = buildWaveDefenseEnemyFleet(1, 'draco_haven');
  assert.equal(fleet.length, 3);
  assert.ok(fleet.every((s) => s.team === 'red'));
  assert.ok(fleet.every((s) => String(s.npcShipId).startsWith('npc_enemy_draco_')));
  assert.ok(fleet.every((s) => String(s.captainId).startsWith('npc_cpt_enemy_draco_')));
  assert.equal(fleet[0]?.combatInstanceKey, 'wave_defense_w1_s0');
});

test('행성 적함 없으면 인베이더 폴백(레벨 맵)', () => {
  const shipId = waveDefenseEnemyShipId(1, '__no_planet_enemy__');
  assert.equal(shipId, 'npc_wave_invader_t1');
  const late = waveDefenseEnemyShipId(1, 'genesis_origin');
  assert.equal(late, 'npc_wave_invader_t30');
  const fleet = buildWaveDefenseEnemyFleet(1, 'genesis_origin');
  assert.equal(fleet.length, 3);
  assert.ok(fleet.every((s) => s.captainId === 'npc_cpt_ai_robot_default'));
});

console.log('waveDefenseFleet.test.ts — all PASS');
