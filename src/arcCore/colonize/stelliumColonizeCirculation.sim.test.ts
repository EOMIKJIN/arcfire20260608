/**
 * 3척 순환 시뮬레이션 — 사령부 성공 후 슬롯 귀환·5분 핸드오프·상한 3.
 * npx tsx --test src/arcCore/colonize/stelliumColonizeCirculation.sim.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addKstDayKey } from './stelliumColonizeDayKey';
import { earliestFleetReadyAtMs } from './stelliumColonizeDispatch';
import {
  countInFlight,
  enqueueStelliumColonizeRecord,
  tickStelliumColonizeDay,
} from './stelliumColonizeEngine';
import { buildStelliumColonizeTrafficShip } from './stelliumColonizeTrafficPose';
import {
  isStelliumColonizeMarkPhase,
  isStelliumColonizeRimPhase,
  type StelliumColonizeEvent,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';
import { createStelliumColonizePolicyForTest } from './stelliumColonizePolicy';

const POLICY = createStelliumColonizePolicyForTest();

const PLANETS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const;
const CAP = 3;
const HANDOFF_MS = 300_000;
const FAVORABLE = {
  resource: 80,
  population: 90,
  defense: 20,
  technology: 90,
  environment: 90,
};

function assertFleetInvariant(
  records: Record<string, StelliumColonizeRecord>,
  ready: number[],
  label: string,
): void {
  const active = countInFlight(records);
  assert.ok(active <= CAP, `${label}: active ${active} > ${CAP}`);
  assert.equal(
    active + ready.length,
    CAP,
    `${label}: inFlight(${active})+ready(${ready.length}) != ${CAP}`,
  );
}

function countPhase(
  records: Record<string, StelliumColonizeRecord>,
  phase: StelliumColonizeRecord['phase'],
): number {
  let n = 0;
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    if (records[keys[i]]?.phase === phase) n += 1;
  }
  return n;
}

function earliestOutpostDueMs(records: Record<string, StelliumColonizeRecord>): number | null {
  let min: number | null = null;
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    const row = records[keys[i]];
    if (!row || row.phase !== 'in_flight') continue;
    const due = row.outpostDueAtMs;
    if (due == null) return 0;
    if (min == null || due < min) min = due;
  }
  return min;
}

function earliestHqDueDay(records: Record<string, StelliumColonizeRecord>): string | null {
  let min: string | null = null;
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    const row = records[keys[i]];
    if (!row) continue;
    if (row.phase !== 'outpost' && row.phase !== 'fail_wait') continue;
    const due = row.dueDayKey;
    if (!due) continue;
    if (min == null || due < min) min = due;
  }
  return min;
}

function tickDay(input: {
  records: Record<string, StelliumColonizeRecord>;
  ready: number[];
  todayKey: string;
  nowMs: number;
}): {
  records: Record<string, StelliumColonizeRecord>;
  ready: number[];
  events: StelliumColonizeEvent[];
} {
  const out = tickStelliumColonizeDay({
    records: input.records,
    todayKey: input.todayKey,
    policy: POLICY,
    nowMs: input.nowMs,
    fleetReadyAtMs: input.ready,
    handoffSec: 300,
    operationalCap: CAP,
    resolveDefenseSatLevel: () => 1,
    resolveGauges: () => FAVORABLE,
  });
  assertFleetInvariant(out.records, out.fleetReadyAtMs, `tick ${input.todayKey}@${input.nowMs}`);
  return { records: out.records, ready: out.fleetReadyAtMs, events: out.events };
}

function assertReturnedAfterHq(row: StelliumColonizeRecord, nowMs: number): void {
  assert.equal(row.phase, 'success');
  assert.equal(isStelliumColonizeMarkPhase(row.phase), false);
  assert.equal(isStelliumColonizeRimPhase(row.phase), false);
  assert.equal(
    buildStelliumColonizeTrafficShip({
      record: row,
      nowMs,
      orbitRadiusPx: 68,
      outpostArriveSec: 300,
      orbitAngleRad: 0,
    }),
    null,
  );
}

test('시뮬레이션 — 사령부 성공 후 마크 소거·5분 슬롯 귀환·3척만 순환', () => {
  let records: Record<string, StelliumColonizeRecord> = {};
  let ready: number[] | null = null;
  let today = '2026-09-19';
  let nowMs = 1_000;

  for (const id of PLANETS) {
    const r = enqueueStelliumColonizeRecord({
      records,
      planetId: id,
      systemId: `sys_${id}`,
      hopDistance: 1,
      todayKey: today,
      policy: POLICY,
      nowMs,
      fleetReadyAtMs: ready,
      operationalCap: CAP,
      defenseSatLevel: 1,
    });
    records = r.records;
    ready = r.fleetReadyAtMs;
    assertFleetInvariant(records, ready, `enqueue ${id}`);
  }

  assert.ok(ready);
  assert.equal(countInFlight(records), 3);
  assert.equal(countPhase(records, 'queued'), 3);
  assert.equal(ready.length, 0);

  let fleet = ready;
  const holds: string[] = [];
  let steps = 0;
  while (countPhase(records, 'success') < PLANETS.length && steps < 80) {
    steps += 1;
    const outpostDue = earliestOutpostDueMs(records);
    const hqDue = earliestHqDueDay(records);
    const nextReady = earliestFleetReadyAtMs(fleet);
    const queued = countPhase(records, 'queued');

    if (outpostDue != null && outpostDue > nowMs) {
      nowMs = outpostDue;
    } else if (hqDue && hqDue > today) {
      today = hqDue;
    } else if (nextReady != null && nextReady > nowMs && queued > 0) {
      const tooSoon = tickDay({ records, ready: fleet, todayKey: today, nowMs });
      assert.equal(
        countPhase(tooSoon.records, 'queued'),
        queued,
        '핸드오프 5분 전에 다음 성계로 출항하면 안 됨',
      );
      nowMs = nextReady;
      records = tooSoon.records;
      fleet = tooSoon.ready;
    } else if (countInFlight(records) === 0 && queued === 0) {
      break;
    }

    const step = tickDay({ records, ready: fleet, todayKey: today, nowMs });
    records = step.records;
    fleet = step.ready;
    for (let i = 0; i < step.events.length; i += 1) {
      const ev = step.events[i];
      if (ev.kind !== 'hq_success') continue;
      holds.push(ev.planetId);
      assertReturnedAfterHq(records[ev.planetId]!, nowMs);
    }
  }

  assert.equal(countPhase(records, 'success'), PLANETS.length);
  assert.equal(holds.length, PLANETS.length);
  assert.equal(countInFlight(records), 0);
  assert.equal(fleet.length, 3);
  assert.ok(steps < 80);
  for (const id of PLANETS) {
    assert.equal(records[id]?.phase, 'success');
    assertReturnedAfterHq(records[id]!, nowMs);
  }
});
