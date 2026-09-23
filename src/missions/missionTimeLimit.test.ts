import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mission, MissionObjective, MissionProgress } from '../types';
import {
  collectMissionCargoRemovals,
  computeExpiredMissionSweep,
  formatMissionTimeLimitAssigned,
  formatMissionTimeLimitRemaining,
  resolveMissionTimeLimitHours,
  stampMissionExpiresAtMs,
} from './missionTimeLimit';

function obj(
  type: MissionObjective['type'],
  targetId: string,
  quantity?: number,
): MissionObjective {
  return { id: `o_${type}_${targetId}`, description: '', type, targetId, quantity, complete: false };
}

function mission(
  partial: Pick<Mission, 'id' | 'type'> & Partial<Mission> & { objectives: MissionObjective[] },
): Mission {
  return {
    title: partial.id,
    description: '',
    rewards: { credits: 0, exp: 0 },
    prerequisiteIds: [],
    nextMissionId: null,
    dc: 0,
    ...partial,
  };
}

test('assigned format is Nday (Nh)', () => {
  assert.equal(formatMissionTimeLimitAssigned(24), '1day (24h)');
  assert.equal(formatMissionTimeLimitAssigned(48), '2day (48h)');
  assert.equal(formatMissionTimeLimitAssigned(72), '3day (72h)');
  assert.equal(formatMissionTimeLimitAssigned(0), null);
});

test('remaining format matches assigned shape', () => {
  const now = 1_000_000;
  assert.equal(formatMissionTimeLimitRemaining(now + 18 * 3_600_000, now), '0day (18h)');
  assert.equal(formatMissionTimeLimitRemaining(now + 26 * 3_600_000, now), '1day (26h)');
  assert.equal(formatMissionTimeLimitRemaining(now + 12 * 60_000, now), '0day (0h 12m)');
});

test('tutorial combat is 0 even when type is combat', () => {
  const m = mission({
    id: 'mission_002',
    type: 'combat',
    timeLimitHours: 0,
    objectives: [obj('defeat_enemy', 'pirate')],
  });
  assert.equal(resolveMissionTimeLimitHours(m), 0);
  assert.equal(stampMissionExpiresAtMs(m, 10), undefined);
});

test('sandbox combat uses 24h from CSV column', () => {
  const m = mission({
    id: 'sandbox_001',
    type: 'combat',
    timeLimitHours: 24,
    objectives: [obj('defeat_enemy', 'pirate')],
  });
  assert.equal(resolveMissionTimeLimitHours(m), 24);
  assert.equal(stampMissionExpiresAtMs(m, 1000), 1000 + 24 * 3_600_000);
});

test('policy fallback: combat 24 / delivery 72 / tutorial 0', () => {
  const combat = mission({
    id: 'sandbox_x',
    type: 'combat',
    objectives: [obj('defeat_enemy', 'pirate')],
  });
  const delivery = mission({
    id: 'sandbox_y',
    type: 'delivery',
    objectives: [obj('buy_goods', 'food', 10), obj('reach_system', 'minerva')],
  });
  const tutorial = mission({
    id: 'mission_003',
    type: 'delivery',
    objectives: [obj('buy_goods', 'food', 10), obj('reach_system', 'minerva')],
  });
  assert.equal(resolveMissionTimeLimitHours(combat), 24);
  assert.equal(resolveMissionTimeLimitHours(delivery), 72);
  assert.equal(resolveMissionTimeLimitHours(tutorial), 0);
});

test('cargo strip missing quantity falls back to 1', () => {
  const m = mission({
    id: 'sandbox_cargo_qty',
    type: 'delivery',
    objectives: [obj('buy_goods', 'food')],
  });
  assert.deepEqual(collectMissionCargoRemovals(m), [{ goodId: 'food', quantity: 1 }]);
});

test('cargo strip uses max qty per goodId', () => {
  const m = mission({
    id: 'sandbox_cargo',
    type: 'delivery',
    objectives: [
      obj('buy_goods', 'food', 10),
      obj('deliver_cargo', 'food', 10),
      obj('reach_system', 'minerva'),
    ],
  });
  assert.deepEqual(collectMissionCargoRemovals(m), [{ goodId: 'food', quantity: 10 }]);
});

test('sweep deletes active expired progress and restores instance listed', () => {
  const now = 10_000;
  const live: MissionProgress = {
    missionId: 'sandbox_001',
    status: 'active',
    objectives: { a: false },
    startedAt: 1,
    expiresAtMs: now + 1000,
  };
  const expired: MissionProgress = {
    missionId: 'arc_inst_arcadia_prime_01',
    status: 'active',
    objectives: { a: false },
    startedAt: 1,
    expiresAtMs: now - 1,
  };
  const done: MissionProgress = {
    missionId: 'sandbox_done',
    status: 'complete',
    objectives: { a: true },
    expiresAtMs: now - 1,
  };
  const cargoMission = mission({
    id: 'arc_inst_arcadia_prime_01',
    type: 'delivery',
    objectives: [obj('buy_goods', 'tech', 4)],
  });
  const computed = computeExpiredMissionSweep({
    progresses: {
      sandbox_001: live,
      arc_inst_arcadia_prime_01: expired,
      sandbox_done: done,
    },
    activeMissionId: 'arc_inst_arcadia_prime_01',
    nowMs: now,
    resolveMission: (id) => (id === cargoMission.id ? cargoMission : undefined),
  });
  assert.deepEqual(computed.expiredIds, ['arc_inst_arcadia_prime_01']);
  assert.equal(computed.nextProgresses.arc_inst_arcadia_prime_01, undefined);
  assert.equal(computed.nextProgresses.sandbox_001?.status, 'active');
  assert.equal(computed.nextProgresses.sandbox_done?.status, 'complete');
  assert.equal(computed.nextActiveMissionId, 'sandbox_001');
  assert.deepEqual(computed.restoreListedInstanceIds, ['arc_inst_arcadia_prime_01']);
  assert.deepEqual(computed.cargoRemovals, [{ goodId: 'tech', quantity: 4 }]);
});

test('sweep is a no-op when nothing expired', () => {
  const progresses = {
    sandbox_001: {
      missionId: 'sandbox_001',
      status: 'active' as const,
      objectives: {},
      expiresAtMs: 9_000,
    },
  };
  const computed = computeExpiredMissionSweep({
    progresses,
    activeMissionId: 'sandbox_001',
    nowMs: 1_000,
    resolveMission: () => undefined,
  });
  assert.deepEqual(computed.expiredIds, []);
  assert.equal(computed.nextProgresses, progresses);
  assert.equal(computed.cargoRemovals.length, 0);
});
