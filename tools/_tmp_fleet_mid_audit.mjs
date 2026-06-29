import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_RKStorage_audit.db';

function pullDb() {
  const rawDb = spawnSync(
    'adb',
    ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'],
    { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
  ).stdout;
  if (!rawDb?.length) throw new Error('adb RKStorage pull failed');
  fs.writeFileSync(dbPath, rawDb);
}

function readKey(key) {
  const raw = execFileSync('sqlite3', [dbPath, `SELECT value FROM catalystLocalStorage WHERE key='${key}';`], {
    encoding: 'utf8',
  });
  return JSON.parse(raw.trim());
}

pullDb();

const seed = 500_000;
const cap = 45_000;
const reseedFlag = readKey('arcfire_convoy_fleet_economy_reseed_20260629_v1').catch?.() ?? null;

let fleet, ledger, reseedFlagRaw;
try {
  reseedFlagRaw = execFileSync('sqlite3', [dbPath, "SELECT value FROM catalystLocalStorage WHERE key='arcfire_convoy_fleet_economy_reseed_20260629_v1';"], { encoding: 'utf8' }).trim();
} catch {
  reseedFlagRaw = '';
}

fleet = readKey('arcfire_arc_core_transport_fleet_bank_v1');
try {
  ledger = readKey('arcfire_planet_trade_fee_ledger_v1');
} catch {
  ledger = { kstDayKey: '', byPlanetId: {} };
}

const txns = fleet.txns ?? [];
let buyCount = 0;
let profitCount = 0;
let buySum = 0;
let profitSum = 0;
let seedTxns = 0;
let capReject = 0;
let otherKinds = {};

for (const t of txns) {
  const k = t.kind ?? 'unknown';
  otherKinds[k] = (otherKinds[k] ?? 0) + 1;
  const d = t.deltaCredits ?? 0;
  if (k === 'convoy_buy') {
    buyCount += 1;
    buySum += -d;
  } else if (k === 'convoy_profit') {
    profitCount += 1;
    profitSum += d;
  } else if (k === 'seed') seedTxns += 1;
  else if (k === 'convoy_cap_reject') capReject += 1;
}

const buckets = ledger.byPlanetId ?? {};
let planetsWithConvoy = 0;
let planetsOverCap = 0;
let maxConvoyGross = 0;
let maxPlanet = '';
let totalConvoyGross = 0;
for (const [pid, b] of Object.entries(buckets)) {
  const g = b.convoyGrossCredits ?? 0;
  if (g > 0) planetsWithConvoy += 1;
  totalConvoyGross += g;
  if (g > cap) planetsOverCap += 1;
  if (g > maxConvoyGross) {
    maxConvoyGross = g;
    maxPlanet = pid;
  }
}

const netMarginCumulative = fleet.totalInflowCredits - seed;
const rawDriftSinceSeed = fleet.balanceCredits - seed;
const inventoryRatioPct =
  fleet.totalOutflowCredits > 0
    ? Math.round((1 - netMarginCumulative / fleet.totalOutflowCredits) * 1000) / 10
    : 0;

console.log(
  JSON.stringify(
    {
      reseedFlagApplied: reseedFlagRaw === '1',
      fleet: {
        balanceCredits: fleet.balanceCredits,
        totalInflowCredits: fleet.totalInflowCredits,
        totalOutflowCredits: fleet.totalOutflowCredits,
        balanceK: Math.round(fleet.balanceCredits / 1000),
        cumulativeNetMargin: netMarginCumulative,
        rawDriftSinceSeed,
        computedInventoryRatioPct: inventoryRatioPct,
      },
      txnHistory120: {
        total: txns.length,
        seedTxns,
        buyCount,
        profitCount,
        buyProfitPairRatio: profitCount > 0 ? (buyCount / profitCount).toFixed(2) : null,
        buySumFromTxns: buySum,
        profitSumFromTxns: profitSum,
        capReject,
        kinds: otherKinds,
      },
      ledgerToday: {
        kstDayKey: ledger.kstDayKey,
        planetsWithConvoy,
        planetsOverCap,
        maxConvoyGross: { planetId: maxPlanet, gross: maxConvoyGross },
        totalConvoyGrossToday: totalConvoyGross,
      },
      healthChecks: {
        reseedApplied: reseedFlagRaw === '1',
        balanceNear734k: Math.abs(fleet.balanceCredits - 734_000) < 50_000,
        inventoryRatioNear66: Math.abs(inventoryRatioPct - 66) < 15,
        buyProfitBalanced: buyCount > 0 && profitCount > 0 && Math.abs(buyCount - profitCount) <= 3,
        noCapOverrun: planetsOverCap === 0,
        formulaCheck: seed + profitSum - buySum,
      },
    },
    null,
    2,
  ),
);
