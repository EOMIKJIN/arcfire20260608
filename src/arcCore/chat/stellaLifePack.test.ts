import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStellaLifePackFragment, shouldAttachStellaLifeToPack, STELLA_LIFE_PACK_MAX } from './stellaLifePack';
import { emptyStellaLifeSnapshot } from './stellaLifeSnapshot';
import { resolveStellaLifeAt, emptyStellaLifeEnv } from './stellaLifeResolve';

const NOON = Date.UTC(2026, 8, 21, 3, 0, 0, 0);

test('D7: origin and inbound get no life pack', () => {
  assert.equal(shouldAttachStellaLifeToPack({ speakerId: 'arc_core' }), false);
  assert.equal(shouldAttachStellaLifeToPack({ speakerId: 'operator', inboundWhy: 'spy' }), false);
  assert.equal(shouldAttachStellaLifeToPack({ speakerId: 'operator', originHold: true }), false);
  assert.equal(shouldAttachStellaLifeToPack({ speakerId: 'operator' }), true);
});

test('humanFirst drops life line; pack stays <=400', () => {
  const resolved = resolveStellaLifeAt(NOON, 'uid-a', emptyStellaLifeEnv(NOON), null);
  const snap = emptyStellaLifeSnapshot();
  snap.narrative = '하루를 접어 두고 있다.';
  snap.anchors = ['호출은 짧게'];
  const blocked = buildStellaLifePackFragment({
    resolved,
    snapshot: snap,
    humanFirst: true,
    locale: 'ko',
  });
  assert.equal(blocked.lifeLine, '');
  const open = buildStellaLifePackFragment({
    resolved,
    snapshot: snap,
    humanFirst: false,
    locale: 'ko',
  });
  assert.ok(open.block.length <= STELLA_LIFE_PACK_MAX);
  assert.ok(open.lifeLine.length > 0);
});

test('en pack uses activityEn digest not Korean done[0]', () => {
  const resolved = resolveStellaLifeAt(NOON, 'uid-a', emptyStellaLifeEnv(NOON), null);
  const snap = emptyStellaLifeSnapshot();
  snap.digests = [{
    d: '2026-09-20',
    mood: 50,
    driveId: 'rest',
    goalId: '',
    done: ['끼니를 때우고 있어', 'grabbing a bite'],
    withPlayer: 0,
  }];
  const en = buildStellaLifePackFragment({
    resolved,
    snapshot: snap,
    humanFirst: false,
    locale: 'en',
  });
  assert.match(en.block, /grabbing a bite/);
  assert.doesNotMatch(en.block, /끼니를 때우고 있어/);
  assert.match(en.block, /The day is folded away/);
});
