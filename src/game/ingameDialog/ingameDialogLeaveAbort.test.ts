import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bumpIngameDialogLeaveAbortGen,
  getIngameDialogLeaveAbortGen,
} from './ingameDialogLeaveAbort';

test('leave abort generation advances so in-flight bar turns stop', () => {
  const before = getIngameDialogLeaveAbortGen();
  const after = bumpIngameDialogLeaveAbortGen();
  assert.equal(after, before + 1);
  assert.equal(getIngameDialogLeaveAbortGen(), after);
});
