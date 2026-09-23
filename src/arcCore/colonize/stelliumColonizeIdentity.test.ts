/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeIdentity.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated/csvNpcCapitalShips';
import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated/csvNpcCaptains';
import {
  resolveStelliumColonizeIdentity,
  STELLIUM_COLONIZE_AI_OPERATOR_ID,
  stelliumColonizeRequiresWarshipRegistry,
} from './stelliumColonizeIdentity';
import { resolveStelliumColonizePolicy, resetStelliumColonizePolicyCacheForTest } from './stelliumColonizePolicy';

test('정책 — 전 자동화 AI · 전함 테이블·함장 불필요', () => {
  resetStelliumColonizePolicyCacheForTest();
  const policy = resolveStelliumColonizePolicy();
  assert.equal(policy.aiAutomated, true);
  assert.equal(policy.requireShipTable, false);
  assert.equal(policy.requireCaptain, false);
  assert.equal(stelliumColonizeRequiresWarshipRegistry(policy), false);

  const identity = resolveStelliumColonizeIdentity(policy);
  assert.equal(identity.aiAutomated, true);
  assert.equal(identity.registerAsWarship, false);
  assert.equal(policy.hopDays1, 1);
  assert.equal(policy.hopDays2, 2);
  assert.equal(policy.hopDays3Plus, 3);
  assert.equal(policy.hullOutfittingCredits, 4000);
  assert.equal(policy.opexCreditsPerShipDay, 200);
  assert.equal(policy.attemptCreditsPerHopDay, 400);
  assert.equal(policy.successBondCredits, 8000);
  assert.equal(policy.requirePrepaidEnqueue, true);
  assert.equal(policy.chargeVaultKey, 'blue_team');
});

test('시스템 — 개척선 id는 전함·함장 테이블에 없음', () => {
  const reserved = new Set([STELLIUM_COLONIZE_AI_OPERATOR_ID, 'stellium_colonize']);
  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    assert.equal(reserved.has(captain.id), false);
  }
  for (const ship of NPC_CAPITAL_SHIPS_FROM_CSV) {
    assert.equal(reserved.has(ship.id), false);
    assert.equal(ship.id.startsWith('stellium_colonize:'), false);
  }
});
