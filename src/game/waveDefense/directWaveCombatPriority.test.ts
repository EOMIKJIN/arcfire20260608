/**
 * npx tsx --test src/game/waveDefense/directWaveCombatPriority.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isDirectWaveWinLocked,
  shouldApplyShipSinkForDirectCombat,
} from './directWaveCombatPriority';

test('locked direct win ignores a later sink', () => {
  assert.equal(isDirectWaveWinLocked('win', null), true);
  assert.equal(isDirectWaveWinLocked(null, 'win'), true);
  assert.equal(isDirectWaveWinLocked('lose', null), false);
  assert.equal(isDirectWaveWinLocked(null, null), false);
  assert.equal(shouldApplyShipSinkForDirectCombat('win', true), false);
  assert.equal(shouldApplyShipSinkForDirectCombat('lose', true), true);
  assert.equal(shouldApplyShipSinkForDirectCombat('lose', false), false);
});