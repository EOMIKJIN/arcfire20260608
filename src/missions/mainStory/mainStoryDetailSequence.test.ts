import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveMainQuestDetailCursor } from './mainStoryDetailSequence';

test('story_001 is five sequential detail missions of q01', () => {
  const empty = resolveMainQuestDetailCursor('story_001', { objectives: {} });
  assert.equal(empty?.questId, 'story_c01_q01');
  assert.equal(empty?.index1, 1);
  assert.equal(empty?.total, 5);

  const mid = resolveMainQuestDetailCursor('story_001', {
    objectives: { obj_story_001_a: true },
  });
  assert.equal(mid?.index1, 2);
  assert.equal(mid?.total, 5);

  const done = resolveMainQuestDetailCursor('story_001', {
    objectives: {
      obj_story_001_a: true,
      obj_story_001_b: true,
      obj_story_001_c: true,
      obj_story_001_d: true,
      obj_story_001_e: true,
    },
  });
  assert.equal(done?.index1, 5);
  assert.equal(done?.total, 5);
});

test('sandbox missions are not main-quest sequences', () => {
  assert.equal(resolveMainQuestDetailCursor('sandbox_001', { objectives: {} }), null);
});
