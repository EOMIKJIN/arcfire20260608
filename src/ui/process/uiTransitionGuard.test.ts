import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  bumpUiTransitionSettle,
  configureUiTransitionGuardForTest,
  isUiTransitionBusy,
  noteUiLayerChange,
  resetUiTransitionGuard,
  tryArmUiTransition,
} from './uiTransitionGuard';

afterEach(() => {
  configureUiTransitionGuardForTest();
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

test('second press is dropped until settle ends', async () => {
  configureUiTransitionGuardForTest({ pressMs: 20, openMs: 20, closeMs: 20, deadlineMs: 200 });
  assert.equal(tryArmUiTransition(), true);
  assert.equal(isUiTransitionBusy(), true);
  assert.equal(tryArmUiTransition(), false);
  bumpUiTransitionSettle('press');
  await wait(35);
  assert.equal(isUiTransitionBusy(), false);
  assert.equal(tryArmUiTransition(), true);
  resetUiTransitionGuard();
});

test('layer close extends settle and still rejects a second press', async () => {
  configureUiTransitionGuardForTest({ pressMs: 10, openMs: 10, closeMs: 40, deadlineMs: 200 });
  assert.equal(tryArmUiTransition(), true);
  bumpUiTransitionSettle('press');
  noteUiLayerChange('close');
  await wait(20);
  assert.equal(isUiTransitionBusy(), true);
  assert.equal(tryArmUiTransition(), false);
  await wait(35);
  assert.equal(isUiTransitionBusy(), false);
  resetUiTransitionGuard();
});

test('hard deadline releases a stuck busy flag', async () => {
  configureUiTransitionGuardForTest({ pressMs: 500, openMs: 500, closeMs: 500, deadlineMs: 25 });
  assert.equal(tryArmUiTransition(), true);
  await wait(45);
  assert.equal(isUiTransitionBusy(), false);
  resetUiTransitionGuard();
});
