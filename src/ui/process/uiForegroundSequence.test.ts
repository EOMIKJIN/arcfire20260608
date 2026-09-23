import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beginUiScreenShell,
  clearUiForegroundSequence,
  endUiScreenShell,
  enqueueAfterUiScreenReady,
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
