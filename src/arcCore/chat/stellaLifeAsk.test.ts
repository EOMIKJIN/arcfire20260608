import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindStellaAskWhy, resolveStellaAskMotive, shouldSuppressStellaLifeAsk } from './stellaLifeAsk';
import { resolveStellaLifeAt, emptyStellaLifeEnv } from './stellaLifeResolve';
import type { StellaLifeResolved } from './stellaLifeTypes';

function withDrive(base: StellaLifeResolved, driveId: StellaLifeResolved['driveId'], dutyOrOff: 'duty' | 'off', mood: number): StellaLifeResolved {
  return { ...base, driveId, dutyOrOff, mood };
}

const NOON = Date.UTC(2026, 8, 21, 3, 0, 0, 0);

test('duty focus has no ask motive even with promise fuel', () => {
  const env = emptyStellaLifeEnv(NOON);
  const resolved = withDrive(resolveStellaLifeAt(NOON, 'uid-a', env, null), 'duty', 'duty', 60);
  assert.equal(resolveStellaAskMotive(resolved), null);
  const why = bindStellaAskWhy('need_you', {
    hasPromise: true,
    hasCorrection: false,
    hasThread: false,
    hasCarePref: false,
    shareAnchor: '커피',
  }, 'ko');
  assert.ok(why);
  assert.equal(why?.askId, 'promise');
});

test('off-duty share uses today piece not idle', () => {
  const env = emptyStellaLifeEnv(NOON);
  const resolved = withDrive(resolveStellaLifeAt(NOON, 'uid-a', env, null), 'rest', 'off', 70);
  assert.equal(resolveStellaAskMotive(resolved), 'want_share');
  const why = bindStellaAskWhy('want_share', {
    hasPromise: true,
    hasCorrection: false,
    hasThread: false,
    hasCarePref: false,
    shareAnchor: '끼니',
  }, 'ko');
  assert.equal(why?.askId, 'share');
  assert.match(why?.textKo ?? '', /끼니/);
});

test('tutorial and first session suppress ask', () => {
  assert.equal(shouldSuppressStellaLifeAsk({
    tutorialForce: true,
    operatorIntroPlayed: true,
    askedToday: false,
    lastAskDay: '',
    todayKey: '2026-09-21',
  }), true);
  assert.equal(shouldSuppressStellaLifeAsk({
    tutorialForce: false,
    operatorIntroPlayed: false,
    askedToday: false,
    lastAskDay: '',
    todayKey: '2026-09-21',
  }), true);
  assert.equal(shouldSuppressStellaLifeAsk({
    tutorialForce: false,
    operatorIntroPlayed: true,
    askedToday: false,
    lastAskDay: '2026-09-20',
    todayKey: '2026-09-21',
  }), false);
});

