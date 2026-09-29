/**
 * npx tsx --test src/game/combat/combatPlayerShipSink.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  consumeCombatPlayerShipSinkPending,
  markCombatPlayerShipSinkPending,
  peekCombatPlayerShipSinkPending,
} from './combatPlayerShipSinkFlag';

test('sink pending is one-shot consume', () => {
  consumeCombatPlayerShipSinkPending();
  assert.equal(peekCombatPlayerShipSinkPending(), false);
  markCombatPlayerShipSinkPending();
  assert.equal(peekCombatPlayerShipSinkPending(), true);
  assert.equal(consumeCombatPlayerShipSinkPending(), true);
  assert.equal(peekCombatPlayerShipSinkPending(), false);
  assert.equal(consumeCombatPlayerShipSinkPending(), false);
});
