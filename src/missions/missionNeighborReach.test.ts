import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission, MissionObjective } from '../types';
import {
  doesReachSystemObjectiveMatch,
  isAnyNeighborReachMission,
  isAnyNeighborReachObjective,
} from './missionNeighborReach';

function obj(type: MissionObjective['type'], targetId: string): MissionObjective {
  return { id: `o_${type}`, description: '', type, targetId, complete: false };
}

function mission(
  id: string,
  objectives: MissionObjective[],
): Pick<Mission, 'id' | 'objectives'> {
  return { id, objectives };
}

test('placeholder reach is any-neighbor', () => {
  const m = mission('sandbox_x', [obj('reach_system', '__neighbor_system__')]);
  assert.equal(isAnyNeighborReachObjective(m.id, m.objectives[0]!), true);
  assert.equal(isAnyNeighborReachMission(m), true);
});

test('named sandbox dest is not any-neighbor', () => {
  const m = mission('sandbox_002', [obj('buy_goods', 'food'), obj('reach_system', 'vega_outpost')]);
  assert.equal(isAnyNeighborReachObjective(m.id, m.objectives[1]!), false);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'vega_outpost', 'arcadia'), true);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'solar_port', 'arcadia'), false);
});

test('neighbor reach completes on any system except offer origin', () => {
  const m = mission('arc_inst_arcadiaprime_01', [
    obj('buy_goods', 'minerals'),
    obj('reach_system', '__neighbor_system__'),
  ]);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'vega_outpost', 'arcadia'), true);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'solar_port', 'arcadia'), true);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'arcadia', 'arcadia'), false);
});

test('already-patched instance dest still completes as any-neighbor', () => {
  const m = mission('arc_inst_arcadiaprime_02', [
    obj('buy_goods', 'minerals'),
    obj('reach_system', 'helios'),
  ]);
  assert.equal(isAnyNeighborReachObjective(m.id, m.objectives[1]!), true);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'vega_outpost', 'arcadia'), true);
  assert.equal(doesReachSystemObjectiveMatch(m, m.objectives[1]!, 'arcadia', 'arcadia'), false);
});
