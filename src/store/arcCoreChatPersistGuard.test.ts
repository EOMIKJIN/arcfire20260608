import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canCommitArcCoreChatDiskWrite, canPersistArcCoreChat } from './arcCoreChatPersistGuard';

test('canCommitArcCoreChatDiskWrite blocks reset window and stale epoch', () => {
  assert.equal(canCommitArcCoreChatDiskWrite(1, 1, false), true);
  assert.equal(canCommitArcCoreChatDiskWrite(1, 1, true), false);
  assert.equal(canCommitArcCoreChatDiskWrite(0, 1, false), false);
  assert.equal(canCommitArcCoreChatDiskWrite(2, 1, false), false);
});

test('canPersistArcCoreChat never writes before hydrate', () => {
  assert.equal(canPersistArcCoreChat(false, 1, 1, false), false);
  assert.equal(canPersistArcCoreChat(true, 1, 1, false), true);
  assert.equal(canPersistArcCoreChat(true, 1, 1, true), false);
  assert.equal(canPersistArcCoreChat(true, 0, 1, false), false);
});
