import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clampStellaLifeSnapshotToMaxBytes,
  emptyStellaLifeSnapshot,
  parseStellaLifeSnapshot,
  stellaLifeSnapshotBytes,
  STELLA_LIFE_MAX_BYTES,
} from './stellaLifeSnapshot';

test('empty life stays under 3KB', () => {
  const life = emptyStellaLifeSnapshot();
  assert.ok(stellaLifeSnapshotBytes(life) <= STELLA_LIFE_MAX_BYTES);
});

test('parse clamps rings and survives missing v4 shape', () => {
  const parsed = parseStellaLifeSnapshot({
    digests: Array.from({ length: 20 }, (_, i) => ({ d: `2026-09-${10 + i}`, mood: 9, driveId: 'duty' })),
    anchors: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    cognition: { recall: 900, ev: [{ d: '2026-09-01', h5: 1 }] },
  });
  assert.equal(parsed.digests.length, 14);
  assert.equal(parsed.anchors.length, 6);
  assert.equal(parsed.cognition.recall, 100);
  assert.ok(stellaLifeSnapshotBytes(parsed) <= STELLA_LIFE_MAX_BYTES);
});

test('UTF-8 byte clamp drops anchors then digests under 3KB', () => {
  const fat = emptyStellaLifeSnapshot();
  fat.narrative = '가'.repeat(240);
  fat.anchors = Array.from({ length: 6 }, () => '나'.repeat(40));
  fat.digests = Array.from({ length: 14 }, (_, i) => ({
    d: `2026-09-${String(10 + (i % 20)).padStart(2, '0')}`,
    mood: 80,
    driveId: 'duty' as const,
    goalId: 'goal_long_name_here',
    done: ['다'.repeat(24), 'E'.repeat(24)],
    withPlayer: 1 as const,
  }));
  assert.ok(stellaLifeSnapshotBytes(fat) > STELLA_LIFE_MAX_BYTES);
  const clamped = clampStellaLifeSnapshotToMaxBytes(fat);
  assert.ok(stellaLifeSnapshotBytes(clamped) <= STELLA_LIFE_MAX_BYTES);
  assert.ok(clamped.anchors.length < fat.anchors.length || clamped.digests.length < fat.digests.length);
});
