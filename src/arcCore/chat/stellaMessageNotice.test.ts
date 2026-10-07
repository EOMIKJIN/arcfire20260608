import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countStellaUnreadMessages,
  isStellaProactiveReason,
  shouldHoldStellaMessageNotice,
  shouldNotifyStellaMessage,
} from './stellaMessageNotice';
import { parseStellaObserveGate } from './stellaObserveGateMemory';

test('proactive reasons are reach, life and situations only', () => {
  assert.equal(isStellaProactiveReason('stella_reach'), true);
  assert.equal(isStellaProactiveReason('operator_life'), true);
  assert.equal(isStellaProactiveReason('sit_rough_day'), true);
  assert.equal(isStellaProactiveReason('manual'), false);
  assert.equal(isStellaProactiveReason(undefined), false);
});

test('unread counts Stella proactive lines after the last read', () => {
  const rows = [
    { role: 'arc', reason: 'stella_reach', atMs: 10 },
    { role: 'user', reason: 'manual', atMs: 30 },
    { role: 'arc', reason: 'manual', atMs: 31 },
    { role: 'arc', reason: 'operator_life', atMs: 40 },
    { role: 'arc', reason: 'sit_grind_loop', atMs: 50 },
  ];
  assert.equal(countStellaUnreadMessages(rows, 20), 2);
  assert.equal(countStellaUnreadMessages(rows, 0), 3);
  assert.equal(countStellaUnreadMessages(rows, 50), 0);
});

test('notice fires once per unread batch until the messenger is read', () => {
  assert.equal(shouldNotifyStellaMessage(0, { lastReadAtMs: 0, notifiedAtMs: 0 }), false);
  assert.equal(shouldNotifyStellaMessage(2, { lastReadAtMs: 100, notifiedAtMs: 0 }), true);
  assert.equal(shouldNotifyStellaMessage(3, { lastReadAtMs: 100, notifiedAtMs: 150 }), false);
  assert.equal(shouldNotifyStellaMessage(1, { lastReadAtMs: 200, notifiedAtMs: 150 }), true);
});

test('message notice waits while the accept gate still leads to the messenger', () => {
  assert.equal(shouldHoldStellaMessageNotice({
    operatorIntroPlayed: false,
    hubTutorialInProgress: false,
    awaitingTalkTwoGate: false,
  }), true);
  assert.equal(shouldHoldStellaMessageNotice({
    operatorIntroPlayed: true,
    hubTutorialInProgress: true,
    awaitingTalkTwoGate: false,
  }), true);
  assert.equal(shouldHoldStellaMessageNotice({
    operatorIntroPlayed: true,
    hubTutorialInProgress: false,
    awaitingTalkTwoGate: true,
  }), true);
  assert.equal(shouldHoldStellaMessageNotice({
    operatorIntroPlayed: true,
    hubTutorialInProgress: false,
    awaitingTalkTwoGate: false,
  }), false);
});

test('notifiedAtMs survives the gate round trip', () => {
  const gate = parseStellaObserveGate({ notifiedAtMs: 123, lastReadAtMs: 100 });
  assert.equal(gate.notifiedAtMs, 123);
  assert.equal(parseStellaObserveGate({}).notifiedAtMs, 0);
});
