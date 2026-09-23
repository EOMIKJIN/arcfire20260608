import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeInboundTalkWaitMs,
  isInboundTalkSafeSlot,
  rollBoundedDelayMs,
} from './arcCoreInboundTalkRequestPolicy';

test('inbound talk wait is never negative', () => {
  assert.equal(computeInboundTalkWaitMs(1000, 400), 600);
  assert.equal(computeInboundTalkWaitMs(1000, 1000), 0);
  assert.equal(computeInboundTalkWaitMs(1000, 1400), 0);
});

test('inbound talk delay stays inside inclusive bounds', () => {
  assert.equal(rollBoundedDelayMs(45_000, 90_000, () => 0), 45_000);
  assert.equal(rollBoundedDelayMs(45_000, 90_000, () => 0.999999), 90_000);
});

test('inbound talk slot requires hub idle and no overlay/dialog/wave', () => {
  assert.equal(isInboundTalkSafeSlot({
    hubArmed: true,
    appActive: true,
    overlayBusy: false,
    dialogBusy: false,
    waveActive: false,
  }), true);
  assert.equal(isInboundTalkSafeSlot({
    hubArmed: true,
    appActive: true,
    overlayBusy: true,
    dialogBusy: false,
    waveActive: false,
  }), false);
  assert.equal(isInboundTalkSafeSlot({
    hubArmed: false,
    appActive: true,
    overlayBusy: false,
    dialogBusy: false,
    waveActive: false,
  }), false);
});
