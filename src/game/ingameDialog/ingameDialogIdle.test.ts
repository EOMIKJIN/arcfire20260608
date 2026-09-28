/**
 * idleNow 는 drain 즉시. feature-link 지연 큐와 분리.
 * npx tsx --test src/game/ingameDialog/ingameDialogIdle.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cancelIngameDialogFeatureLinkDelay,
  setIngameDialogFeatureLinkDelayMsForTest,
} from './ingameDialogFeatureLink';
import {
  drainIngameDialogIdleCallbacks,
  runAfterIngameDialogIdle,
  runAfterIngameDialogIdleNow,
} from './ingameDialogIdle';

test('idleNow runs on drain without waiting for feature-link', () => {
  setIngameDialogFeatureLinkDelayMsForTest(60_000);
  let called = false;
  runAfterIngameDialogIdleNow(() => {
    called = true;
  });
  assert.equal(called, false);
  drainIngameDialogIdleCallbacks();
  assert.equal(called, true);
  cancelIngameDialogFeatureLinkDelay();
  setIngameDialogFeatureLinkDelayMsForTest(null);
});

test('runAfterIngameDialogIdle still goes through feature-link delay', () => {
  setIngameDialogFeatureLinkDelayMsForTest(60_000);
  let called = false;
  runAfterIngameDialogIdle(() => {
    called = true;
  });
  drainIngameDialogIdleCallbacks();
  assert.equal(called, false);
  cancelIngameDialogFeatureLinkDelay();
  setIngameDialogFeatureLinkDelayMsForTest(null);
});
