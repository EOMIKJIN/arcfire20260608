/**
 * compact 범용 팝업 40초 자동 닫힘 계약
 * npx tsx --test src/ui/overlay/overlayAlertContract.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
  ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS,
  isCompactAutoDismissOverlayKind,
  resolveArcOverlayAutoDismissMs,
  resolveCompactOverlayAutoDismissAction,
} from './overlayAlertContract';

test('default auto-dismiss is 40s and aliases stay in sync', () => {
  assert.equal(ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS, 40_000);
  assert.equal(ARC_ALERT_DEFAULT_AUTO_DISMISS_MS, 40_000);
  assert.equal(resolveArcOverlayAutoDismissMs(), 40_000);
  assert.equal(resolveArcOverlayAutoDismissMs(0), undefined);
  assert.equal(resolveArcOverlayAutoDismissMs(12_000), 12_000);
});

test('compact kinds include combat result and generic popups', () => {
  assert.equal(isCompactAutoDismissOverlayKind('alert'), true);
  assert.equal(isCompactAutoDismissOverlayKind('waveResult'), true);
  assert.equal(isCompactAutoDismissOverlayKind('reward'), true);
  assert.equal(isCompactAutoDismissOverlayKind('levelUp'), true);
  assert.equal(isCompactAutoDismissOverlayKind('settings'), false);
  assert.equal(isCompactAutoDismissOverlayKind('tradeQuantity'), false);
});

test('single-button alert auto-close fires confirm (combat defeat return)', () => {
  let fired = false;
  const action = resolveCompactOverlayAutoDismissAction({
    kind: 'alert',
    autoDismissMs: 40_000,
    buttons: [{ onPress: () => { fired = true; } }],
  });
  assert.equal(action?.type, 'dismiss_then_press');
  if (action?.type === 'dismiss_then_press') action.onPress();
  assert.equal(fired, true);
});

test('two-button alert auto-close does not pick confirm', () => {
  const action = resolveCompactOverlayAutoDismissAction({
    kind: 'alert',
    autoDismissMs: 40_000,
    buttons: [{ onPress: () => {} }, { onPress: () => {} }],
  });
  assert.equal(action?.type, 'dismiss');
});

test('waveResult auto-close runs onClose after dismiss contract', () => {
  let closed = false;
  const action = resolveCompactOverlayAutoDismissAction({
    kind: 'waveResult',
    autoDismissMs: 40_000,
    onClose: () => { closed = true; },
  });
  assert.equal(action?.type, 'dismiss_then_close');
  if (action?.type === 'dismiss_then_close') action.onClose();
  assert.equal(closed, true);
});

test('alert messageSection uses compact divider + sectionLabel', () => {
  const src = readFileSync(resolve(__dirname, 'content/AlertOverlayContent.tsx'), 'utf8');
  assert.match(src, /entry\.messageSection/);
  assert.match(src, /body\.divider/);
  assert.match(src, /body\.sectionLabel/);
});

test('manual-only overlay stays closed without action', () => {
  assert.equal(
    resolveCompactOverlayAutoDismissAction({
      kind: 'waveResult',
      autoDismissMs: 0,
      onClose: () => {},
    }),
    null,
  );
});
