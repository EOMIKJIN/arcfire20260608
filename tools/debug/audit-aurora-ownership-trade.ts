/**
 * 오로라(synth_002_p) 행성소유권 — 정적 게이트 (worldStore·RN 불필요)
 * npx tsx tools/debug/audit-aurora-ownership-trade.ts
 */
import { GALAXY_SYSTEMS } from '../../src/data/galaxy100';
import { applySynthSystemAutogen } from '../../src/store/worldStore';
import { getSynthSystemColonizationRow } from '../../src/arcCore/balance/balanceTableRegistry';
import { inferTradeBuySubTabFromGoodId } from '../../src/game/tradeBuySubTab';

const PLANET_ID = 'synth_002_p';
const OWNERSHIP_ID = `ownership_${PLANET_ID}`;

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

if (!allPass) {
  console.error('\naudit-aurora-ownership-trade: FAIL');
  process.exit(1);
}

console.log('\naudit-aurora-ownership-trade: static gates PASS');
console.log('G5~G8 (eligibility·policy catalog·mutable DB) — 앱 내 worldStore unlock + 무역소 진입 후 forceResync로 검증');
console.log('→ 실기기: 오로라 개방 → 무역소 → 구매 → **아이템** 탭 → 행성소유권');
