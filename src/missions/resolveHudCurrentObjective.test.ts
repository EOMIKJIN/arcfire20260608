/**
 * npx tsx --test src/missions/resolveHudCurrentObjective.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission, MissionObjective, MissionProgress } from '../types';
import { resolveHudCurrentObjective } from './resolveHudCurrentObjective';

function obj(
  id: string,
  type: MissionObjective['type'],
  targetId: string,
  quantity?: number,
): MissionObjective {
  return { id, description: id, type, targetId, quantity, complete: false };
}

function mission(objectives: MissionObjective[]): Mission {
  return {
    id: 'sandbox_002',
    title: 't',
    description: '',
    type: 'delivery',
    objectives,
    rewards: { credits: 0, exp: 0 },
    prerequisiteIds: [],
    nextMissionId: null,
    dc: 0,
  };
}

function progress(flags: Record<string, boolean>): MissionProgress {
  return { missionId: 'sandbox_002', status: 'active', objectives: flags };
}

test('cargo short + open reach shows buy_goods again', () => {
  const m = mission([
    obj('obj_s002_a', 'buy_goods', 'food', 3),
    obj('obj_s002_b', 'reach_system', 'vega_outpost'),
  ]);
  const resolved = resolveHudCurrentObjective(
    m,
    progress({ obj_s002_a: true, obj_s002_b: false }),
    [],
  );
  assert.equal(resolved.objective?.id, 'obj_s002_a');
  assert.equal(resolved.cargoShort, true);
});

test('enough cargo keeps reach as current', () => {
  const m = mission([
    obj('obj_s002_a', 'buy_goods', 'food', 3),
    obj('obj_s002_b', 'reach_system', 'vega_outpost'),
  ]);
  const resolved = resolveHudCurrentObjective(
    m,
    progress({ obj_s002_a: true, obj_s002_b: false }),
    [{ goodId: 'food', quantity: 3 }],
  );
  assert.equal(resolved.objective?.id, 'obj_s002_b');
  assert.equal(resolved.cargoShort, false);
});

test('after delivery complete do not revive buy as cargo short', () => {
  const m = mission([
    obj('obj_s002_a', 'buy_goods', 'food', 3),
    obj('obj_s002_b', 'reach_system', 'vega_outpost'),
  ]);
  const resolved = resolveHudCurrentObjective(
    m,
    progress({ obj_s002_a: true, obj_s002_b: true }),
    [],
  );
  assert.equal(resolved.objective, undefined);
  assert.equal(resolved.cargoShort, false);
});

test('unchecked buy stays the current objective', () => {
  const m = mission([
    obj('obj_s002_a', 'buy_goods', 'food', 3),
    obj('obj_s002_b', 'reach_system', 'vega_outpost'),
  ]);
  const resolved = resolveHudCurrentObjective(
    m,
    progress({ obj_s002_a: false, obj_s002_b: false }),
    [],
  );
  assert.equal(resolved.objective?.id, 'obj_s002_a');
  assert.equal(resolved.cargoShort, false);
});
