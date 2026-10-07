import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import { resolveTransitEncounterChance } from './missionCombatEncounter';

function active(missionId: string, objectives: Record<string, boolean>): MissionProgress {
  return { missionId, status: 'active', objectives };
}

test('앵커 없는 tq 락은 홉 확률을 가로채지 않는다', () => {
  const progresses = { tq_cbt_01: active('tq_cbt_01', { obj_tq_c01_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('safe', false, progresses, 'tq_cbt_01', 'nightfall'),
    0.6,
  );
});

test('hub_orbit 퀘스트는 홉 확률을 가로채지 않는다', () => {
  const progresses = { mission_002: active('mission_002', { obj_002_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('pvp', false, progresses, 'mission_002', 'nightfall'),
    0.6,
  );
  assert.equal(
    resolveTransitEncounterChance('safe', true, progresses, 'mission_002', 'vega_outpost'),
    0.05,
  );
});

test('아르카디아 도착 일반 항로 조우는 끈다(착륙 해적소탕과 분리)', () => {
  const progresses = { mission_002: active('mission_002', { obj_002_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('safe', true, progresses, 'mission_002', 'arcadia'),
    0,
  );
  assert.equal(resolveTransitEncounterChance('safe', false, undefined, null, 'arcadia'), 0);
});

test('락이 없으면 아르카디아 홉 확률', () => {
  assert.equal(resolveTransitEncounterChance('pvp', false, undefined, null, 'arcadia'), 0);
  assert.equal(resolveTransitEncounterChance('safe', false, undefined, null, 'vega_outpost'), 0.05);
  assert.equal(resolveTransitEncounterChance('neutral', false, undefined, null, 'omega_station'), 0.15);
  assert.equal(resolveTransitEncounterChance('pvp', false, undefined, null, 'crimson_zone'), 0.35);
  assert.equal(resolveTransitEncounterChance('safe', false, undefined, null, 'nightfall'), 0.6);
  assert.equal(resolveTransitEncounterChance('neutral', false, undefined, null, 'eternity'), 0.7);
  assert.equal(resolveTransitEncounterChance('safe', false), 0.05);
  assert.equal(resolveTransitEncounterChance('pvp', true), 0.45);
});
