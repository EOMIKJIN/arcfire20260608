import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveStellaLifeAt, emptyStellaLifeEnv } from './stellaLifeResolve';
import { stellaLifeDayKey, stellaLifeSlotIndex } from './stellaLifeClock';

const NOON = Date.UTC(2026, 8, 21, 3, 0, 0, 0);

test('resolveStellaLifeAt is deterministic for same clock and uid', () => {
  const env = emptyStellaLifeEnv(NOON);
  const a = resolveStellaLifeAt(NOON, 'uid-a', env, null);
  const b = resolveStellaLifeAt(NOON, 'uid-a', env, null);
  assert.deepEqual(a, b);
  assert.equal(a.dayKey, stellaLifeDayKey(NOON));
  assert.equal(a.slotIndex, stellaLifeSlotIndex(NOON));
  assert.ok(a.activityKo.length > 0);
});

test('resolveStellaLifeAt changes with slot or uid', () => {
  const later = NOON + 3 * 60 * 60 * 1000;
  const envA = emptyStellaLifeEnv(NOON);
  const envB = emptyStellaLifeEnv(later);
  const a = resolveStellaLifeAt(NOON, 'uid-a', envA, null);
  const b = resolveStellaLifeAt(later, 'uid-a', envB, null);
  const c = resolveStellaLifeAt(NOON, 'uid-b', envA, null);
  assert.notEqual(a.slotIndex, b.slotIndex);
  assert.ok(a.activityKo !== c.activityKo || a.driveId !== c.driveId || a.goalId !== c.goalId);
});
