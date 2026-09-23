import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canCommitArcCoreChatDiskWrite } from './arcCoreChatPersistGuard';

test('canCommitArcCoreChatDiskWrite blocks reset window and stale epoch', () => {
  assert.equal(canCommitArcCoreChatDiskWrite(1, 1, false), true);
  assert.equal(canCommitArcCoreChatDiskWrite(1, 1, true), false);
  assert.equal(canCommitArcCoreChatDiskWrite(0, 1, false), false);
  assert.equal(canCommitArcCoreChatDiskWrite(2, 1, false), false);
});
