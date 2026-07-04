'use strict';
const fs = require('fs');
const path = require('path');

const dbPath = process.argv[2] || path.join(__dirname, 'logs/_rkstorage_pull.db');
if (!fs.existsSync(dbPath)) {
  console.error('missing db:', dbPath);
  process.exit(1);
}

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  // fallback: scan raw bytes for keys (AsyncStorage sqlite)
  const buf = fs.readFileSync(dbPath);
  const text = buf.toString('latin1');
  const keys = [
    'arcfire_planet_core_runtime_v1',
    'arcfire_arc_core_planet_dev_budget_v1',
    'arcfire_arc_core_vault',
    'arcfire_arc_core_central_bank',
    'arcfire_arc_core_daily_ops_v1',
  ];
  for (const k of keys) {
    console.log(k, text.includes(k) ? 'FOUND' : 'missing');
  }
  process.exit(0);
}

const db = new Database(dbPath, { readonly: true });
const table = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((r) => r.name);
console.log('tables:', table.join(', '));

const keyCol = table.includes('catalystLocalStorage') ? 'catalystLocalStorage' : table[0];
const rows = db
  .prepare(
    `SELECT key, length(value) as len FROM ${keyCol} WHERE key LIKE '%planet%' OR key LIKE '%arc_core%' OR key LIKE '%vault%' OR key LIKE '%central%' OR key LIKE '%clan%'`,
  )
  .all();
console.log('keys:', JSON.stringify(rows, null, 2));

const coreKey = 'arcfire_planet_core_runtime_v1';
const row = db.prepare(`SELECT value FROM ${keyCol} WHERE key = ?`).get(coreKey);
if (row?.value) {
  const data = JSON.parse(row.value);
  const RED = [
    'omega_hub',
    'sirius_border',
    'perseus_memorial',
    'crimson_base',
    'dark_haven',
    'blood_station',
    'abyss_gate',
    'nightfall_citadel',
    'core_prime',
  ];
  const byPlanet = data.byPlanetId || data.planets || data;
  console.log('\n=== RED planet dev snapshot ===');
  for (const pid of RED) {
    const slot = byPlanet?.[pid];
    if (!slot) {
      console.log(pid, 'NO_SLOT');
      continue;
    }
    const dev = slot.planetDev || slot.dev || slot.facilities || null;
    const core = slot.core || slot;
    const summary = {
      core: core.resource != null ? { R: core.resource, P: core.population, D: core.defense, T: core.technology, E: core.environment } : undefined,
      planetDev: dev,
      keys: Object.keys(slot).slice(0, 20),
    };
    // flatten facility modules if present at top level
    const modules = {};
    for (const k of Object.keys(slot)) {
      if (k.startsWith('dev_') || k.includes('defense') || k.includes('satellite') || k.includes('shipyard') || k.includes('trade_port') || k.includes('lab') || k.includes('tavern') || k.includes('dome')) {
        modules[k] = slot[k];
      }
    }
    if (Object.keys(modules).length) summary.modules = modules;
    console.log(JSON.stringify({ planetId: pid, ...summary }));
  }
}

const budgetRow = db
  .prepare(`SELECT value FROM ${keyCol} WHERE key = 'arcfire_arc_core_planet_dev_budget_v1'`)
  .get();
if (budgetRow?.value) {
  console.log('\n=== planet dev budget ===');
  console.log(budgetRow.value.slice(0, 2000));
}

db.close();
