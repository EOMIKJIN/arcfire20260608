import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_RKStorage_audit2.db';
const cap = 45_000;

function pullDb() {
  const rawDb = spawnSync(
    'adb',
    ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'],
    { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
  ).stdout;
  fs.writeFileSync(dbPath, rawDb);
}

function readKey(key) {
  const raw = execFileSync('sqlite3', [dbPath, `SELECT value FROM catalystLocalStorage WHERE key='${key}';`], {
    encoding: 'utf8',
  });
  return JSON.parse(raw.trim());
}

pullDb();
const fleet = readKey('arcfire_arc_core_transport_fleet_bank_v1');
const ledger = readKey('arcfire_planet_trade_fee_ledger_v1');
const coreRuntime = readKey('arcfire_planet_core_runtime_v1');

// Sample recent txns
const txns = (fleet.txns ?? []).slice(-15).map((t) => ({
  kind: t.kind,
  delta: t.deltaCredits,
  planet: t.planetId,
  note: (t.note ?? '').slice(0, 80),
}));

// Per-planet convoy gross — demand vs supply interpretation
const overCap = [];
const underCap = [];
for (const [pid, b] of Object.entries(ledger.byPlanetId ?? {})) {
  const g = b.convoyGrossCredits ?? 0;
  if (g <= 0) continue;
  const row = { planetId: pid, convoyGross: g, gross: b.grossCredits, convoyFee: b.convoyFeeCredits };
  if (g > cap) overCap.push(row);
  else underCap.push(row);
}
overCap.sort((a, b) => b.convoyGross - a.convoyGross);
underCap.sort((a, b) => b.convoyGross - a.convoyGross);

// Fabric window from first planet with economyFabric
let fabricSample = null;
for (const [pid, rec] of Object.entries(coreRuntime?.planets ?? coreRuntime ?? {})) {
  const ef = rec?.detail?.economyFabric;
  if (ef?.window) {
    fabricSample = { planetId: pid, window: ef.window, supplyStockScale: ef.supplyStockScale };
    break;
  }
}

// Find supply scale ~0.66
const supplyScales = [];
const bag = coreRuntime?.planets ?? coreRuntime ?? {};
for (const [pid, rec] of Object.entries(bag)) {
  const scale = rec?.detail?.economyFabric?.supplyStockScale;
  if (typeof scale === 'number' && scale > 0) {
    supplyScales.push({ planetId: pid, scalePct: Math.round(scale * 1000) / 10 });
  }
}
supplyScales.sort((a, b) => Math.abs(a.scalePct - 66) - Math.abs(b.scalePct - 66));

console.log(
  JSON.stringify(
    {
      ledgerDay: ledger.kstDayKey,
      overCapDemandGrossCount: overCap.length,
      topOverCap: overCap.slice(0, 5),
      topUnderCap: underCap.slice(0, 5),
      recentTxns: txns,
      fabricSample,
      nearest66SupplyScale: supplyScales.slice(0, 5),
      inFlightBuysMinusProfits: 58 - 54,
    },
    null,
    2,
  ),
);
