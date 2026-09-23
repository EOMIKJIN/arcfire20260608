/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeEngine.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectBlueSystemIdsForColonizeHop,
  hopDistanceToNearestBlueHold,
  listAdjacentSystemIdsForColonize,
} from './stelliumColonizeHop';
import { meetsStelliumColonizeHqDefenseSat } from './stelliumColonizeDefenseSat';
import { isStelliumColonizeRimPhase } from './stelliumColonizeTypes';
import { dispatchReadyColonizers, pickNextHandoffTarget } from './stelliumColonizeDispatch';
import {
  collectTravelNeighborIds,
  graftSystemIntoRuntimeCoreAdj,
  listAdjacentFromRuntimeCore,
} from './runtimeConfirmedCoreGraph';
import { listAdjacentSystemIds } from '../territorial/territorialSupplyLine';
import { evaluateStelliumColonizeEligibility } from './stelliumColonizeEligibility';
import {
  computeStelliumColonizeRoll01,
  resolveStelliumColonizeSuccessPct,
} from './stelliumColonizeProbability';
import {
  countInFlight,
  enqueueStelliumColonizeRecord,
  recallStelliumColonizeUnguardedApproaches,
  tickStelliumColonizeDay,
  tickStelliumColonizeOutpost,
} from './stelliumColonizeEngine';
import { addKstDayKey } from './stelliumColonizeDayKey';
import type { StelliumColonizeRecord } from './stelliumColonizeTypes';
import type { PlanetClanHold } from '../../types';
import { createStelliumColonizePolicyForTest } from './stelliumColonizePolicy';

const POLICY = createStelliumColonizePolicyForTest();

function adj(graph: Record<string, string[]>) {
  return (id: string) => graph[id] ?? [];
}

function hold(planetId: string, systemId: string, occupier: string, kind: PlanetClanHold['kind'] = 'clan_hold'): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId: occupier,
    homePlayerUid: null,
    kind,
    capturedAt: 1,
  };
}

test('hop — 1/2/3+ and missing path', () => {
  const graph = {
    a: ['b'],
    b: ['a', 'c'],
    c: ['b', 'd'],
    d: ['c'],
    z: [],
  };
  const blue = new Set(['a']);
  assert.equal(hopDistanceToNearestBlueHold({ systemId: 'b', blueSystemIds: blue, listAdjacent: adj(graph) })?.hops, 1);
  assert.equal(hopDistanceToNearestBlueHold({ systemId: 'c', blueSystemIds: blue, listAdjacent: adj(graph) })?.hops, 2);
  assert.equal(hopDistanceToNearestBlueHold({ systemId: 'd', blueSystemIds: blue, listAdjacent: adj(graph) })?.hops, 3);
  assert.equal(hopDistanceToNearestBlueHold({ systemId: 'z', blueSystemIds: blue, listAdjacent: adj(graph) }), null);
});

test('hop — 아웃포스트 베이스 synth_073 은 CSV에 없고 도착 확인 후 런타임 코어 그래프 1홉', () => {
  assert.deepEqual(listAdjacentSystemIds('synth_073'), []);
  const neighbors = collectTravelNeighborIds('synth_073', {});
  assert.ok(neighbors.includes('arcadia'), `travel=${neighbors.join(',')}`);
  const grafted = graftSystemIntoRuntimeCoreAdj({}, 'synth_073', neighbors);
  assert.equal(grafted.changed, true);
  assert.ok(grafted.next.synth_073.includes('arcadia'));
  assert.ok(grafted.next.arcadia?.includes('synth_073'));

  const listAdjacent = (id: string) =>
    listAdjacentFromRuntimeCore(id, grafted.next, listAdjacentSystemIds(id));
  const blue = collectBlueSystemIdsForColonizeHop({}, () => false);
  assert.ok(blue.has('arcadia'));
  const hop = hopDistanceToNearestBlueHold({
    systemId: 'synth_073',
    blueSystemIds: blue,
    listAdjacent,
  });
  assert.equal(hop?.hops, 1);
  assert.equal(hop?.originSystemId, 'arcadia');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  useWorldStore.setState({ runtimeCoreAdjBySystemId: {} });
  assert.equal(listAdjacentSystemIdsForColonize('synth_073').includes('arcadia'), false);
  useWorldStore.setState({ runtimeCoreAdjBySystemId: grafted.next });
  assert.ok(listAdjacentSystemIdsForColonize('synth_073').includes('arcadia'));
  useWorldStore.setState({ runtimeCoreAdjBySystemId: {} });
});

test('eligibility — RED seed / contested / independent / already BLUE', () => {
  const base = {
    planetId: 'helios_core',
    systemId: 'helios',
    systemUnlocked: true,
    planetInfoRevealed: true,
    hold: hold('helios_core', 'helios', 'neutral', 'neutral'),
    csvInitialOwner: 'NEUTRAL' as const,
    contested: false,
  };
  assert.equal(evaluateStelliumColonizeEligibility(base).ok, true);
  assert.equal(evaluateStelliumColonizeEligibility({ ...base, csvInitialOwner: 'RED' }).ok, false);
  assert.equal(evaluateStelliumColonizeEligibility({ ...base, contested: true }).ok, false);
  assert.equal(
    evaluateStelliumColonizeEligibility({
      ...base,
      hold: hold('helios_core', 'helios', 'solo_1', 'player_independent'),
    }).ok,
    false,
  );
  assert.equal(
    evaluateStelliumColonizeEligibility({
      ...base,
      hold: hold('helios_core', 'helios', 'balance_seed_faction_blue'),
    }).ok,
    false,
  );
  assert.equal(evaluateStelliumColonizeEligibility({ ...base, planetInfoRevealed: false }).ok, false);
});

test('probability — harsh D/E bottoms band, P/T tops band, roll is deterministic', () => {
  const low = resolveStelliumColonizeSuccessPct(1, {
    resource: 50, population: 0, defense: 100, technology: 0, environment: 0,
  }, POLICY);
  const high = resolveStelliumColonizeSuccessPct(1, {
    resource: 50, population: 100, defense: 0, technology: 100, environment: 100,
  }, POLICY);
  assert.ok(low <= 52, `low=${low}`);
  assert.ok(high >= 68, `high=${high}`);
  const a = computeStelliumColonizeRoll01('2026-09-19', 'helios_core', 1);
  const b = computeStelliumColonizeRoll01('2026-09-19', 'helios_core', 1);
  const c = computeStelliumColonizeRoll01('2026-09-20', 'helios_core', 1);
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('queue cap 3 — 4th stays queued, 임무 종료 5분 후에만 다음 출항', () => {
  let records: Record<string, StelliumColonizeRecord> = {};
  let ready: number[] | null = null;
  const planets = ['p1', 'p2', 'p3', 'p4'];
  for (const id of planets) {
    const r = enqueueStelliumColonizeRecord({
      records,
      planetId: id,
      systemId: `s_${id}`,
      hopDistance: 1,
      todayKey: '2026-09-19',
      policy: POLICY,
      nowMs: 1_000,
      fleetReadyAtMs: ready,
      defenseSatLevel: 1,
    });
    records = r.records;
    ready = r.fleetReadyAtMs;
  }
  assert.equal(countInFlight(records), 3);
  assert.equal(records.p4.phase, 'queued');

  const mid: Record<string, StelliumColonizeRecord> = {
    ...records,
    p1: { ...records.p1, phase: 'success', dueDayKey: null },
  };
  const resting = [1_000 + 300_000];
  const immediate = tickStelliumColonizeDay({
    records: mid,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    fleetReadyAtMs: resting,
    handoffSec: 300,
    resolveDefenseSatLevel: () => 1,
    resolveGauges: () => ({ resource: 50, population: 50, defense: 50, technology: 50, environment: 50 }),
  });
  assert.equal(immediate.records.p4.phase, 'queued');

  const later = tickStelliumColonizeDay({
    records: immediate.records,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000 + 300_000,
    fleetReadyAtMs: immediate.fleetReadyAtMs,
    handoffSec: 300,
    resolveDefenseSatLevel: () => 1,
    resolveGauges: () => ({ resource: 50, population: 50, defense: 50, technology: 50, environment: 50 }),
  });
  assert.equal(later.records.p4.phase, 'in_flight');
  assert.equal(later.records.p4.dueDayKey, addKstDayKey('2026-09-19', 1));
});

function queuedRow(planetId: string, hopDistance: number): StelliumColonizeRecord {
  return {
    planetId,
    systemId: `s_${planetId}`,
    factionId: 'stellium',
    phase: 'queued',
    hopDistance,
    travelDays: hopDistance <= 1 ? 1 : hopDistance === 2 ? 2 : 3,
    attempt: 0,
    departedDayKey: null,
    dueDayKey: null,
    outpostDueAtMs: null,
  };
}

test('defense sat gate — L1 미만 보류, L1 이상 통과', () => {
  assert.equal(meetsStelliumColonizeHqDefenseSat(1, 0), false);
  assert.equal(meetsStelliumColonizeHqDefenseSat(1, 1), true);
  assert.equal(meetsStelliumColonizeHqDefenseSat(0, 0), true);
});

test('접근 게이트 — 위성 없으면 queued, 슬롯 미소비', () => {
  const blocked = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'synth_073_p',
    systemId: 'synth_073',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    defenseSatLevel: 0,
  });
  assert.equal(blocked.records.synth_073_p.phase, 'queued');
  assert.equal(blocked.records.synth_073_p.outpostDueAtMs, null);
  assert.equal(blocked.fleetReadyAtMs.length, 3);
  assert.equal(blocked.events.some((e) => e.kind === 'departed'), false);

  const go = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'synth_073_p',
    systemId: 'synth_073',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    defenseSatLevel: 1,
  });
  assert.equal(go.records.synth_073_p.phase, 'in_flight');
  assert.equal(go.fleetReadyAtMs.length, 2);
});

test('접근 게이트 — 무방비 in_flight 는 queued 되돌림', () => {
  const enq = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'synth_073_p',
    systemId: 'synth_073',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    defenseSatLevel: 1,
  });
  const recalled = recallStelliumColonizeUnguardedApproaches({
    records: enq.records,
    fleetReadyAtMs: enq.fleetReadyAtMs,
    nowMs: 2_000,
    requiredDefenseSatLevel: 1,
    resolveDefenseSatLevel: () => 0,
  });
  assert.equal(recalled.records.synth_073_p.phase, 'queued');
  assert.equal(recalled.records.synth_073_p.outpostDueAtMs, null);
  assert.equal(recalled.fleetReadyAtMs.length, 3);
  assert.equal(recalled.events[0]?.kind, 'approach_held');
});

test('dispatch — 위성 L1이면 금고 선지급 실패해도 5분 출항', () => {
  const go = dispatchReadyColonizers({
    records: { fortress: queuedRow('fortress', 3) },
    fleetReadyAtMs: [0],
    nowMs: 1_000,
    todayKey: '2026-09-19',
    cap: 3,
    outpostArriveSec: 300,
    pickSeed: '2026-09-19',
    requiredDefenseSatLevel: 1,
    resolveDefenseSatLevel: () => 1,
    fiscal: {
      canAffordDepart: () => false,
      authorizeDepart: () => {
        throw new Error('authorize must not gate 5min approach');
      },
      onBeforeHqRoll: () => true,
    },
  });
  assert.equal(go.records.fortress.phase, 'in_flight');
  assert.equal(go.records.fortress.outpostDueAtMs, 1_000 + 300_000);
});

test('dispatch — 위성 없는 대기는 건너뛰고 있는 성계만 출항', () => {
  const go = dispatchReadyColonizers({
    records: {
      bare: queuedRow('bare', 1),
      guarded: queuedRow('guarded', 2),
    },
    fleetReadyAtMs: [0],
    nowMs: 1_000,
    todayKey: '2026-09-19',
    cap: 3,
    outpostArriveSec: 300,
    pickSeed: '2026-09-19',
    requiredDefenseSatLevel: 1,
    resolveDefenseSatLevel: (planetId) => (planetId === 'guarded' ? 1 : 0),
  });
  assert.equal(go.records.bare.phase, 'queued');
  assert.equal(go.records.guarded.phase, 'in_flight');
});

test('handoff pick — 최단 홉 우선, 동률은 시드 결정적', () => {
  const a = pickNextHandoffTarget(
    [{ planetId: 'far', hopDistance: 3 }, { planetId: 'near', hopDistance: 1 }],
    'seed',
  );
  assert.equal(a?.planetId, 'near');
  const x = pickNextHandoffTarget(
    [{ planetId: 'p-a', hopDistance: 1 }, { planetId: 'p-b', hopDistance: 1 }],
    'seed-a',
  );
  const y = pickNextHandoffTarget(
    [{ planetId: 'p-a', hopDistance: 1 }, { planetId: 'p-b', hopDistance: 1 }],
    'seed-a',
  );
  assert.equal(x?.planetId, y?.planetId);
});

test('dispatch — 대기 없으면 슬롯 유지, 있으면 최단 홉부터 1대', () => {
  const idle = dispatchReadyColonizers({
    records: {},
    fleetReadyAtMs: [0],
    nowMs: 1_000,
    todayKey: '2026-09-19',
    cap: 3,
    outpostArriveSec: 300,
    pickSeed: '2026-09-19',
  });
  assert.deepEqual(idle.fleetReadyAtMs, [0]);

  const go = dispatchReadyColonizers({
    records: {
      far: queuedRow('far', 3),
      near: queuedRow('near', 1),
    },
    fleetReadyAtMs: [0],
    nowMs: 1_000,
    todayKey: '2026-09-19',
    cap: 3,
    outpostArriveSec: 300,
    pickSeed: '2026-09-19',
  });
  assert.equal(go.records.near.phase, 'in_flight');
  assert.equal(go.records.far.phase, 'queued');
  assert.equal(go.fleetReadyAtMs.length, 0);
});

test('outpost — 5분 후 전초기지, 같은 날에는 사령부 없음', () => {
  const enq = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'helios_core',
    systemId: 'helios',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    outpostArriveSec: 300,
    defenseSatLevel: 1,
  });
  assert.equal(enq.records.helios_core.phase, 'in_flight');
  assert.equal(enq.records.helios_core.outpostDueAtMs, 301_000);
  assert.equal(enq.records.helios_core.dueDayKey, '2026-09-20');
  const early = tickStelliumColonizeOutpost({
    records: enq.records,
    nowMs: 300_000,
  });
  assert.equal(early.records.helios_core.phase, 'in_flight');
  const arrived = tickStelliumColonizeOutpost({
    records: enq.records,
    nowMs: 301_000,
  });
  assert.equal(arrived.records.helios_core.phase, 'outpost');
  const sameDay = tickStelliumColonizeDay({
    records: arrived.records,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 301_000,
    resolveGauges: () => ({ resource: 50, population: 100, defense: 0, technology: 100, environment: 100 }),
  });
  assert.equal(sameDay.records.helios_core.phase, 'outpost');
});

test('림 오렌지 — 접근 중 아님, 전초기지·보류 체류부터', () => {
  assert.equal(isStelliumColonizeRimPhase('in_flight'), false);
  assert.equal(isStelliumColonizeRimPhase('queued'), false);
  assert.equal(isStelliumColonizeRimPhase('outpost'), true);
  assert.equal(isStelliumColonizeRimPhase('fail_wait'), true);
  assert.equal(isStelliumColonizeRimPhase('success'), false);
});

test('HQ hold — 기한에 방위위성 없으면 보류, 설치 후 굴림', () => {
  const enq = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'helios_core',
    systemId: 'helios',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    defenseSatLevel: 1,
  });
  const arrived = tickStelliumColonizeOutpost({
    records: enq.records,
    nowMs: 1_000 + 300_000,
  });
  const held = tickStelliumColonizeDay({
    records: arrived.records,
    todayKey: '2026-09-20',
    policy: POLICY,
    nowMs: 1_000 + 300_000,
    resolveDefenseSatLevel: () => 0,
    resolveGauges: () => ({ resource: 50, population: 100, defense: 0, technology: 100, environment: 100 }),
  });
  assert.equal(held.records.helios_core.phase, 'outpost');
  assert.equal(held.records.helios_core.attempt, 0);
  assert.equal(held.records.helios_core.dueDayKey, '2026-09-20');
  assert.equal(held.events.some((e) => e.kind === 'hq_success' || e.kind === 'hq_fail'), false);

  const ticked = tickStelliumColonizeDay({
    records: held.records,
    todayKey: '2026-09-20',
    policy: POLICY,
    nowMs: 1_000 + 300_000,
    resolveDefenseSatLevel: () => 1,
    resolveGauges: () => ({ resource: 50, population: 100, defense: 0, technology: 100, environment: 100 }),
  });
  const row = ticked.records.helios_core;
  assert.ok(row.phase === 'success' || row.phase === 'fail_wait');
  assert.ok(row.attempt >= 1);
});

test('HQ catch-up — 전초기지 후 due day processes attempt', () => {
  const enq = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'helios_core',
    systemId: 'helios',
    hopDistance: 1,
    todayKey: '2026-09-19',
    policy: POLICY,
    nowMs: 1_000,
    defenseSatLevel: 1,
  });
  const arrived = tickStelliumColonizeOutpost({
    records: enq.records,
    nowMs: 1_000 + 300_000,
  });
  assert.equal(arrived.records.helios_core.phase, 'outpost');
  const ticked = tickStelliumColonizeDay({
    records: arrived.records,
    todayKey: '2026-09-20',
    policy: POLICY,
    nowMs: 1_000 + 300_000,
    resolveDefenseSatLevel: () => 1,
    resolveGauges: () => ({ resource: 50, population: 100, defense: 0, technology: 100, environment: 100 }),
  });
  const row = ticked.records.helios_core;
  assert.ok(row.phase === 'success' || row.phase === 'fail_wait');
  assert.ok(row.attempt >= 1);
});
