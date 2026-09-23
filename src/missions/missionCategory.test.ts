import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission, MissionObjective } from '../types';
import {
  isDeliveryHubLandingMission,
  shouldApplyReachSystemObjective,
} from './missionCategory';

function obj(
  type: MissionObjective['type'],
  targetId: string,
): MissionObjective {
  return { id: `o_${type}`, description: '', type, targetId, complete: false };
}

function mission(
  type: Mission['type'],
  objectives: MissionObjective[],
): Pick<Mission, 'type' | 'objectives'> {
  return { type, objectives };
}

test('all reach_system complete on hub landing only', () => {
  const delivery = mission('delivery', [
    obj('buy_goods', 'food'),
    obj('reach_system', 'minerva'),
  ]);
  const travel = mission('explore', [obj('reach_system', 'new_eden')]);
  assert.equal(isDeliveryHubLandingMission(delivery), true);
  assert.equal(shouldApplyReachSystemObjective(delivery, 'system_arrival'), false);
  assert.equal(shouldApplyReachSystemObjective(delivery, 'hub_landing'), true);
  assert.equal(shouldApplyReachSystemObjective(travel, 'system_arrival'), false);
  assert.equal(shouldApplyReachSystemObjective(travel, 'hub_landing'), true);
});

test('buy+reach without delivery type still lands as delivery', () => {
  const hybrid = mission('trade', [
    obj('buy_goods', 'parts'),
    obj('reach_system', 'solar_port'),
  ]);
  assert.equal(isDeliveryHubLandingMission(hybrid), true);
});
