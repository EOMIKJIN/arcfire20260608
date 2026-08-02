const fs = require('fs');
const path = require('path');

const dbPath = path.join('tools', 'long-run-monitor', 'logs', '_RKStorage.db');
let Database;
try {
  Database = require('better-sqlite3');
} catch {
  Database = null;
}

if (Database) {
  const db = new Database(dbPath, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('tables', tables);
  const table = 'catalystLocalStorage';
  console.log('cols', db.prepare(`PRAGMA table_info(${table})`).all());
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  console.log('rowCount', rows.length);
  if (rows[0]) console.log('sampleKeys', Object.keys(rows[0]));
  const keyCol = rows[0] && ('key' in rows[0] ? 'key' : Object.keys(rows[0])[0]);
  const valCol = rows[0] && ('value' in rows[0] ? 'value' : Object.keys(rows[0])[1]);
  for (const row of rows) {
    const key = String(row[keyCol] ?? '');
    const v = String(row[valCol] ?? '');
    if (!/player|world|unlock/i.test(key) && !/currentSystemId|unlockedSystemIds/.test(v)) continue;
    if (!/currentSystemId|unlockedSystemIds|currentPlanetId|lastHubPlanetId/.test(v) && !/unlock/i.test(key)) {
      continue;
    }
    console.log('\n==', key, 'len', v.length);
    for (const field of ['currentPlanetId', 'currentSystemId', 'lastHubPlanetId', 'unlockedSystemIds', 'credits']) {
      const re = new RegExp('"' + field + '":("[^"]*"|\\[[^\\]]{0,800}\\]|null|\\d+)');
      const m = v.match(re);
      if (m) console.log(field, '=>', m[1].slice(0, 400));
    }
  }
  process.exit(0);
}

const b = fs.readFileSync(dbPath);
const s = b.toString('latin1');
const keys = [...new Set([...s.matchAll(/arcfire_[a-z0-9_]+/g)].map((m) => m[0]))].sort();
console.log('fallback keys', keys.length);
console.log(keys.slice(0, 50).join('\n'));
for (const field of ['currentPlanetId', 'currentSystemId', 'lastHubPlanetId', 'unlockedSystemIds']) {
  const re = new RegExp('"' + field + '":("[^"]{0,64}"|\\[[^\\]]{0,600}\\]|null)', 'g');
  const found = new Set();
  let m;
  while ((m = re.exec(s))) found.add(m[1].slice(0, 300));
  console.log(field, '=>', [...found].join(' || ') || '(none)');
}
