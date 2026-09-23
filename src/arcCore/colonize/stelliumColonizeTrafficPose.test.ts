/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeTrafficPose.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_TRAFFIC_EDGE_R,
  ARC_TRAFFIC_EDGE_Y_MUL,
  ARC_TRAFFIC_ORBIT_Y_MUL,
} from '../orbitPresence/arcNpcTrafficPhaseMath';
import { STELLIUM_COLONIZE_AI_OPERATOR_ID } from './stelliumColonizeIdentity';
import type { StelliumColonizeRecord } from './stelliumColonizeTypes';
import { buildStelliumColonizeTrafficShip } from './stelliumColonizeTrafficPose';

const ROW: StelliumColonizeRecord = {
  planetId: 'synth_073_p',
  systemId: 'synth_073',
  factionId: 'stellium',
  phase: 'in_flight',
  hopDistance: 1,
  travelDays: 1,
  attempt: 0,
  departedDayKey: '2026-09-19',
  dueDayKey: '2026-09-20',
  outpostDueAtMs: 301_000,
};

function screenOffset(ship: NonNullable<ReturnType<typeof buildStelliumColonizeTrafficShip>>, nowMs: number) {
  const dur = Math.max(0.001, ship.phaseDurationSec);
  const departedAt = 301_000 - 300_000;
  const elapsed = ship.phase === 'entering' ? Math.max(0, (nowMs - departedAt) / 1000) : 0;
  const phaseP = ship.phase === 'entering' ? Math.min(1, elapsed / dur) : 1;
  const edgeX = Math.cos(ship.edgeAngleRad) * ARC_TRAFFIC_EDGE_R;
  const edgeY = Math.sin(ship.edgeAngleRad) * ARC_TRAFFIC_EDGE_R * ARC_TRAFFIC_EDGE_Y_MUL;
  const orbitX = Math.cos(ship.orbitAngleRad) * ship.orbitRadiusPx;
  const orbitY = Math.sin(ship.orbitAngleRad) * ship.orbitRadiusPx * ARC_TRAFFIC_ORBIT_Y_MUL;
  const tx = edgeX + (orbitX - edgeX) * phaseP;
  const ty = edgeY + (orbitY - edgeY) * phaseP;
  return Math.hypot(tx, ty);
}

test('reset 직후 in_flight — 5분 동안 entering, 도착 후 dwelling', () => {
  const orbitAngleRad = 0.18 * Math.PI * 2;
  const start = buildStelliumColonizeTrafficShip({
    record: ROW,
    nowMs: 1_000,
    orbitRadiusPx: 68,
    outpostArriveSec: 300,
    orbitAngleRad,
  });
  assert.ok(start);
  assert.equal(start?.captainId, STELLIUM_COLONIZE_AI_OPERATOR_ID);
  assert.equal(start?.phase, 'entering');
  assert.ok((start?.phaseElapsedSec ?? 1) < 0.05);
  assert.equal(start?.phaseDurationSec, 300);

  const mid = buildStelliumColonizeTrafficShip({
    record: ROW,
    nowMs: 151_000,
    orbitRadiusPx: 68,
    outpostArriveSec: 300,
    orbitAngleRad,
  });
  assert.equal(mid?.phase, 'entering');
  assert.ok(Math.abs((mid?.phaseElapsedSec ?? 0) - 150) < 0.05);

  const arrived = buildStelliumColonizeTrafficShip({
    record: ROW,
    nowMs: 301_000,
    orbitRadiusPx: 68,
    outpostArriveSec: 300,
    orbitAngleRad,
  });
  assert.equal(arrived?.phase, 'dwelling');

  const outpost = buildStelliumColonizeTrafficShip({
    record: { ...ROW, phase: 'outpost' },
    nowMs: 301_000,
    orbitRadiusPx: 68,
    outpostArriveSec: 300,
    orbitAngleRad,
  });
  assert.equal(outpost?.phase, 'dwelling');

  assert.equal(
    buildStelliumColonizeTrafficShip({
      record: { ...ROW, phase: 'queued' },
      nowMs: 1_000,
      orbitRadiusPx: 68,
      outpostArriveSec: 300,
      orbitAngleRad,
    }),
    null,
  );
});

test('entering 시작은 외곽, 도착은 근궤도 — 수송선단과 같은 lerp', () => {
  const ship = buildStelliumColonizeTrafficShip({
    record: ROW,
    nowMs: 1_000,
    orbitRadiusPx: 68,
    outpostArriveSec: 300,
    orbitAngleRad: 0.18 * Math.PI * 2,
  });
  assert.ok(ship);
  const far = screenOffset(ship!, 1_000);
  const near = screenOffset(ship!, 301_000);
  assert.ok(far > 180);
  assert.ok(near < 90);
  assert.ok(far > near * 1.8);
});
