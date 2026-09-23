/**
 * 은하 지도 존 계약 — 렌더 미연결. 분류만 검증.
 * npx tsx --test src/galaxyMap/galaxyMapZoneContract.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS, GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import {
  GALAXY_MAP_CARDINAL_ZONE_IDS,
  GALAXY_MAP_CENTER_ZONE_ID,
  GALAXY_MAP_EMPTY_CORNER_ZONE_IDS,
  GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE,
  getGalaxyMapPrimaryGatewaySystemId,
  isGalaxyMapCenterResidentSystemId,
  isGalaxyMapEmptyCornerZone,
  isGalaxyMapExpansionGatewaySystemId,
  listGalaxyMapSystemIdsInZone,
  resolveGalaxyMapCardinalZoneForPrimaryGateway,
  resolveGalaxyMapZoneIdForSystemId,
} from './galaxyMapZoneContract';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('total graph 757', () => {
  assert.equal(Object.keys(GALAXY_SYSTEMS).length, 757);
});

test('zone 5 is current map — 21 core + 76 legacy', () => {
  const ids = listGalaxyMapSystemIdsInZone(GALAXY_MAP_CENTER_ZONE_ID);
  assert.equal(ids.length, 97);
  let core = 0;
  let legacy = 0;
  for (const id of ids) {
    if (GAMEPLAY_SYSTEM_IDS.has(id)) core += 1;
    else if (isGalaxyMapCenterResidentSystemId(id)) legacy += 1;
    else assert.fail(`non-resident in zone 5: ${id}`);
  }
  assert.equal(core, 21);
  assert.equal(legacy, 76);
});

test('every core21 and legacy resident is zone 5', () => {
  for (const id of Object.keys(GALAXY_SYSTEMS)) {
    if (!isGalaxyMapCenterResidentSystemId(id)) continue;
    assert.equal(resolveGalaxyMapZoneIdForSystemId(id), 5, id);
  }
});

test('corner zones 1/3/7/9 are empty', () => {
  for (const z of GALAXY_MAP_EMPTY_CORNER_ZONE_IDS) {
    assert.equal(isGalaxyMapEmptyCornerZone(z), true);
    assert.equal(listGalaxyMapSystemIdsInZone(z).length, 0);
  }
});

test('cardinal zones 2/4/6/8 each 165 — 4 gateways + 161 undiscovered', () => {
  for (const z of GALAXY_MAP_CARDINAL_ZONE_IDS) {
    const ids = listGalaxyMapSystemIdsInZone(z);
    assert.equal(ids.length, 165, `zone ${z}`);
    let gw = 0;
    let und = 0;
    for (const id of ids) {
      if (isGalaxyMapExpansionGatewaySystemId(id)) gw += 1;
      else {
        assert.equal(isGalaxyMapCenterResidentSystemId(id), false, id);
        und += 1;
      }
    }
    assert.equal(gw, 4, `zone ${z} gateways`);
    assert.equal(und, 161, `zone ${z} undiscovered`);
  }
});

test('primary gateways exist and sit in their cardinal zone', () => {
  const expected: Array<[2 | 4 | 6 | 8, string]> = [
    [2, 'synth_092'],
    [4, 'synth_083'],
    [6, 'synth_085'],
    [8, 'synth_090'],
  ];
  for (const [zone, id] of expected) {
    assert.equal(GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE[zone], id);
    assert.equal(getGalaxyMapPrimaryGatewaySystemId(zone), id);
    assert.ok(GALAXY_SYSTEMS[id], id);
    assert.equal(resolveGalaxyMapZoneIdForSystemId(id), zone, id);
    assert.equal(resolveGalaxyMapCardinalZoneForPrimaryGateway(id), zone);
    assert.equal(isGalaxyMapExpansionGatewaySystemId(id), true);
  }
});

console.log('All galaxyMapZoneContract tests passed.');
