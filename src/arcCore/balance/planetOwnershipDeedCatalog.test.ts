/**
 * synth 행성소유권 — Table-First item_defs + colonization CSV 게이트
 * npx tsx src/arcCore/balance/planetOwnershipDeedCatalog.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from '../../data/galaxy100';
import { applySynthSystemAutogen } from '../../store/worldStore';
import { getSynthSystemColonizationRow } from './balanceTableRegistry';
import { inferTradeBuySubTabFromGoodId } from '../../game/tradeBuySubTab';
import { getItemDef } from '../../data/itemRegistry';
import { resolvePlanetOwnershipDeedItemId } from './planetOwnershipDeedCatalog';

const PLANET_ID = 'synth_002_p';
const OWNERSHIP_ID = resolvePlanetOwnershipDeedItemId(PLANET_ID);

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('colonization CSV synth_002 hasTradePort=true', () => {
  const row = getSynthSystemColonizationRow('synth_002');
  assert.equal(String(row?.hasTradePort).toLowerCase(), 'true');
});

test('static GALAXY synth_002 hasTradePort=false (B→A 전 autogen 잔재)', () => {
  const staticPlanet = GALAXY_SYSTEMS.synth_002?.planets.find((p) => p.id === PLANET_ID);
  assert.ok(staticPlanet);
  assert.equal(staticPlanet.hasTradePort, false);
});

test('autogen phase1 — runtime hasTradePort=true (소유권 eligibility 전제)', () => {
  const opened = applySynthSystemAutogen(GALAXY_SYSTEMS.synth_002!, 1);
  assert.equal(opened.planets[0].hasTradePort, true);
});

test('Table-First ownership_synth_002_p in ITEM_DEFS_FROM_CSV', () => {
  const def = getItemDef(OWNERSHIP_ID);
  assert.ok(def);
  assert.equal(def.type, 'planet_ownership');
  assert.equal(def.tradeable, true);
  assert.equal(String(def.attrs?.planetId), PLANET_ID);
});

test('ownership SKU maps to item buy sub-tab', () => {
  assert.equal(inferTradeBuySubTabFromGoodId(OWNERSHIP_ID), 'item');
});

console.log('All planetOwnershipDeedCatalog tests passed.');
