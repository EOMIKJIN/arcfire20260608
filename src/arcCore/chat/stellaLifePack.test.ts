import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildStellaLifePackFragment,
  shouldAttachStellaLifeToPack,
  STELLA_LIFE_PACK_MAX,
  STELLA_LIFE_TOOL_NAME,
  stellaLifeToolData,
} from './stellaLifePack';
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

test('life parts reach the server as get_stella_now tool data', () => {
  const resolved = resolveStellaLifeAt(NOON, 'uid-a', emptyStellaLifeEnv(NOON), null);
  const snap = emptyStellaLifeSnapshot();
  snap.anchors = ['호출은 짧게'];
  const open = buildStellaLifePackFragment({ resolved, snapshot: snap, humanFirst: false, locale: 'ko' });
  const data = stellaLifeToolData(open.parts);
  assert.ok(data);
  assert.equal(data!.now, open.lifeLine);
  assert.equal(data!.memory, '호출은 짧게');
  const keys = Object.keys(data!);
  assert.ok(keys.length <= 6);
  for (const k of keys) assert.ok(data![k]!.length <= 80);
  const blocked = buildStellaLifePackFragment({ resolved, snapshot: snap, humanFirst: true, locale: 'ko' });
  assert.equal(stellaLifeToolData(blocked.parts), null);
  assert.equal(STELLA_LIFE_TOOL_NAME, 'get_stella_now');
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
