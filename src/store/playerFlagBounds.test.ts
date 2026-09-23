/**
 * npx tsx --test src/store/playerFlagBounds.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX,
  SEEN_STORY_SCENE_IDS_MAX,
  capBoundedStringList,
} from './playerFlagBounds';

test('capBoundedStringList keeps newest tail', () => {
  const src = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(capBoundedStringList(src, 3), ['c', 'd', 'e']);
  assert.equal(capBoundedStringList(src, 8), src);
});

test('flag caps stay bounded', () => {
  const seen = Array.from({ length: SEEN_STORY_SCENE_IDS_MAX + 12 }, (_, i) => `s${i}`);
  const ack = Array.from({ length: ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX + 8 }, (_, i) => `k${i}`);
  assert.equal(capBoundedStringList(seen, SEEN_STORY_SCENE_IDS_MAX).length, SEEN_STORY_SCENE_IDS_MAX);
  assert.equal(capBoundedStringList(ack, ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX).length, ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX);
});
