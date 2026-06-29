import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_RKStorage3.db';

function readKey(key) {
  const raw = execFileSync(
    'sqlite3',
    [dbPath, `SELECT value FROM catalystLocalStorage WHERE key='${key}';`],
    { encoding: 'utf8' },
  );
  return JSON.parse(raw.trim());
}

// Refresh DB from device
const rawDb = execFileSync(
  'adb',
  ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'],
  { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
);
fs.writeFileSync(dbPath, rawDb);

const fleet = readKey('arcfire_arc_core_transport_fleet_bank_v1');
let ledger = { kstDayKey: '', byPlanetId: {} };
try {
  ledger = readKey('arcfire_planet_trade_fee_ledger_v1');
} catch {
  /* optional */
}

const seed = 500_000;
const trappedPrincipal = fleet.totalOutflowCredits - (fleet.totalInflowCredits - seed);
const CAP = 45_000;

const txns = fleet.txns ?? [];
let buyTxns = 0;
let profitTxns = 0;
for (const t of txns) {
  if (t.kind === 'convoy_buy') buyTxns += 1;
  if (t.kind === 'convoy_profit') profitTxns += 1;
}

const buckets = ledger.byPlanetId ?? {};
let planetsAtCap = 0;
let planetsWithConvoy = 0;
let totalConvoyGrossToday = 0;
let maxGross = 0;
let maxPlanet = '';
for (const [pid, b] of Object.entries(buckets)) {
  const g = b.convoyGrossCredits ?? 0;
  if (g > 0) planetsWithConvoy += 1;
  totalConvoyGrossToday += g;
  if (g >= CAP) planetsAtCap += 1;
  if (g > maxGross) {
    maxGross = g;
    maxPlanet = pid;
  }
}

// Count supply/demand from CSV profiles
const profileCsv = fs.readFileSync(
  'd:/arcfire20260607/tables/balance/planet_trade_route_profile.csv',
  'utf8',
);
const profileLines = profileCsv.trim().split(/\r?\n/).slice(1);

const assignments = fs.readFileSync(
  'd:/arcfire20260607/tables/balance/trade_route_planet_supply_assignments.csv',
  'utf8',
);
const assignmentRows = assignments.trim().split(/\r?\n/).slice(1).length;

// Typical trip economics (illustrative from code defaults)
const exampleBuy = 800;
const exampleSell = 1040;
const exampleQty = 4;
const exampleBuyCost = exampleBuy * exampleQty;
const exampleSellGross = exampleSell * exampleQty;
const tripsToHitCap = Math.ceil(CAP / exampleSellGross);

console.log(
  JSON.stringify(
    {
      fleetSnapshot: {
        balanceCredits: fleet.balanceCredits,
        totalInflowCredits: fleet.totalInflowCredits,
        totalOutflowCredits: fleet.totalOutflowCredits,
        cumulativeNetMargin: fleet.totalInflowCredits - seed,
        accountingTrappedPrincipal: trappedPrincipal,
        txnHistory120: { buyTxns, profitTxns },
      },
      ledgerToday: {
        kstDayKey: ledger.kstDayKey,
        planetsWithConvoyToday: planetsWithConvoy,
        planetsAtOrAboveCap45k: planetsAtCap,
        maxConvoyGrossToday: { planetId: maxPlanet, gross: maxGross },
        totalConvoyGrossToday: totalConvoyGrossToday,
      },
      routeScale: {
        tradeRouteProfilePlanets: profileLines.length,
        supplyAssignmentRows: assignmentRows,
      },
      capModel: {
        convoyDemandDailyGrossCapCredits: CAP,
        exampleTripSellGross: exampleSellGross,
        exampleTripsPerDemandPlanetBeforeCap: tripsToHitCap,
        note: 'After cap, extra convoy cargo is scrapped or partially settled',
      },
      target10pctOfTrappedPrincipal: Math.floor(trappedPrincipal * 0.1),
    },
    null,
    2,
  ),
);
