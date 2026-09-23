import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyStellaLifeSnapshot } from './stellaLifeSnapshot';
import {
  ingestStellaLifeCognition,
  observeStellaLifeCognition,
  stellaLifeAllowsLifeLine,
} from './stellaLifeCognition';

test('humanFirst dump is negative learning; origin turn observes 0', () => {
  const base = emptyStellaLifeSnapshot();
  const ignored = observeStellaLifeCognition(base, {
    operatorTurn: false,
    humanFirst: true,
    usedLifeLine: true,
    h5Pref: true,
    topicFollow: true,
    correction: true,
  });
  assert.deepEqual(ignored.cognitionSession, base.cognitionSession);
  const dumped = observeStellaLifeCognition(base, {
    operatorTurn: true,
    humanFirst: true,
    usedLifeLine: true,
    h5Pref: false,
    topicFollow: false,
    correction: false,
  });
  assert.equal(dumped.cognitionSession.dump, 1);
  const ingested = ingestStellaLifeCognition(dumped, Date.UTC(2026, 8, 21, 3, 0, 0, 0));
  assert.ok(ingested.cognition.casualFirst <= 50);
  assert.equal(stellaLifeAllowsLifeLine(base, true), false);
});

test('cognition session counters cap at 8', () => {
  let life = emptyStellaLifeSnapshot();
  for (let i = 0; i < 20; i += 1) {
    life = observeStellaLifeCognition(life, {
      operatorTurn: true,
      humanFirst: false,
      usedLifeLine: false,
      h5Pref: true,
      topicFollow: true,
      correction: true,
    });
  }
  assert.equal(life.cognitionSession.h5, 8);
  assert.equal(life.cognitionSession.topic, 8);
  assert.equal(life.cognitionSession.corr, 8);
});
