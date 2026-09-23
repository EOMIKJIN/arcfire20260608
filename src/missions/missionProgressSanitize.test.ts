/**
 * npx tsx --test src/missions/missionProgressSanitize.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sanitizeActiveMissionId,
  sanitizeMissionProgresses,
} from './missionProgressSanitize';

test('sanitize — 키/상태/목표만 남기고 손상 행 제거', () => {
  const { progresses, changed } = sanitizeMissionProgresses({
    story_001: {
      missionId: 'story_001',
      status: 'active',
      objectives: { a: true, b: 'no', '': true },
      startedAt: 10.8,
      rewardedAt: 20,
      titleSnapshot: '  본편  ',
    },
    bad_status: { missionId: 'bad_status', status: 'done', objectives: {} },
    mismatch: { missionId: 'other', status: 'complete', objectives: {} },
    not_obj: 'x',
  });
  assert.equal(changed, true);
  assert.equal(progresses.story_001?.status, 'active');
  assert.equal(progresses.story_001?.objectives.a, true);
  assert.equal(progresses.story_001?.objectives.b, false);
  assert.equal(progresses.story_001?.objectives[''], undefined);
  assert.equal(progresses.story_001?.startedAt, 10);
  assert.equal(progresses.story_001?.titleSnapshot, '본편');
  assert.equal(progresses.bad_status, undefined);
  assert.equal(progresses.mismatch, undefined);
});

test('sanitizeActiveMissionId — active 가 아니면 핀 해제', () => {
  const progresses = sanitizeMissionProgresses({
    story_001: { missionId: 'story_001', status: 'complete', objectives: { a: true } },
    sandbox_001: { missionId: 'sandbox_001', status: 'active', objectives: {} },
  }).progresses;
  assert.equal(sanitizeActiveMissionId('story_001', progresses), null);
  assert.equal(sanitizeActiveMissionId('sandbox_001', progresses), 'sandbox_001');
  assert.equal(sanitizeActiveMissionId('missing', progresses), null);
});
