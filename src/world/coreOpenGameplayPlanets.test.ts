/**
 * 코어 개방(A+B) · synth autogen 시설 통합 테스트
 * npx tsx src/world/coreOpenGameplayPlanets.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { applySynthSystemAutogen } from '../store/worldStore';
import {
  BASELINE_CORE_OPEN_SYSTEM_IDS,
  isBaselineCoreOpenSystemId,
} from './coreOpenGameplayPlanets';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('baseline core open = 21 canonical systems', () => {
  assert.equal(BASELINE_CORE_OPEN_SYSTEM_IDS.size, 21);
  assert.equal(isBaselineCoreOpenSystemId('arcadia'), true);
  assert.equal(isBaselineCoreOpenSystemId('synth_002'), false);
});

test('synth phase0 — C tier locked, no world facilities', () => {
  const base = GALAXY_SYSTEMS.synth_002;
  assert.ok(base);
  const locked = applySynthSystemAutogen(base, 0);
  const planet = locked.planets[0];
  assert.equal(planet.hasTradePort, false);
  assert.equal(planet.hasShipyard, false);
  assert.equal(planet.hasTavern, false);
});

test('synth phase1 — B→A merge, CSV colonization facilities enabled', () => {
  const base = GALAXY_SYSTEMS.synth_002;
  assert.ok(base);
  const opened = applySynthSystemAutogen(base, 1);
  const planet = opened.planets[0];
  assert.equal(planet.hasTradePort, true);
  assert.equal(planet.hasShipyard, true);
  assert.equal(planet.hasTavern, true);
  assert.equal(planet.id, 'synth_002_p');
});

test('synth_005 phase1 — partial CSV facilities (no shipyard)', () => {
  const base = GALAXY_SYSTEMS.synth_005;
  assert.ok(base);
  const opened = applySynthSystemAutogen(base, 1);
  const planet = opened.planets[0];
  assert.equal(planet.hasTradePort, true);
  assert.equal(planet.hasShipyard, false);
  assert.equal(planet.hasTavern, true);
});

console.log('All coreOpenGameplayPlanets tests passed.');
