import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beginUiScreenShell,
  bindUiSequenceDialogBusy,
  clearUiForegroundSequence,
  endUiScreenShell,
  enqueueAfterUiScreenReady,
  flushUiScreenReadyTasks,
  isUiScreenShellReady,
  markUiScreenShellReady,
  runWhenUiScreenReady,
} from './uiForegroundSequence';

test('dialog waits for screen shell, then runs once', () => {
  clearUiForegroundSequence();
  beginUiScreenShell('bar');
  assert.equal(isUiScreenShellReady(), false);
  const order: string[] = [];
  enqueueAfterUiScreenReady(() => {
    order.push('dialog');
  });
  assert.deepEqual(order, []);
  markUiScreenShellReady('bar');
  assert.equal(isUiScreenShellReady(), true);
  assert.deepEqual(order, ['dialog']);
  endUiScreenShell('bar');
});

test('leaving a screen drops queued dialogs', () => {
  clearUiForegroundSequence();
  beginUiScreenShell('bar');
  let ran = false;
  enqueueAfterUiScreenReady(() => {
    ran = true;
  });
  endUiScreenShell('bar');
  assert.equal(ran, false);
  assert.equal(isUiScreenShellReady(), true);
});

test('no shell means immediate present', () => {
  clearUiForegroundSequence();
  let ran = false;
  const ok = runWhenUiScreenReady(() => {
    ran = true;
    return true;
  });
  assert.equal(ok, true);
  assert.equal(ran, true);
});

test('flush drains queued tasks until a dialog becomes busy', () => {
  clearUiForegroundSequence();
  bindUiSequenceDialogBusy(() => false);
  beginUiScreenShell('hub');
  const order: string[] = [];
  enqueueAfterUiScreenReady(() => {
    order.push('a');
  });
  enqueueAfterUiScreenReady(() => {
    order.push('b');
  });
  markUiScreenShellReady('hub');
  assert.deepEqual(order, ['a', 'b']);
  endUiScreenShell('hub');
  bindUiSequenceDialogBusy(() => false);
});

test('flush stops when the first queued task occupies the dialog', () => {
  clearUiForegroundSequence();
  let busy = false;
  bindUiSequenceDialogBusy(() => busy);
  beginUiScreenShell('hub');
  const order: string[] = [];
  enqueueAfterUiScreenReady(() => {
    order.push('a');
    busy = true;
  });
  enqueueAfterUiScreenReady(() => {
    order.push('b');
  });
  markUiScreenShellReady('hub');
  assert.deepEqual(order, ['a']);
  busy = false;
  flushUiScreenReadyTasks();
  assert.deepEqual(order, ['a', 'b']);
  endUiScreenShell('hub');
  bindUiSequenceDialogBusy(() => false);
});
