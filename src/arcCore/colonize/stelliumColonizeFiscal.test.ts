/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeFiscal.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canAffordColonizeDepartReserve,
  resolveStelliumColonizeAttemptCredits,
  resolveStelliumColonizeDepartReserveCredits,
  resolveStelliumColonizeHqReserveCredits,
} from './stelliumColonizeCosts';
import {
  enqueueStelliumColonizeRecord,
  tickStelliumColonizeDay,
} from './stelliumColonizeEngine';
import { createStelliumColonizePolicyForTest } from './stelliumColonizePolicy';
import type { StelliumColonizeFiscalHooks } from './stelliumColonizeFiscal';

const POLICY = createStelliumColonizePolicyForTest();
const GAUGES = {
  resource: 50,
  population: 50,
  defense: 50,
  technology: 50,
  environment: 50,
};

test('원가 — 시도 400×D · 출항 선지급 운용+시도 · 사령부 시도+보증', () => {
  assert.equal(resolveStelliumColonizeAttemptCredits(1, POLICY), 400);
  assert.equal(resolveStelliumColonizeAttemptCredits(3, POLICY), 1200);
  assert.equal(resolveStelliumColonizeDepartReserveCredits(1, POLICY), 600);
  assert.equal(resolveStelliumColonizeDepartReserveCredits(3, POLICY), 1800);
  assert.equal(resolveStelliumColonizeHqReserveCredits(POLICY, 1), 8400);
  assert.equal(resolveStelliumColonizeHqReserveCredits(POLICY, 3), 9200);
  assert.equal(canAffordColonizeDepartReserve(600, 0, 600, 0), true);
  assert.equal(canAffordColonizeDepartReserve(600, 0, 600, 600), false);
  assert.equal(canAffordColonizeDepartReserve(1800, 0, 600, 600), true);
  assert.equal(canAffordColonizeDepartReserve(1000, 4000, 600, 0), false);
});

test('방위위성 L1 — 블루 금고 선지급 실패해도 5분 접근 출항', () => {
  const fiscal: StelliumColonizeFiscalHooks = {
    canAffordDepart: () => false,
    authorizeDepart: () => {
      throw new Error('authorize must not run on 5min approach');
    },
    onBeforeHqRoll: () => true,
  };
  const out = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'p1',
    systemId: 's1',
    hopDistance: 1,
    todayKey: '2026-09-20',
    policy: POLICY,
    nowMs: 1_000,
    travelDays: 1,
    fleetReadyAtMs: [0, 0, 0],
    operationalCap: 3,
    defenseSatLevel: 1,
    fiscal,
  });
  assert.equal(out.records.p1?.phase, 'in_flight');
  assert.equal(out.records.p1?.outpostDueAtMs, 1_000 + 300_000);
  assert.equal(out.fleetReadyAtMs.length, 2);
  assert.equal(out.events.some((e) => e.kind === 'departed'), true);
});

test('사령부 잔고 부족 — 롤 보류 · 전초기지 유지', () => {
  const fiscal: StelliumColonizeFiscalHooks = {
    canAffordDepart: () => true,
    authorizeDepart: () => true,
    onBeforeHqRoll: () => false,
  };
  const queued = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'p1',
    systemId: 's1',
    hopDistance: 1,
    todayKey: '2026-09-20',
    policy: POLICY,
    nowMs: 1_000,
    travelDays: 1,
    fleetReadyAtMs: [0, 0, 0],
    operationalCap: 3,
    defenseSatLevel: 1,
  });
  const arrived = tickStelliumColonizeDay({
    records: queued.records,
    todayKey: '2026-09-20',
    policy: POLICY,
    resolveGauges: () => GAUGES,
    nowMs: 400_000,
    outpostArriveSec: 300,
    fleetReadyAtMs: queued.fleetReadyAtMs,
    operationalCap: 3,
    resolveDefenseSatLevel: () => 1,
  });
  assert.equal(arrived.records.p1?.phase, 'outpost');
  const held = tickStelliumColonizeDay({
    records: arrived.records,
    todayKey: arrived.records.p1?.dueDayKey ?? '2026-09-21',
    policy: POLICY,
    resolveGauges: () => GAUGES,
    nowMs: 800_000,
    fleetReadyAtMs: arrived.fleetReadyAtMs,
    operationalCap: 3,
    resolveDefenseSatLevel: () => 1,
    fiscal,
  });
  assert.equal(held.records.p1?.phase, 'outpost');
  assert.equal(held.events.some((e) => e.kind === 'hq_success' || e.kind === 'hq_fail'), false);
});
