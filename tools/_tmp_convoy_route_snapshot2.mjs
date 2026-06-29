import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_convoy_route_snapshot2.db';
const rawDb = spawnSync(
  'adb',
  ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'],
  { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
).stdout;
fs.writeFileSync(dbPath, rawDb);

const fleet = JSON.parse(
  execFileSync('sqlite3', [dbPath, "SELECT value FROM catalystLocalStorage WHERE key='arcfire_arc_core_transport_fleet_bank_v1';"], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  }).trim(),
);

const PLanet_KO = {
  blood_station: '블러드 ST',
  core_prime: '코어 프라임',
  synth_001_p: '합성α-1',
  eden_city: '뉴에덴',
  synth_006_p: '합성α-6',
  genesis_origin: '제네시스',
  helios_core: '헬리오스',
  minerva_deep: '미네르바',
  draco_haven: '드라코',
  iron_remnant: '아이언 잔재',
  crimson_base: '크림슨',
  dark_haven: '다크 헤이븐',
  synth_003_p: '합성α-3',
  arcadia_prime: '아르카디아',
  synth_002_p: '합성α-2',
  solar_station: '솔라항구',
};

function ko(id) {
  return PLanet_KO[id] ?? id.replace(/_p$/, '').slice(0, 10);
}

function parseRoute(note) {
  const m = note?.match(/([a-z0-9_]+)→([a-z0-9_]+)/i);
  return m ? { src: m[1], dest: m[2] } : null;
}

const routeAgg = new Map();
let buyCount = 0;
let profitCount = 0;
let totalBuy = 0;
let totalProfit = 0;

for (const t of fleet.txns ?? []) {
  if (t.kind === 'convoy_buy') {
    buyCount += 1;
    totalBuy += -t.deltaCredits;
    const r = parseRoute(t.note);
    if (!r) continue;
    const k = `${r.src}→${r.dest}`;
    if (!routeAgg.has(k)) routeAgg.set(k, { src: r.src, dest: r.dest, buys: 0, buyCr: 0, profits: 0, profitCr: 0, qty: 0 });
    const row = routeAgg.get(k);
    row.buys += 1;
    row.buyCr += -t.deltaCredits;
    const q = t.note?.match(/qty=(\d+)/);
    if (q) row.qty += Number(q[1]);
  }
  if (t.kind === 'convoy_profit') {
    profitCount += 1;
    totalProfit += t.deltaCredits;
    const r = parseRoute(t.note);
    if (!r) continue;
    const k = `${r.src}→${r.dest}`;
    if (!routeAgg.has(k)) routeAgg.set(k, { src: r.src, dest: r.dest, buys: 0, buyCr: 0, profits: 0, profitCr: 0, qty: 0 });
    routeAgg.get(k).profits += 1;
    routeAgg.get(k).profitCr += t.deltaCredits;
  }
}

const routes = [...routeAgg.values()]
  .map((r) => ({
    ...r,
    label: `${ko(r.src)} → ${ko(r.dest)}`,
    marginPct: r.buyCr > 0 ? Math.round((r.profitCr / r.buyCr) * 100) : null,
    netCr: r.profitCr - r.buyCr,
  }))
  .sort((a, b) => b.profitCr - a.profitCr);

console.log(
  JSON.stringify(
    {
      fleet: { balance: fleet.balanceCredits, totalBuy, totalProfit, buyCount, profitCount },
      routes,
    },
    null,
    2,
  ),
);
