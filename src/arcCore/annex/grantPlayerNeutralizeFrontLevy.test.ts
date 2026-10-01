/**
 * 전선 징수 — 빈 id는 persist 없이 0.
 * npx tsx --test src/arcCore/annex/grantPlayerNeutralizeFrontLevy.test.ts
 */
import assert from 'node:assert/strict';
import {
  grantPlayerNeutralizeFrontLevy,
  PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS,
} from './grantPlayerNeutralizeFrontLevy';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('징수 액수는 2000', () => {
  assert.equal(PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS, 2000);
});

test('빈 행성 id는 0', () => {
  assert.equal(grantPlayerNeutralizeFrontLevy(''), 0);
  assert.equal(grantPlayerNeutralizeFrontLevy('   '), 0);
});

console.log('grantPlayerNeutralizeFrontLevy.test.ts — all PASS');
