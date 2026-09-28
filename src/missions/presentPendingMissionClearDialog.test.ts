/**
 * 미션 클리어 대사는 전투 결과창이 떠 있는 동안 present 하지 않는다.
 * npx tsx --test src/missions/presentPendingMissionClearDialog.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(resolve(__dirname, './presentPendingMissionClearDialog.ts'), 'utf8');

test('mission clear waits while combat result overlay is open', () => {
  assert.match(src, /kind === 'waveResult'/);
  assert.match(src, /isCombatResultOverlayOpen/);
  assert.match(src, /if \(isCombatResultOverlayOpen\(\)\) return false/);
});

test('idle subscriber also skips while combat result is open', () => {
  assert.match(src, /subscribeIngameDialogBecameIdle/);
  assert.match(src, /if \(isCombatResultOverlayOpen\(\)\) return;/);
});

test('idle subscriber does not steal pending during combat-end hold', () => {
  assert.match(src, /isCombatEndOutcomeHold/);
  assert.match(src, /if \(isCombatEndOutcomeHold\(\)\) return;/);
});
