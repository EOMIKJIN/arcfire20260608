import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveArcCoreChatColumnBottomPadPx,
  resolveArcCoreChatKeyboardInsetPx,
} from './arcCoreChatKeyboardLayout';

test('resolveArcCoreChatKeyboardInsetPx sits flush above the IME', () => {
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 800, 0), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 800, 300), 300);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 500, 300), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 520, 300), 0);
  assert.equal(resolveArcCoreChatKeyboardInsetPx(800, 780, 300), 280);
});

test('resolveArcCoreChatColumnBottomPadPx uses safe inset only when IME is down', () => {
  assert.equal(resolveArcCoreChatColumnBottomPadPx(300, 54), 300);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(0, 54), 54);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(0, 0), 0);
  assert.equal(resolveArcCoreChatColumnBottomPadPx(700, 54, 800), 580);
});
