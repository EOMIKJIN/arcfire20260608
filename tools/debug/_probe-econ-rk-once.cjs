const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'long-run-monitor', 'logs', '_RKStorage.db');
const st = fs.statSync(dbPath);
const head = fs.readFileSync(dbPath).subarray(0, 16).toString('utf8');
console.log(JSON.stringify({ size: st.size, mtime: st.mtime.toISOString(), sqliteHead: head }, null, 2));
if (!head.startsWith('SQLite format 3')) {
  console.error('NOT_SQLITE');
  process.exit(2);
}

const db = new Database(dbPath, { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('tables', tables);

const tableName = tables.some((t) => t.name === 'catalystLocalStorage')
  ? 'catalystLocalStorage'
  : tables[0] && tables[0].name;
if (!tableName) {
  console.error('NO_TABLE');
  process.exit(3);
}

const keys = [
  'arcfire_arc_core_daily_ops_v1',
  'arcfire_arc_core_vault_v1',
  'arcfire_blue_team_shared_vault_v1',
  'arcfire_neutral_nation_vault_v1',
  'arcfire_arc_core_transport_fleet_bank_v1',
  'arcfire_player_independent_nation_vault_v1',
  'arcfire_planet_trade_fee_ledger_v1',
  'arcfire_balance_overlay_delta_ingest_v1',
  'arcfire_fiscal_opex_snapshot_v1',
  'arcfire_fiscal_opex_coeff_overlay_v1',
  'arcfire_stellium_colonize_fleet_fiscal_v1',
  'arcfire_arc_core_central_bank_ledger_v1',
  'arcfire_arc_core_central_bank_expenditure_v1',
];

function getVal(key) {
  try {
    const row = db.prepare(`SELECT value FROM ${tableName} WHERE key = ?`).get(key);
    return row ? row.value : null;
  } catch (e) {
    return String(e);
  }
}

function summarizeVault(raw) {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return {
      balanceCredits: p.balanceCredits,
      totalInflowCredits: p.totalInflowCredits,
      totalOutflowCredits: p.totalOutflowCredits,
      txnCount: Array.isArray(p.txns) ? p.txns.length : 0,
    };
  } catch {
    return { parseError: true, len: raw.length };
  }
}

const out = {};
for (const key of keys) {
  const raw = getVal(key);
  if (raw == null) {
    out[key] = null;
    continue;
  }
  if (key.includes('vault') || key.includes('bank_v1')) {
    out[key] = summarizeVault(raw);
    continue;
  }
  try {
    out[key] = JSON.parse(raw);
  } catch {
    out[key] = { rawLen: raw.length };
  }
}

if (out.arcfire_planet_trade_fee_ledger_v1 && typeof out.arcfire_planet_trade_fee_ledger_v1 === 'object') {
  const led = out.arcfire_planet_trade_fee_ledger_v1;
  const planets = led.byPlanetId || led.planets || {};
  const ids = Object.keys(planets);
  const zero = [];
  const top = [];
  for (const id of ids) {
    const b = planets[id] || {};
    const fee = Number(b.factionFeeCredits ?? b.feeCredits ?? b.dailyFeeCredits ?? 0);
    const convoy = Number(b.convoyGrossCredits ?? 0);
    top.push({ id, fee, convoy, kst: b.kstDayKey || led.kstDayKey || null });
    if (fee === 0 && convoy === 0) zero.push(id);
  }
  top.sort((a, b) => b.fee - a.fee);
  out.ledgerSummary = {
    kstDayKey: led.kstDayKey || led.dayKey || null,
    planetCount: ids.length,
    zeroFeeAndConvoy: zero,
    topFee: top.slice(0, 8),
    bottomFee: top.slice(-6),
  };
  delete out.arcfire_planet_trade_fee_ledger_v1;
}

console.log(JSON.stringify(out, null, 2));
db.close();
