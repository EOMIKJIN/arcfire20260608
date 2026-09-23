/**
 * 코어 정보창 초상 — CSV 키와 GALAXY_SYSTEMS 런타임 연결.
 * npx tsx src/data/csvPlanetInfoPortraitKeys.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from './galaxy100';
import { STAR_SYSTEMS } from './systems';
import { resolveCsvPlanetInfoPortraitAssetKey } from './csvPlanetInfoPortraitKeys';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

const VEGA_KEY = 'assets/images/planet/pip_core_vega_base.jpg';

test('CSV STAR_SYSTEMS keeps vega_base portrait key', () => {
  assert.equal(resolveCsvPlanetInfoPortraitAssetKey('vega_base'), VEGA_KEY);
  const csvPlanet = STAR_SYSTEMS.vega_outpost?.planets.find((p) => p.id === 'vega_base');
  assert.equal(csvPlanet?.infoPanelPortraitAssetKey, VEGA_KEY);
});

test('GALAXY_SYSTEMS runtime overlay restores vega_base portrait key', () => {
  const runtime = GALAXY_SYSTEMS.vega_outpost?.planets.find((p) => p.id === 'vega_base');
  assert.ok(runtime, 'vega_base missing in GALAXY_SYSTEMS');
  assert.equal(runtime.infoPanelPortraitAssetKey, VEGA_KEY);
});

test('every CSV portrait key reaches matching GALAXY_SYSTEMS core planet', () => {
  let wired = 0;
  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      const csvKey = resolveCsvPlanetInfoPortraitAssetKey(planet.id);
      if (!csvKey) continue;
      const runtime = GALAXY_SYSTEMS[system.id]?.planets.find((p) => p.id === planet.id);
      assert.equal(runtime?.infoPanelPortraitAssetKey, csvKey, planet.id);
      wired += 1;
    }
  }
  assert.equal(wired, 21);
});

console.log('csvPlanetInfoPortraitKeys.test.ts ok');
