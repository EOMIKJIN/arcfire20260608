/**
 * 은하 지도 미확인 라벨 — 도착 전 본명 금지.
 * npx tsx --test src/galaxyMap/galaxyMapUnidentifiedLabel.test.ts
 */
import assert from 'node:assert/strict';
import {
  formatUnidentifiedSystemLabel,
  isGalaxyMapSystemNameRevealed,
  listGalaxyMapNameRevealIdsAfterHops,
  padGalaxyMapCatalogOrdinal,
  resolveGalaxyMapSystemCatalogOrdinal,
  resolveGalaxyMapSystemDisplayLabel,
  shouldShowGalaxyMapSystemLabel,
} from './galaxyMapUnidentifiedLabel';
import { isPlanetInfoRevealed, isPlayerLandedOnPlanet } from '../world/planetInfoReveal';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('pad 3-digit catalog ordinal', () => {
  assert.equal(padGalaxyMapCatalogOrdinal(1), '001');
  assert.equal(padGalaxyMapCatalogOrdinal(21), '021');
  assert.equal(padGalaxyMapCatalogOrdinal(100), '100');
});

test('synth and core zone ordinals', () => {
  assert.equal(resolveGalaxyMapSystemCatalogOrdinal({ id: 'synth_001' }), 1);
  assert.equal(resolveGalaxyMapSystemCatalogOrdinal({ id: 'arcadia' }), 1);
  assert.equal(resolveGalaxyMapSystemCatalogOrdinal({ id: 'eternity' }), 20);
});

test('unidentified label uses underscore + pad', () => {
  assert.equal(formatUnidentifiedSystemLabel(1, 'ko'), '미확인_001');
  assert.equal(formatUnidentifiedSystemLabel(21, 'en'), 'Unknown_021');
});

test('name reveal ids only after ship hops arrive', () => {
  const path = ['arcadia', 'vega_outpost', 'solar_port'];
  assert.deepEqual(listGalaxyMapNameRevealIdsAfterHops(path, 0), []);
  assert.deepEqual(listGalaxyMapNameRevealIdsAfterHops(path, 1), ['vega_outpost']);
  assert.deepEqual(listGalaxyMapNameRevealIdsAfterHops(path, 2), ['vega_outpost', 'solar_port']);
});

test('name reveal only after visit or current', () => {
  assert.equal(isGalaxyMapSystemNameRevealed(false, false), false);
  assert.equal(isGalaxyMapSystemNameRevealed(true, false), true);
  assert.equal(isGalaxyMapSystemNameRevealed(false, true), true);
});

test('map label stays fogged until visit even if selectable', () => {
  const sys = { id: 'vega_outpost', name: '베가 전초기지', nameEn: 'Vega Outpost' };
  assert.equal(resolveGalaxyMapSystemDisplayLabel(sys, 'ko', false), '미확인_002');
  assert.equal(resolveGalaxyMapSystemDisplayLabel(sys, 'ko', true), '베가 전초기지');
});

test('unlocked always labeled; locked only when selected', () => {
  assert.equal(shouldShowGalaxyMapSystemLabel(true, false), true);
  assert.equal(shouldShowGalaxyMapSystemLabel(false, false), false);
  assert.equal(shouldShowGalaxyMapSystemLabel(false, true), true);
});

test('planet info stays sealed until land and inspect', () => {
  assert.equal(isPlayerLandedOnPlanet('vega_base', null), false);
  assert.equal(isPlayerLandedOnPlanet('vega_base', 'arcadia_prime'), false);
  assert.equal(isPlayerLandedOnPlanet('vega_base', 'vega_base'), true);
  assert.equal(
    isPlanetInfoRevealed({
      planetId: 'vega_base',
      inspectedPlanetInfoIds: [],
    }),
    false,
  );
  assert.equal(
    isPlanetInfoRevealed({
      planetId: 'vega_base',
      inspectedPlanetInfoIds: ['vega_base'],
    }),
    true,
  );
});
