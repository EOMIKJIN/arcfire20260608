/**
 * 은하 지도 존 분할 로딩 — 가시 리스트 불변 · 히스테리시스.
 * npx tsx --test src/galaxyMap/galaxyMapZoneLoadSession.test.ts
 */
import assert from 'node:assert/strict';
import { GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import {
  GALAXY_MAP_CENTER_ZONE_ID,
  isGalaxyMapExpansionGatewaySystemId,
  listGalaxyMapSystemIdsInZone,
} from './galaxyMapZoneContract';
import {
  GALAXY_MAP_ZONE_LOAD_INITIAL,
  isHiddenSystemInGalaxyMapStarlightPayload,
  resolveGalaxyMapZoneLoadState,
  sameGalaxyMapZoneIdList,
} from './galaxyMapZoneLoadSession';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

const CORE_ID = [...GAMEPLAY_SYSTEM_IDS][0] ?? 'sirius';

test('initial load is zone 5 only', () => {
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: null,
    prevLoaded: GALAXY_MAP_ZONE_LOAD_INITIAL,
  });
  assert.deepEqual(next.loaded, [GALAXY_MAP_CENTER_ZONE_ID]);
});

test('primary north gateway loads zone 2, keeps 5', () => {
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: 'synth_092',
    prevLoaded: [5],
  });
  assert.deepEqual(next.loaded, [2, 5]);
});

test('hysteresis keeps north after returning to zone 5', () => {
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: CORE_ID,
    prevLoaded: [2, 5],
  });
  assert.deepEqual(next.loaded, [2, 5]);
});

test('south trigger unloads opposite north', () => {
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: 'synth_090',
    prevLoaded: [2, 5],
  });
  assert.deepEqual(next.loaded, [5, 8]);
});

test('standing on north and selecting south keeps both', () => {
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: 'synth_092',
    selectedSystemId: 'synth_090',
    prevLoaded: [2, 5],
  });
  assert.deepEqual(next.loaded, [2, 5, 8]);
});

test('east/west opposite unload', () => {
  const afterEast = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: 'synth_085',
    prevLoaded: [5],
  });
  assert.deepEqual(afterEast.loaded, [5, 6]);
  const afterWest = resolveGalaxyMapZoneLoadState({
    currentSystemId: CORE_ID,
    selectedSystemId: 'synth_083',
    prevLoaded: afterEast.loaded,
  });
  assert.deepEqual(afterWest.loaded, [4, 5]);
});

test('auxiliary gateway in same zone also triggers', () => {
  const zone2Ids = listGalaxyMapSystemIdsInZone(2);
  let aux: string | null = null;
  for (const id of zone2Ids) {
    if (id === 'synth_092') continue;
    if (isGalaxyMapExpansionGatewaySystemId(id)) {
      aux = id;
      break;
    }
  }
  assert.ok(aux);
  const next = resolveGalaxyMapZoneLoadState({
    currentSystemId: aux,
    selectedSystemId: null,
    prevLoaded: [5],
  });
  assert.deepEqual(next.loaded, [2, 5]);
});

test('starlight keeps in-content dots when zone unloaded', () => {
  assert.equal(
    isHiddenSystemInGalaxyMapStarlightPayload({
      systemId: 'synth_200',
      loadedZoneIds: [5],
      screenX: 10,
      screenY: 10,
      contentW: 100,
      contentH: 100,
    }),
    true,
  );
});

test('starlight drops off-content dots until that zone loads', () => {
  const zone2Hidden = listGalaxyMapSystemIdsInZone(2).find(
    (id) => !isGalaxyMapExpansionGatewaySystemId(id),
  );
  assert.ok(zone2Hidden);
  assert.equal(
    isHiddenSystemInGalaxyMapStarlightPayload({
      systemId: zone2Hidden,
      loadedZoneIds: [5],
      screenX: -400,
      screenY: -400,
      contentW: 100,
      contentH: 100,
    }),
    false,
  );
  assert.equal(
    isHiddenSystemInGalaxyMapStarlightPayload({
      systemId: zone2Hidden,
      loadedZoneIds: [2, 5],
      screenX: -400,
      screenY: -400,
      contentW: 100,
      contentH: 100,
    }),
    true,
  );
});

test('sameGalaxyMapZoneIdList', () => {
  assert.equal(sameGalaxyMapZoneIdList([2, 5], [2, 5]), true);
  assert.equal(sameGalaxyMapZoneIdList([2, 5], [5]), false);
});

console.log('All galaxyMapZoneLoadSession tests passed.');
