/**
 * 전투 결과 범용 present — venue별 행 가림·자동닫힘
 * npx tsx --test src/game/combat/presentCombatResultOverlay.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS,
  resolveCombatResultAutoDismissMs,
  resolveCombatResultOverlayViewModel,
} from './combatResultOverlayView';

test('hub orbit autodismiss is 10s; wave/transit keep compact default', () => {
  assert.equal(HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS, 10_000);
  assert.equal(resolveCombatResultAutoDismissMs('hub_orbit'), 10_000);
  assert.equal(resolveCombatResultAutoDismissMs('wave'), undefined);
  assert.equal(resolveCombatResultAutoDismissMs('transit'), undefined);
  assert.equal(resolveCombatResultAutoDismissMs('hub_orbit', 0), 0);
  assert.equal(resolveCombatResultAutoDismissMs('wave', 12_000), 12_000);
});

test('wave venue keeps wave row and placeholder when no rewards', () => {
  const view = resolveCombatResultOverlayViewModel({
    venue: 'wave',
    wavesCleared: 3,
    totalWaves: 9,
    expEarned: 0,
  });
  assert.equal(view.subtitleKey, 'waveResult.subtitle');
  assert.equal(view.showWaves, true);
  assert.equal(view.showExp, false);
  assert.equal(view.showOtherItemsPlaceholder, true);
  assert.equal(view.showNoReward, false);
});

test('hub orbit hides wave row and empty reward placeholder', () => {
  const view = resolveCombatResultOverlayViewModel({
    venue: 'hub_orbit',
    expEarned: 120,
    enemyName: '적 함장',
  });
  assert.equal(view.subtitleKey, 'waveResult.subtitleHubOrbit');
  assert.equal(view.showWaves, false);
  assert.equal(view.showEnemy, true);
  assert.equal(view.showExp, true);
  assert.equal(view.showCredits, false);
  assert.equal(view.showOtherItemsPlaceholder, false);
  assert.equal(view.showNoReward, false);
});

test('hub orbit with no rewards shows noReward, not fake items', () => {
  const view = resolveCombatResultOverlayViewModel({
    venue: 'hub_orbit',
    expEarned: 0,
  });
  assert.equal(view.showNoReward, true);
  assert.equal(view.showOtherItemsPlaceholder, false);
  assert.equal(view.showExp, false);
});

test('transit shows credits and destroyed, hides wave count', () => {
  const view = resolveCombatResultOverlayViewModel({
    venue: 'transit',
    expEarned: 40,
    creditsEarned: 80,
    enemyName: '해적',
    destroyedLabels: ['기관포'],
  });
  assert.equal(view.subtitleKey, 'waveResult.subtitleTransit');
  assert.equal(view.showWaves, false);
  assert.equal(view.showCredits, true);
  assert.equal(view.showDestroyed, true);
  assert.equal(view.showNoReward, false);
});

test('combat level-up dismisses leftover narrative before present', () => {
  const src = readFileSync(resolve(__dirname, './presentCombatResultOverlay.ts'), 'utf8');
  assert.match(src, /dismissWhere\(\(e\) => e\.kind === 'narrative'\)/);
});
