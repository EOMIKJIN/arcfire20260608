const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join('tools', 'long-run-monitor', 'logs', '_RKStorage.db');
const db = new Database(dbPath, { readonly: true });
const rows = db.prepare('SELECT * FROM catalystLocalStorage').all();
const byKey = new Map();
for (const row of rows) {
  const cols = Object.keys(row);
  const keyCol = cols.includes('key') ? 'key' : cols[0];
  const valCol = cols.includes('value') ? 'value' : cols[1];
  byKey.set(row[keyCol], row[valCol]);
}

const opsRaw = byKey.get('arcfire_arc_core_daily_ops_v1');
console.log('daily ops state:', opsRaw);
if (opsRaw) {
  const parsed = JSON.parse(opsRaw);
  console.log('lastBatchAtMs as date:', new Date(parsed.lastBatchAtMs).toISOString());
  console.log('now:', new Date().toISOString());
}
