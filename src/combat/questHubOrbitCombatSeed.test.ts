/**
 * hub_orbit 퀘스트 시드 계약 — RN/함선 PNG 없이 소스만 검사
 * npx tsx --test src/combat/questHubOrbitCombatSeed.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(resolve(__dirname, './questHubOrbitCombatSeed.ts'), 'utf8');

test('퀘스트 허브 시드는 앵커 함장 1척 + 기함 · 점유 함대 아님', () => {
  assert.match(src, /isQuestHubOrbitLockAtPlanet/);
  assert.match(src, /resolveCombatEnemyCaptain/);
  assert.match(src, /isLeader:\s*true/);
  assert.match(src, /sourcePlanetId:\s*anchorPlanetId/);
  assert.match(src, /quest_hub_orbit_player_flagship/);
  assert.doesNotMatch(src, /applyArcCoreTerritorialHold/);
  assert.doesNotMatch(src, /getWaveFleetSeedOverride/);
});
