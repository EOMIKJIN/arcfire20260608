/**
 * npx tsx --test src/game/ingameDialog/ingameDialogFeatureLink.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cancelIngameDialogFeatureLinkDelay,
  hasIngameDialogFeatureLinkPending,
  INGAME_DIALOG_FEATURE_LINK_DELAY_MS,
  runAfterIngameDialogFeatureLinkDelay,
  setIngameDialogFeatureLinkDelayMsForTest,
} from './ingameDialogFeatureLink';

test('default feature-link delay is 1.5s', () => {
  assert.equal(INGAME_DIALOG_FEATURE_LINK_DELAY_MS, 1500);
});

test('feature-link delay 0 runs immediately and coalesces the same beat', () => {
  setIngameDialogFeatureLinkDelayMsForTest(0);
  cancelIngameDialogFeatureLinkDelay();
  try {
    const order: string[] = [];
    runAfterIngameDialogFeatureLinkDelay(() => {
      order.push('a');
    });
    runAfterIngameDialogFeatureLinkDelay(() => {
      order.push('b');
    });
    assert.deepEqual(order, ['a', 'b']);
    assert.equal(hasIngameDialogFeatureLinkPending(), false);
  } finally {
    setIngameDialogFeatureLinkDelayMsForTest(null);
    cancelIngameDialogFeatureLinkDelay();
  }
});

test('pending feature-link coalesces onto one timer', async () => {
  setIngameDialogFeatureLinkDelayMsForTest(40);
  cancelIngameDialogFeatureLinkDelay();
  try {
    const order: string[] = [];
    runAfterIngameDialogFeatureLinkDelay(() => {
      order.push('a');
    });
    runAfterIngameDialogFeatureLinkDelay(() => {
      order.push('b');
    });
    assert.deepEqual(order, []);
    assert.equal(hasIngameDialogFeatureLinkPending(), true);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 60);
    });
    assert.deepEqual(order, ['a', 'b']);
    assert.equal(hasIngameDialogFeatureLinkPending(), false);
  } finally {
    setIngameDialogFeatureLinkDelayMsForTest(null);
    cancelIngameDialogFeatureLinkDelay();
  }
});

test('cancel drops queued feature-link runs', async () => {
  setIngameDialogFeatureLinkDelayMsForTest(40);
  cancelIngameDialogFeatureLinkDelay();
  try {
    let ran = false;
    runAfterIngameDialogFeatureLinkDelay(() => {
      ran = true;
    });
    assert.equal(hasIngameDialogFeatureLinkPending(), true);
    cancelIngameDialogFeatureLinkDelay();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 60);
    });
    assert.equal(ran, false);
    assert.equal(hasIngameDialogFeatureLinkPending(), false);
  } finally {
    setIngameDialogFeatureLinkDelayMsForTest(null);
    cancelIngameDialogFeatureLinkDelay();
  }
});
