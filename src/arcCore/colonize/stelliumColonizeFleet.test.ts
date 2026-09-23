/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeFleet.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveStelliumColonizeFleet,
  scaleStelliumColonizeTravelDays,
} from './stelliumColonizeFleet';
import { createStelliumColonizePolicyForTest } from './stelliumColonizePolicy';

const POLICY = createStelliumColonizePolicyForTest();

test('fleet default — 표시 1 · 운용 3 · 속도 1 · 전초기지 300초 · 홉일 유지', () => {
  const fleet = resolveStelliumColonizeFleet(POLICY, []);
  assert.equal(fleet.shipCount, 1);
  assert.equal(fleet.operationalCap, 3);
  assert.equal(fleet.handoffSec, 300);
  assert.equal(fleet.speedMul, 1);
  assert.equal(fleet.outpostArriveSec, 300);
  assert.equal(scaleStelliumColonizeTravelDays(1, fleet.speedMul), 1);
  assert.equal(scaleStelliumColonizeTravelDays(2, fleet.speedMul), 2);
  assert.equal(scaleStelliumColonizeTravelDays(3, fleet.speedMul), 3);
});
