import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveArcCoreChatColumnBottomPadPx,
  resolveArcCoreChatComposerLiftPx,
  resolveArcCoreChatKeyboardInsetPx,
} from './arcCoreChatKeyboardLayout';

test('resolveArcCoreChatKeyboardInsetPx sits flush above the IME', () => {
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 800, 0), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 800, 300), 300);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 500, 300), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 520, 300), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 780, 300), 280);
});

test('resolveArcCoreChatKeyboardInsetPx ignores chrome that is already there with the keyboard down', () => {
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 760, 300, 40), 300);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 460, 300, 40), 0);
});

test('resolveArcCoreChatComposerLiftPx clears the typing row above the IME', () => {
  assert.equal(resolveArcCoreChatComposerLiftPx(0, 54), 0);
  assert.equal(resolveArcCoreChatComposerLiftPx(300, 54), 282);
  assert.equal(resolveArcCoreChatComposerLiftPx(40, 54), 0);
});

test('resolveArcCoreChatColumnBottomPadPx uses safe inset only when IME is down', () => {
  assert.equal(resolveArcCoreChatColumnBottomPadPx(300, 54), 300);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(0, 54), 54);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(0, 0), 0);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(700, 54, 800), 580);
});
