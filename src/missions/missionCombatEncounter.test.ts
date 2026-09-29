import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import { resolveTransitEncounterChance } from './missionCombatEncounter';

function active(missionId: string, objectives: Record<string, boolean>): MissionProgress {
  return { missionId, status: 'active', objectives };
}

test('앵커 없는 tq 락은 항로 존 확률을 가로채지 않는다', () => {
  const progresses = { tq_cbt_01: active('tq_cbt_01', { obj_tq_c01_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('safe', false, progresses, 'tq_cbt_01', 'nightfall'),
    0.1,
  );
});

test('hub_orbit 퀘스트는 항로 존 확률을 가로채지 않는다', () => {
  const progresses = { mission_002: active('mission_002', { obj_002_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('safe', false, progresses, 'mission_002', 'nightfall'),
    0.1,
  );
});

test('락이 없으면 존 확률만', () => {
  assert.equal(resolveTransitEncounterChance('safe', false), 0.1);
  assert.equal(resolveTransitEncounterChance('neutral', false), 0.3);
  assert.equal(resolveTransitEncounterChance('pvp', false), 0.7);
  assert.equal(resolveTransitEncounterChance('safe', true), 0.5);
});
