import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission, MissionObjective, MissionProgress } from '../types';
import {
  canCompleteSequentialObjective,
  getCurrentSequentialObjective,
} from './missionObjectiveSequence';

function obj(id: string, type: MissionObjective['type'], targetId: string): MissionObjective {
  return { id, description: id, type, targetId, complete: false };
}

function mission(objectives: MissionObjective[]): Pick<Mission, 'objectives'> {
  return { objectives };
}

function progress(flags: Record<string, boolean>): Pick<MissionProgress, 'objectives'> {
  return { objectives: flags };
}

test('current sequential is the first incomplete row', () => {
  const m = mission([
    obj('a', 'reach_planet', 'solar_station'),
    obj('b', 'talk_npc', 'npc_cpt_bar_ret_01|solar_station'),
    obj('c', 'reach_planet', 'arcadia_prime'),
  ]);
  assert.equal(getCurrentSequentialObjective(m, progress({}))?.id, 'a');
  assert.equal(getCurrentSequentialObjective(m, progress({ a: true }))?.id, 'b');
  assert.equal(getCurrentSequentialObjective(m, progress({ a: true, b: true, c: true })), undefined);
});

test('later talk cannot complete before arrival', () => {
  const m = mission([
    obj('a', 'reach_planet', 'solar_station'),
    obj('b', 'talk_npc', 'npc_cpt_bar_ret_01|solar_station'),
  ]);
  assert.equal(canCompleteSequentialObjective(m, progress({}), 'b'), false);
  assert.equal(canCompleteSequentialObjective(m, progress({ a: true }), 'b'), true);
  assert.equal(canCompleteSequentialObjective(m, progress({}), 'a'), true);
});
