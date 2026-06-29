import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_RKStorage_audit3.db';
const cap = 45_000;

spawnSync('adb', ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'], {
  encoding: 'buffer',
  maxBuffer: 50 * 1024 * 1024,
  stdio: ['pipe', fs.openSync(dbPath, 'w'), 'inherit'],
});

function q(sql) {
  return execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim();
}

const fleetRaw = q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_arc_core_transport_fleet_bank_v1';");
const ledgerRaw = q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_planet_trade_fee_ledger_v1';");
const fleet = JSON.parse(fleetRaw);
const ledger = JSON.parse(ledgerRaw);

// Pair recent buy→profit by shipId
const byShip = new Map();
for (const t of [...fleet.txns].reverse()) {
  if (t.kind !== 'convoy_buy' && t.kind !== 'convoy_profit') continue;
  const sid = t.shipId ?? '?';
  if (!byShip.has(sid)) byShip.set(sid, []);
  byShip.get(sid).push(t);
}

const pairs = [];
for (const [shipId, list] of byShip) {
  const buy = list.find((x) => x.kind === 'convoy_buy');
  const profit = list.find((x) => x.kind === 'convoy_profit');
  if (buy && profit) {
    pairs.push({
      shipId: shipId.slice(-8),
      buy: -buy.deltaCredits,
      profit: profit.deltaCredits,
      netOnBalance: buy.deltaCredits + profit.deltaCredits,
      dest: profit.planetId,
    });
  }
}

// Demand-only: planets appearing as profit unload dest with convoy gross
const demandUnloadPlanets = new Set(pairs.map((p) => p.dest));
const demandOverCap = [];
for (const pid of demandUnloadPlanets) {
  const g = ledger.byPlanetId?.[pid]?.convoyGrossCredits ?? 0;
  if (g > cap) demandOverCap.push({ planetId: pid, convoyGross: g });
}

console.log(
  JSON.stringify(
    {
      balance: fleet.balanceCredits,
      seedPlusNet: 500_000 + (fleet.totalInflowCredits - 500_000) - fleet.totalOutflowCredits,
      pairsSample: pairs.slice(-8),
      avgNetOnBalance: pairs.length
        ? Math.round(pairs.reduce((s, p) => s + p.netOnBalance, 0) / pairs.length)
        : null,
      positiveNetTrips: pairs.filter((p) => p.netOnBalance > 0).length,
      negativeNetTrips: pairs.filter((p) => p.netOnBalance < 0).length,
      demandDestOverCap: demandOverCap,
      pendingCargoShips: [...byShip.entries()].filter(([, list]) => {
        const hasBuy = list.some((x) => x.kind === 'convoy_buy');
        const hasProfit = list.some((x) => x.kind === 'convoy_profit');
        return hasBuy && !hasProfit;
      }).length,
    },
    null,
    2,
  ),
);
