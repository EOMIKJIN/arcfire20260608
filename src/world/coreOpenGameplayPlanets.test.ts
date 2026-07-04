/**
 * 코어 개방(A+B) 행성 풀 — gameplay 연동 게이트
 * npx tsx src/world/coreOpenGameplayPlanets.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { applySynthSystemAutogen } from '../store/worldStore';
import {
  BASELINE_CORE_OPEN_SYSTEM_IDS,
  countCoreOpenGameplayPlanets,
  isBaselineCoreOpenSystemId,
  isCanonicalCoreOpenPlanetId,
  listCoreOpenGameplayPlanetIds,
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
  assert.equal(opened.name, '오로라 관측국');
  assert.equal(opened.nameEn, 'Aurora Observatory');
  assert.ok(opened.description.includes('오로라 허브'));
  const planet = opened.planets[0];
  assert.equal(planet.name, '오로라 허브');
  assert.equal(planet.hasTradePort, true);
  assert.equal(planet.hasShipyard, true);
  assert.equal(planet.hasTavern, true);
  assert.equal(planet.id, 'synth_002_p');
});

test('synth phase0 — locked placeholder names preserved (no CSV leak)', () => {
  const base = GALAXY_SYSTEMS.synth_002;
  assert.ok(base);
  const locked = applySynthSystemAutogen(base, 0);
  assert.equal(locked.name, '미개척-2');
  assert.equal(locked.description, base.description);
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

test('headless — canonical 21 always in core-open planet list', () => {
  const ids = listCoreOpenGameplayPlanetIds();
  assert.ok(ids.includes('arcadia_prime'));
  assert.equal(isCanonicalCoreOpenPlanetId('arcadia_prime'), true);
  assert.equal(countCoreOpenGameplayPlanets(), ids.length);
  assert.ok(ids.length >= 21);
});

console.log('All coreOpenGameplayPlanets tests passed.');
