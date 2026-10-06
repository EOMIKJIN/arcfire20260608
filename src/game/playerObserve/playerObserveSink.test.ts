import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PLAYER_OBSERVE_FIRST,
  PLAYER_OBSERVE_MAX_BYTES,
  PLAYER_OBSERVE_NOTABLE_MAX,
  exportPlayerObserveDigest,
  forEachRecentPlayerObserve,
  hydratePlayerObserveDigest,
  isPlayerObserveDigestEmpty,
  parsePlayerObserveDetail,
  playerObserveDayOf,
  readPlayerObserveDigest,
  recordPlayerObserve,
  registerPlayerObserveFlush,
  resetPlayerObserve,
} from './playerObserveSink';

const DAY0 = Date.UTC(2026, 9, 6, 3, 0, 0);
const DAY_MS = 86_400_000;

function fresh(): void {
  registerPlayerObserveFlush(null);
  resetPlayerObserve();
}

test('detail formats from existing emit sites parse into sub/planet/ref', () => {
  assert.deepEqual(parsePlayerObserveDetail('quest', 'complete:story_001', 'solar'), {
    sub: 'complete', planet: 'solar', ref: 'story_001',
  });
  assert.deepEqual(parsePlayerObserveDetail('combat', 'hub:lose', 'vega'), { sub: 'lose', planet: 'vega', ref: 'hub' });
  assert.deepEqual(parsePlayerObserveDetail('trade', 'sell:eden', 'solar'), { sub: 'sell', planet: 'eden', ref: '' });
  assert.deepEqual(parsePlayerObserveDetail('develop', 'start:shipyard:eden', 'solar'), {
    sub: 'start', planet: 'eden', ref: 'shipyard',
  });
  assert.deepEqual(parsePlayerObserveDetail('mine', 'eden:ore_iron', ''), { sub: '', planet: 'eden', ref: 'ore_iron' });
  assert.deepEqual(parsePlayerObserveDetail('ship', 'hull_x', 'eden'), { sub: '', planet: 'eden', ref: 'hull_x' });
});

test('combat loss streak, same-planet run, and win reset', () => {
  fresh();
  recordPlayerObserve('land', 'vega', DAY0);
  recordPlayerObserve('combat', 'hub:lose', DAY0 + 1);
  recordPlayerObserve('combat', 'hub:lose', DAY0 + 2);
  recordPlayerObserve('combat', 'hub:lose', DAY0 + 3);
  let d = readPlayerObserveDigest(DAY0 + 4);
  assert.equal(d.loss, 3);
  assert.equal(d.runP, 'vega');
  assert.equal(d.run, 3);
  assert.equal(d.c.combat, 3);
  recordPlayerObserve('combat', 'hub:win', DAY0 + 5);
  d = readPlayerObserveDigest(DAY0 + 6);
  assert.equal(d.loss, 0);
  assert.equal(d.run, 4);
});

test('notable events flush, routine ones do not; notable list is capped', () => {
  fresh();
  let flushes = 0;
  registerPlayerObserveFlush(() => {
    flushes += 1;
  });
  recordPlayerObserve('trade', 'buy:eden', DAY0);
  recordPlayerObserve('scan', 'eden', DAY0);
  assert.equal(flushes, 0);
  recordPlayerObserve('ship', 'hull_a', DAY0);
  recordPlayerObserve('annex', 'eden', DAY0);
  recordPlayerObserve('quest', 'complete:story_001', DAY0);
  recordPlayerObserve('destroy', 'flagship', DAY0);
  recordPlayerObserve('level', '12', DAY0);
  assert.equal(flushes, 5);
  const d = readPlayerObserveDigest(DAY0);
  assert.equal(d.notable.length, PLAYER_OBSERVE_NOTABLE_MAX);
  assert.equal(d.notable[0]!.v, 'level');
  assert.ok(d.firsts & PLAYER_OBSERVE_FIRST.ship);
  assert.ok(d.firsts & PLAYER_OBSERVE_FIRST.destroy);
  assert.equal(d.dstr, 1);
  registerPlayerObserveFlush(null);
});

test('day roll keeps at most two previous days', () => {
  fresh();
  for (let k = 0; k < 4; k += 1) recordPlayerObserve('trade', 'buy:eden', DAY0 + k * DAY_MS);
  const d = readPlayerObserveDigest(DAY0 + 3 * DAY_MS);
  assert.equal(d.day, playerObserveDayOf(DAY0 + 3 * DAY_MS));
  assert.equal(d.c.trade, 1);
  assert.equal(d.prev.length, 2);
  assert.equal(d.prev[0]!.d, playerObserveDayOf(DAY0 + 2 * DAY_MS));
});

test('loss streak is today only — next day and a later disk merge do not keep it', () => {
  fresh();
  recordPlayerObserve('land', 'vega', DAY0);
  recordPlayerObserve('combat', 'hub:lose', DAY0 + 1);
  recordPlayerObserve('combat', 'hub:lose', DAY0 + 2);
  const next = readPlayerObserveDigest(DAY0 + DAY_MS);
  assert.equal(next.loss, 0);
  assert.equal(next.dstr, 0);
  fresh();
  recordPlayerObserve('land', 'vega', DAY0 + DAY_MS);
  hydratePlayerObserveDigest({
    day: playerObserveDayOf(DAY0),
    c: { combat: 4 },
    loss: 4,
    dstr: 2,
    run: 4,
    runP: 'vega',
    firsts: 0,
    notable: [],
    prev: [],
    lastAt: DAY0,
    lastLand: 'vega',
  });
  const merged = readPlayerObserveDigest(DAY0 + DAY_MS);
  assert.equal(merged.loss, 0);
  assert.equal(merged.dstr, 0);
  assert.equal(merged.lastLand, 'vega');
});

test('ring returns newest first and wraps at 64', () => {
  fresh();
  for (let k = 0; k < 70; k += 1) recordPlayerObserve('trade', `buy:p${k}`, DAY0 + k);
  const seen: string[] = [];
  forEachRecentPlayerObserve(3, (e) => seen.push(e.planet));
  assert.deepEqual(seen, ['p69', 'p68', 'p67']);
  let n = 0;
  forEachRecentPlayerObserve(999, () => {
    n += 1;
  });
  assert.equal(n, 64);
});

test('export stays within its own byte cap', () => {
  fresh();
  const long = 'x'.repeat(48);
  for (let k = 0; k < 3; k += 1) {
    for (const v of ['quest', 'combat', 'trade', 'annex', 'skill', 'ship', 'mine', 'scan', 'talk', 'develop'] as const) {
      recordPlayerObserve(v, `complete:${long}`, DAY0 + k * DAY_MS);
    }
    recordPlayerObserve('destroy', long, DAY0 + k * DAY_MS);
    recordPlayerObserve('level', long, DAY0 + k * DAY_MS);
  }
  const out = exportPlayerObserveDigest();
  assert.ok(Buffer.byteLength(JSON.stringify(out), 'utf8') <= PLAYER_OBSERVE_MAX_BYTES);
  assert.ok(Object.keys(out.c).length > 0);
});

test('hydrate merges disk with events recorded before the chat store loaded', () => {
  fresh();
  recordPlayerObserve('land', 'eden', DAY0);
  recordPlayerObserve('combat', 'hub:lose', DAY0);
  hydratePlayerObserveDigest({
    day: playerObserveDayOf(DAY0),
    c: { trade: 5, combat: 2 },
    loss: 2,
    dstr: 1,
    firsts: PLAYER_OBSERVE_FIRST.ship,
    notable: [{ v: 'ship', s: '', p: 'solar', r: 'hull_a', d: playerObserveDayOf(DAY0) }],
    prev: [],
    lastAt: DAY0 - 1000,
    lastLand: 'solar',
  });
  const d = readPlayerObserveDigest(DAY0);
  assert.equal(d.c.trade, 5);
  assert.equal(d.c.combat, 3);
  assert.equal(d.c.land, 1);
  assert.equal(d.dstr, 1);
  assert.equal(d.lastLand, 'eden');
  assert.equal(d.loss, 3);
  assert.ok(d.firsts & PLAYER_OBSERVE_FIRST.ship);
  assert.equal(d.notable[0]!.r, 'hull_a');
});

test('hydrate of garbage gives empty; reset empties', () => {
  fresh();
  hydratePlayerObserveDigest('nope');
  assert.ok(isPlayerObserveDigestEmpty(exportPlayerObserveDigest()));
  recordPlayerObserve('trade', 'buy:eden', DAY0);
  resetPlayerObserve();
  assert.ok(isPlayerObserveDigestEmpty(exportPlayerObserveDigest()));
  recordPlayerObserve('nonsense' as never, 'x', DAY0);
  assert.ok(isPlayerObserveDigestEmpty(exportPlayerObserveDigest()));
});
