import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import { resolveTransitEncounterChance } from './missionCombatEncounter';

function active(missionId: string, objectives: Record<string, boolean>): MissionProgress {
  return { missionId, status: 'active', objectives };
}

test('transit_guaranteed 락은 dest와 무관하게 1.0', () => {
  const progresses = { mission_002: active('mission_002', { obj_002_a: false }) };
  assert.equal(
    resolveTransitEncounterChance('safe', false, progresses, 'mission_002', 'nightfall'),
    1,
  );
});

test('락이 없으면 존 확률만', () => {
  assert.equal(resolveTransitEncounterChance('safe', false), 0.1);
  assert.equal(resolveTransitEncounterChance('neutral', false), 0.3);
  assert.equal(resolveTransitEncounterChance('pvp', false), 0.7);
  assert.equal(resolveTransitEncounterChance('safe', true), 0.5);
});
