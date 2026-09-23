import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  OVERLAY_SHORT_TRANSITION,
  OVERLAY_SHORT_TRANSITION_CLOSE_MS,
  OVERLAY_SHORT_TRANSITION_OPEN_MS,
  reduceOverlayShortHold,
  reduceOverlayShortHoldExited,
} from './overlayShortTransition';

test('short transition stays under 200ms each way', () => {
  assert.equal(OVERLAY_SHORT_TRANSITION_OPEN_MS, 180);
  assert.equal(OVERLAY_SHORT_TRANSITION_CLOSE_MS, 150);
  assert.ok(OVERLAY_SHORT_TRANSITION_OPEN_MS < 200);
  assert.ok(OVERLAY_SHORT_TRANSITION_CLOSE_MS < 200);
  assert.ok(OVERLAY_SHORT_TRANSITION.startTranslateY > 0);
  assert.ok(OVERLAY_SHORT_TRANSITION.startScale < 1);
});

test('hold keeps the last live item until exit, then drops it', () => {
  const a = { id: 'n1' };
  const b = { id: 'n2' };
  assert.equal(reduceOverlayShortHold(null, a, false), a);
  assert.equal(reduceOverlayShortHold(a, b, false), b);
  assert.equal(reduceOverlayShortHold(b, null, false), b);
  assert.equal(reduceOverlayShortHold(b, null, true), null);
  assert.equal(reduceOverlayShortHoldExited(null), null);
  assert.equal(reduceOverlayShortHoldExited(a), a);
});
