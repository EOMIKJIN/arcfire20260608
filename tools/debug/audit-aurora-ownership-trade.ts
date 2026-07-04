/**
 * 오로라(synth_002_p) 행성소유권 — 정적·카탈로그 persist 감사
 * npx tsx tools/debug/audit-aurora-ownership-trade.ts
 */
import { GALAXY_SYSTEMS } from '../../src/data/galaxy100';
import { applySynthSystemAutogen } from '../../src/store/worldStore';
import { getSynthSystemColonizationRow } from '../../src/arcCore/balance/balanceTableRegistry';
import { inferTradeBuySubTabFromGoodId } from '../../src/game/tradeBuySubTab';
import {
  isPlanetOwnershipDeedCatalogEligible,
  resolvePlanetOwnershipDeedItemId,
} from '../../src/arcCore/balance/planetOwnershipDeedCatalog';
import { getItemDef } from '../../src/data/itemRegistry';
import {
  getPlanetTradePortItemIds,
  replaceTradePortCatalog,
} from '../../src/world/planetTradePortDb';

const PLANET_ID = 'synth_002_p';
const OWNERSHIP_ID = resolvePlanetOwnershipDeedItemId(PLANET_ID);
const ARCADIA_ID = 'arcadia_prime';
const ARCADIA_OWNERSHIP = resolvePlanetOwnershipDeedItemId(ARCADIA_ID);

function gate(label: string, pass: boolean, detail: string): boolean {
  console.log(`${pass ? '[PASS]' : '[FAIL]'} ${label}: ${detail}`);
  return pass;
}

let allPass = true;

const row = getSynthSystemColonizationRow('synth_002');
allPass = gate(
  'G1 colonization CSV hasTradePort',
  String(row?.hasTradePort).toLowerCase() === 'true',
  `hasTradePort=${String(row?.hasTradePort)}`,
) && allPass;

const staticPlanet = GALAXY_SYSTEMS.synth_002?.planets.find((p) => p.id === PLANET_ID);
allPass = gate(
  'G2 static GALAXY template hasTradePort=false',
  staticPlanet?.hasTradePort === false,
  `hasTradePort=${String(staticPlanet?.hasTradePort)}`,
) && allPass;

const autogen = applySynthSystemAutogen(GALAXY_SYSTEMS.synth_002!, 1);
const runtimePlanet = autogen.planets.find((p) => p.id === PLANET_ID);
allPass = gate(
  'G3 autogen phase1 hasTradePort=true',
  runtimePlanet?.hasTradePort === true,
  `hasTradePort=${String(runtimePlanet?.hasTradePort)}`,
) && allPass;

allPass = gate(
  'G4 ownership SKU → item sub-tab',
  inferTradeBuySubTabFromGoodId(OWNERSHIP_ID) === 'item',
  'item',
) && allPass;

allPass = gate(
  'G5 synth eligibility without worldStore loaded (expect false)',
  isPlanetOwnershipDeedCatalogEligible(PLANET_ID) === false,
  String(isPlanetOwnershipDeedCatalogEligible(PLANET_ID)),
) && allPass;

allPass = gate(
  'G6 arcadia CSV ownership ItemDef exists',
  getItemDef(ARCADIA_OWNERSHIP)?.type === 'planet_ownership',
  String(getItemDef(ARCADIA_OWNERSHIP)?.type),
) && allPass;

replaceTradePortCatalog(ARCADIA_ID, [ARCADIA_OWNERSHIP, 'ore_mineral_1']);
allPass = gate(
  'G7 mutable DB persist — CSV ownership (21행성 baseline)',
  getPlanetTradePortItemIds(ARCADIA_ID).includes(ARCADIA_OWNERSHIP),
  getPlanetTradePortItemIds(ARCADIA_ID).join(', '),
) && allPass;

allPass = gate(
  'G8 synth ownership ItemDef in table bundle (Table-First)',
  getItemDef(OWNERSHIP_ID)?.type === 'planet_ownership' && getItemDef(OWNERSHIP_ID)?.tradeable === true,
  getItemDef(OWNERSHIP_ID)?.name ?? '(missing — run npm run build:content-tables)',
) && allPass;

if (!allPass) {
  console.error('\naudit-aurora-ownership-trade: FAIL');
  process.exit(1);
}

console.log('\naudit-aurora-ownership-trade: static gates PASS');
console.log('G9~G10 synth unlocked runtime — 앱: 오로라 개방 → 무역소 → **아이템** 탭 → 행성소유권');
