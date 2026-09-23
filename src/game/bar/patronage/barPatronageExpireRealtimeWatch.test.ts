/**
 * npx tsx --test src/game/bar/patronage/barPatronageExpireRealtimeWatch.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BarPatronageSession } from '../../../store/barPatronageStore';
import { inspectBarPatronageExpireSchedule } from './barPatronageExpireRealtimeWatch';

function session(endsAtMs: number, phase: BarPatronageSession['phase'] = 'active'): BarPatronageSession {
  return {
    planetId: 'p',
    attendantId: 'a',
    startedAtMs: 1,
    endsAtMs,
    drinksPurchased: 1,
    unlockedBundleTier: 1,
    phase,
    lastDrinkId: 'd',
  };
}

test('inspect — 미래 세션은 next만', () => {
  const out = inspectBarPatronageExpireSchedule(session(9000), 2000);
  assert.equal(out.due, false);
  assert.equal(out.nextAtMs, 9000);
});

test('inspect — 기한 지남은 due · next 없음', () => {
  const out = inspectBarPatronageExpireSchedule(session(1000), 2000);
  assert.equal(out.due, true);
  assert.equal(out.nextAtMs, null);
});

test('inspect — ended·없음은 타이머 없음', () => {
  assert.deepEqual(inspectBarPatronageExpireSchedule(null, 2000), { due: false, nextAtMs: null });
  assert.deepEqual(inspectBarPatronageExpireSchedule(session(1000, 'ended'), 2000), {
    due: false,
    nextAtMs: null,
  });
});
