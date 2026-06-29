import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dbPath = 'd:/arcfire20260607/tools/_tmp_convoy_route_snapshot.db';

const rawDb = spawnSync(
  'adb',
  ['exec-out', 'run-as', 'com.arcfire.online', 'cat', 'databases/RKStorage'],
  { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 },
).stdout;
fs.writeFileSync(dbPath, rawDb);

function readKey(key) {
  const raw = execFileSync('sqlite3', [dbPath, `SELECT value FROM catalystLocalStorage WHERE key='${key}';`], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  }).trim();
  return JSON.parse(raw);
}

const fleet = readKey('arcfire_arc_core_transport_fleet_bank_v1');
const txns = fleet.txns ?? [];

function parseRoute(note) {
  if (!note) return null;
  const m = note.match(/([a-z0-9_]+)→([a-z0-9_]+)/i);
  if (m) return { src: m[1], dest: m[2] };
  return null;
}

function parseQty(note) {
  const m = note?.match(/qty=(\d+)/);
  return m ? Number(m[1]) : 0;
}

function parseTg(note) {
  return note?.match(/tg_\d+/)?.[0] ?? null;
}

// Pair buy+profit by shipId (chronological reverse in store = newest first)
const byShip = new Map();
for (const t of [...txns].reverse()) {
  if (t.kind !== 'convoy_buy' && t.kind !== 'convoy_profit') continue;
  const sid = t.shipId ?? t.id;
  if (!byShip.has(sid)) byShip.set(sid, { buy: null, profit: null });
  const slot = byShip.get(sid);
  if (t.kind === 'convoy_buy' && !slot.buy) slot.buy = t;
  if (t.kind === 'convoy_profit' && !slot.profit) slot.profit = t;
}

const routeMap = new Map();
const planetFlow = new Map();
let totalBuy = 0;
let totalProfit = 0;
let totalQty = 0;
let completedTrips = 0;
let pendingLoads = 0;

for (const [, { buy, profit }] of byShip) {
  if (buy && !profit) {
    pendingLoads += 1;
    const r = parseRoute(buy.note);
    if (r) {
      const k = `${r.src}→${r.dest}`;
      if (!routeMap.has(k)) routeMap.set(k, { src: r.src, dest: r.dest, trips: 0, buy: 0, profit: 0, qty: 0, tgIds: new Set() });
      routeMap.get(k).trips += 0.5;
    }
    continue;
  }
  if (!buy || !profit) continue;
  completedTrips += 1;
  const buyCr = -buy.deltaCredits;
  const profitCr = profit.deltaCredits;
  const qty = parseQty(profit.note) || parseQty(buy.note);
  totalBuy += buyCr;
  totalProfit += profitCr;
  totalQty += qty;

  const r = parseRoute(profit.note) || parseRoute(buy.note);
  if (!r) continue;
  const k = `${r.src}→${r.dest}`;
  if (!routeMap.has(k)) {
    routeMap.set(k, { src: r.src, dest: r.dest, trips: 0, buy: 0, profit: 0, qty: 0, tgIds: new Set() });
  }
  const row = routeMap.get(k);
  row.trips += 1;
  row.buy += buyCr;
  row.profit += profitCr;
  row.qty += qty;
  const tg = parseTg(profit.note) || parseTg(buy.note) || profit.tgId || buy.tgId;
  if (tg) row.tgIds.add(tg);

  planetFlow.set(r.src, (planetFlow.get(r.src) ?? { outQty: 0, outBuy: 0, inQty: 0, inProfit: 0 }));
  planetFlow.set(r.dest, (planetFlow.get(r.dest) ?? { outQty: 0, outBuy: 0, inQty: 0, inProfit: 0 }));
  const s = planetFlow.get(r.src);
  const d = planetFlow.get(r.dest);
  s.outQty += qty;
  s.outBuy += buyCr;
  d.inQty += qty;
  d.inProfit += profitCr;
}

const routes = [...routeMap.values()]
  .map((r) => ({
    ...r,
    tgIds: [...r.tgIds],
    marginPct: r.buy > 0 ? Math.round((r.profit / r.buy) * 100) : 0,
    netCr: r.profit - r.buy,
  }))
  .sort((a, b) => b.profit - a.profit);

const topPlanets = [...planetFlow.entries()]
  .map(([id, v]) => ({
    planetId: id,
    role:
      v.outQty > v.inQty ? 'supply' : v.inQty > v.outQty ? 'demand' : 'hub',
    outQty: v.outQty,
    inQty: v.inQty,
    outBuy: v.outBuy,
    inProfit: v.inProfit,
  }))
  .sort((a, b) => b.outQty + b.inQty - (a.outQty + a.inQty));

console.log(
  JSON.stringify(
    {
      snapshotAt: new Date().toISOString(),
      fleet: {
        balance: fleet.balanceCredits,
        totalInflow: fleet.totalInflowCredits,
        totalOutflow: fleet.totalOutflowCredits,
        seed: 500_000,
        cumulativeNetMargin: fleet.totalInflowCredits - 500_000,
      },
      window: {
        completedTrips,
        pendingLoads,
        totalQty,
        totalBuy,
        totalProfit,
        avgMarginPct: totalBuy > 0 ? Math.round((totalProfit / totalBuy) * 100) : 0,
      },
      routes,
      topPlanets: topPlanets.slice(0, 12),
    },
    null,
    2,
  ),
);
