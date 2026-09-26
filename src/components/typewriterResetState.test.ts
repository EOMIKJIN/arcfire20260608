import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTypewriterResetState, typewriterEpoch } from './typewriterResetState';

test('next page starts on the first character — no empty blink frame', () => {
  const next = resolveTypewriterResetState({
    text: '다음 대사',
    active: true,
    skipAnimation: false,
  });
  assert.equal(next.displayed, '다');
  assert.equal(next.index, 1);
  assert.equal(next.done, false);
});

test('inactive open delay stays empty', () => {
  const idle = resolveTypewriterResetState({
    text: '대기',
    active: false,
    skipAnimation: false,
  });
  assert.equal(idle.displayed, '');
  assert.equal(idle.index, 0);
  assert.equal(idle.done, false);
});

test('skip shows the full line immediately', () => {
  const skip = resolveTypewriterResetState({
    text: '전체',
    active: true,
    skipAnimation: true,
  });
  assert.equal(skip.displayed, '전체');
  assert.equal(skip.index, 2);
  assert.equal(skip.done, true);
});

test('epoch changes when the page token changes', () => {
  assert.notEqual(
    typewriterEpoch({ resetToken: 'p1', text: 'a', active: true, skipAnimation: false }),
    typewriterEpoch({ resetToken: 'p2', text: 'a', active: true, skipAnimation: false }),
  );
});
