import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyStellaObserveGateState } from './stellaObserveGate';
import { parseStellaObserveGate } from './stellaObserveGateMemory';
import { STELLA_UNREAD_STOP, stellaReachSessionLines, walkStellaReachAway } from './stellaReachCatchUp';
import { resolveStellaHumanAsk } from './stellaLifeAsk';
import { emptyStellaLifeEnv, resolveStellaLifeAt } from './stellaLifeResolve';
import { emptyStellaLifeSnapshot } from './stellaLifeSnapshot';
import { stellaLifeDayKey } from './stellaLifeClock';

const NOON_KST = Date.UTC(2026, 9, 6, 3, 0, 0);

test('away reach stays a handful and stops when unread piles up', () => {
  const state = emptyStellaObserveGateState();
  const lines = walkStellaReachAway({
    state,
    fromMs: NOON_KST - 3 * 24 * 60 * 60 * 1000,
    toMs: NOON_KST,
    uid: 'uid-reach',
    level: 4,
  });
  assert.ok(lines.length > 0);
  assert.equal(lines.length, state.unread, 'every counted unread is a delivered line');
  assert.ok(lines.length <= STELLA_UNREAD_STOP);
  assert.ok(lines[0]!.textKo.length > 0);
  const blocked = emptyStellaObserveGateState();
  blocked.unread = 12;
  const none = walkStellaReachAway({
    state: blocked,
    fromMs: NOON_KST - 6 * 60 * 60 * 1000,
    toMs: NOON_KST,
    uid: 'uid-reach',
    level: 4,
  });
  assert.equal(none.length, 0);
});

test('session lines are the unread reach notes, newest kept, oldest dropped from the window', () => {
  const messages = [
    { reason: 'stella_reach', atMs: 10, text: 'a' },
    { reason: 'manual', atMs: 20, text: 'no' },
    { reason: 'stella_reach', atMs: 30, text: 'b' },
    { reason: 'stella_reach', atMs: 40, text: 'c' },
    { reason: 'stella_reach', atMs: 50, text: 'd' },
    { reason: 'stella_reach', atMs: 60, text: 'e' },
  ];
  assert.deepEqual(
    stellaReachSessionLines(messages, 10).map((row) => row.text),
    ['b', 'c', 'd', 'e'],
  );
  assert.deepEqual(stellaReachSessionLines(messages, 60), []);
});

test('gate parse keeps the hub clock and drops junk keys', () => {
  const gate = parseStellaObserveGate({
    lastHubAtMs: 50,
    unread: 2,
    shownAt: { reach: 40, '': 1 },
    recentShows: { reach: [1, 2, 3, 99] },
  });
  assert.equal(gate.lastHubAtMs, 50);
  assert.equal(gate.unread, 2);
  assert.equal(gate.shownAt.reach, 40);
  assert.deepEqual(gate.recentShows.reach, [1, 2, 3]);
});

test('life ask can return the same day when the daily quota is off', () => {
  const snap = emptyStellaLifeSnapshot();
  snap.lastAskDay = stellaLifeDayKey(NOON_KST);
  const resolved = resolveStellaLifeAt(NOON_KST, 'uid-a', emptyStellaLifeEnv(NOON_KST), snap);
  resolved.driveId = 'rest';
  resolved.dutyOrOff = 'off';
  resolved.mood = 70;
  const blocked = resolveStellaHumanAsk({
    resolved,
    snapshot: snap,
    locale: 'ko',
    tutorialForce: false,
    operatorIntroPlayed: true,
    nowMs: NOON_KST,
  });
  assert.equal(blocked, null);
  const open = resolveStellaHumanAsk({
    resolved,
    snapshot: snap,
    locale: 'ko',
    tutorialForce: false,
    operatorIntroPlayed: true,
    nowMs: NOON_KST,
    ignoreDailyQuota: true,
  });
  assert.ok(open && open.textKo.length > 0);
});
