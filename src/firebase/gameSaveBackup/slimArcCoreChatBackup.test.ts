import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STELLA_LIFE_MAX_BYTES, stellaLifeSnapshotBytes } from '../../arcCore/chat/stellaLifeSnapshot';
import { slimGameSaveSnapshotForUpload } from './slimGameSaveSnapshotForUpload';

test('game-save slim clamps chat life and message FIFO', () => {
  const raw = JSON.stringify({
    schemaVersion: 5,
    messages: Array.from({ length: 50 }, (_, i) => ({
      id: `m${i}`,
      role: 'user',
      text: `t${i}`,
      atMs: i,
    })),
    lastFired: [],
    life: {
      narrative: '가'.repeat(240),
      anchors: Array.from({ length: 8 }, () => '나'.repeat(40)),
      digests: Array.from({ length: 20 }, (_, i) => ({
        d: `2026-08-${String(10 + (i % 18)).padStart(2, '0')}`,
        mood: 80,
        driveId: 'duty',
        done: ['다'.repeat(24), 'E'.repeat(24)],
      })),
    },
  });
  const { snapshot, slimmedKeys } = slimGameSaveSnapshotForUpload({
    arcfire_arc_core_chat_v1: raw,
  });
  const parsed = JSON.parse(snapshot.arcfire_arc_core_chat_v1 ?? '{}');
  assert.ok(slimmedKeys.includes('arcfire_arc_core_chat_v1'));
  assert.equal(parsed.messages.length, 40);
  assert.ok(stellaLifeSnapshotBytes(parsed.life) <= STELLA_LIFE_MAX_BYTES);
});
