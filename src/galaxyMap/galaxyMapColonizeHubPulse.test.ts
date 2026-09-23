import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectStelliumColonizeMarkSystemIds } from '../arcCore/colonize/stelliumColonizeTypes';
import { colonizePulseTiming } from './galaxyMapColonizeHubPulse';

test('collectStelliumColonizeMarkSystemIds — queued/success 제외 · 운용 중만', () => {
  const ids = collectStelliumColonizeMarkSystemIds({
    a: { systemId: 'synth_070', phase: 'outpost' },
    b: { systemId: 'synth_054', phase: 'queued' },
    c: { systemId: 'synth_078', phase: 'in_flight' },
    d: { systemId: 'synth_069', phase: 'fail_wait' },
    e: { systemId: 'synth_001', phase: 'success' },
  });
  assert.deepEqual(ids.sort(), ['synth_069', 'synth_070', 'synth_078']);
});

test('collectStelliumColonizeMarkSystemIds — 같은 성계 중복 제거', () => {
  const ids = collectStelliumColonizeMarkSystemIds({
    p1: { systemId: 'synth_070', phase: 'outpost' },
    p2: { systemId: 'synth_070', phase: 'in_flight' },
  });
  assert.deepEqual(ids, ['synth_070']);
});

test('colonizePulseTiming — 3성계 주기·오프셋이 동시에 같지 않음', () => {
  const a = colonizePulseTiming('synth_070', 0);
  const b = colonizePulseTiming('synth_078', 1);
  const c = colonizePulseTiming('synth_069', 2);
  const sameHalf = a.halfMs === b.halfMs && b.halfMs === c.halfMs;
  const sameDelay = a.delayMs === b.delayMs && b.delayMs === c.delayMs;
  assert.equal(sameHalf && sameDelay, false);
  assert.ok(a.halfMs >= 1100 && a.halfMs <= 1899);
  assert.ok(b.halfMs >= 1100 && b.halfMs <= 1899);
  assert.ok(c.halfMs >= 1100 && c.halfMs <= 1899);
});
