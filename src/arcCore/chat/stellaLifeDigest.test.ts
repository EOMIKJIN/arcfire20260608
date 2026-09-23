import assert from 'node:assert/strict';
import { test } from 'node:test';
import { consolidateStellaLifeSnapshot } from './stellaLifeDigest';
import { emptyStellaLifeSnapshot } from './stellaLifeSnapshot';
import { stellaLifeAddDayKey, stellaLifeDayKey } from './stellaLifeClock';

const NOW = Date.UTC(2026, 8, 21, 3, 0, 0, 0);

test('new account does not invent pre-install days', () => {
  const first = consolidateStellaLifeSnapshot(emptyStellaLifeSnapshot(), NOW, 'uid-a', false);
  const yesterday = stellaLifeAddDayKey(stellaLifeDayKey(NOW), -1);
  assert.equal(first.digests.length, 0);
  assert.equal(first.lastConsolidatedDayKey, yesterday);
  const second = consolidateStellaLifeSnapshot(first, NOW, 'uid-a', false);
  assert.equal(second.digests.length, 0);
  assert.equal(second.lastConsolidatedDayKey, yesterday);
});

test('existing account backfills at most 3 gap days and is idempotent', () => {
  const yesterday = stellaLifeAddDayKey(stellaLifeDayKey(NOW), -1);
  const seeded = emptyStellaLifeSnapshot();
  seeded.lastConsolidatedDayKey = stellaLifeAddDayKey(yesterday, -2);
  const first = consolidateStellaLifeSnapshot(seeded, NOW, 'uid-a', false);
  assert.ok(first.digests.length <= 3);
  assert.ok(first.digests.length >= 1);
  assert.equal(first.lastConsolidatedDayKey, yesterday);
  assert.equal(first.digests[0]?.done.length, 2);
  const second = consolidateStellaLifeSnapshot(first, NOW, 'uid-a', false);
  assert.deepEqual(second.digests, first.digests);
});

test('absorb does not pull unmatched traits toward 50', () => {
  const yesterday = stellaLifeAddDayKey(stellaLifeDayKey(NOW), -1);
  const seeded = emptyStellaLifeSnapshot();
  seeded.lastConsolidatedDayKey = stellaLifeAddDayKey(yesterday, -1);
  seeded.traits.warmth = 72;
  seeded.digests = Array.from({ length: 14 }, (_, i) => ({
    d: `2026-08-${String(10 + i).padStart(2, '0')}`,
    mood: 80,
    driveId: 'duty' as const,
    goalId: 'g',
    done: ['당직', 'duty'],
    withPlayer: 0 as const,
  }));
  const next = consolidateStellaLifeSnapshot(seeded, NOW, 'uid-a', false);
  assert.equal(next.traits.warmth, 72);
});

test('clock rollback is no-op', () => {
  const done = consolidateStellaLifeSnapshot(emptyStellaLifeSnapshot(), NOW, 'uid-a', true);
  const earlier = NOW - 10 * 24 * 60 * 60 * 1000;
  const rolled = consolidateStellaLifeSnapshot(done, earlier, 'uid-a', false);
  assert.equal(rolled.lastConsolidatedDayKey, done.lastConsolidatedDayKey);
});
