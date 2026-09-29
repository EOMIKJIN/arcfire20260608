/**
 * npx tsx --test src/game/waveDefense/planetWaveDefensePolicy.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  resolvePlanetWaveDefenseMaxWaves,
  resolvePlanetWaveDefenseWave,
} from './planetWaveDefensePolicy';
import { buildWaveDefenseEnemyFleet, waveDefenseEnemyCount } from './waveDefenseFleet';

test('아르카디아 3판 · 시리우스 6판 · 수도 9판', () => {
  assert.equal(resolvePlanetWaveDefenseMaxWaves('arcadia_prime'), 3);
  assert.equal(resolvePlanetWaveDefenseMaxWaves('sirius_border'), 6);
  assert.equal(resolvePlanetWaveDefenseMaxWaves('core_prime'), 9);
  assert.equal(resolvePlanetWaveDefenseMaxWaves('eternal_throne'), 9);
});

test('시리우스 웨이브별 척수·소스 존이 수도 방향으로 전진', () => {
  const w1 = resolvePlanetWaveDefenseWave('sirius_border', 1);
  const w6 = resolvePlanetWaveDefenseWave('sirius_border', 6);
  assert.equal(w1.enemyCount, 3);
  assert.equal(w1.sourcePlanetId, 'sirius_border');
  assert.equal(w6.enemyCount, 8);
  assert.equal(w6.sourcePlanetId, 'titan_ruins');
  assert.ok(w6.sourceZoneIndex > w1.sourceZoneIndex);
});

test('아르카디아 후반 웨이브는 다음 존 헐', () => {
  const w1 = buildWaveDefenseEnemyFleet(1, 'arcadia_prime');
  const w3 = buildWaveDefenseEnemyFleet(3, 'arcadia_prime');
  assert.equal(w1.length, 3);
  assert.equal(w3.length, 5);
  assert.ok(w1.every((s) => String(s.npcShipId).startsWith('npc_enemy_arcadia_')));
  assert.ok(w3.every((s) => String(s.npcShipId).startsWith('npc_enemy_solar_')));
  assert.notEqual(w1[0]?.npcShipId, w3[0]?.npcShipId);
});

test('레거시 count(planet 없음)는 3·6·12 유지', () => {
  assert.equal(waveDefenseEnemyCount(1), 3);
  assert.equal(waveDefenseEnemyCount(3), 12);
  assert.equal(waveDefenseEnemyCount(3, 'arcadia_prime'), 5);
});

test('정책 CSV에 시리우스 6판이 있다', () => {
  const src = readFileSync(resolve(__dirname, '../../../tables/balance/planet_wave_defense_policy.csv'), 'utf8');
  assert.match(src, /sirius_border,8,6,/);
  assert.match(src, /core_prime,19,9,/);
  assert.match(src, /arcadia_prime,1,3,/);
});
