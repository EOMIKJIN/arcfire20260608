const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = 'C:/Users/eomsp/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const db = path.join(__dirname, 'RKStorage-omega-check.db');
function q(sql) {
  return execFileSync(sqlite, [db, sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim();
}
const war = JSON.parse(q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_clan_war_foundation_v2';"));
const root = war.data || war;
const holds = root.planetHolds || {};

// omega neighbors from known graph
const neighbors = ['new_eden', 'draco_nebula', 'helios', 'titan_gate', 'iron_cross', 'shadow_nexus', 'vega_outpost', 'vega_base', 'perseus', 'sirius'];
// get from a quick inline - we'll print all holds for neighbor systemIds
const bySys = {};
for (const [pid, h] of Object.entries(holds)) {
  const sid = h.systemId;
  if (!sid) continue;
  if (!bySys[sid]) bySys[sid] = [];
  bySys[sid].push({ pid, occ: h.occupierClanId, kind: h.kind });
}

console.log('=== omega_hub hold ===');
console.log(JSON.stringify(holds.omega_hub, null, 2));

const omegaConns = ['new_eden', 'draco_nebula', 'helios', 'iron_cross', 'vega_outpost', 'shadow_nexus', 'titan_gate', 'perseus'];
// Will refine from code - print whatever exists
console.log('\n=== sample neighbor holds ===');
for (const sid of Object.keys(bySys).sort()) {
  const interesting = ['omega', 'eden', 'draco', 'helios', 'iron', 'vega', 'shadow', 'titan', 'perseus', 'sirius', 'new_eden'];
  if (!interesting.some((k) => sid.includes(k) || sid === 'helios' || sid === 'perseus' || sid === 'sirius')) continue;
  console.log(sid, JSON.stringify(bySys[sid]));
}

// Infer hasBlue/hasRed for omega_station using same logic as presence
function sideOf(occ) {
  const s = String(occ || '');
  if (s.includes('blue') || s === 'balance_seed_faction_blue') return 'BLUE';
  if (s.includes('red') || s === 'balance_seed_faction_red') return 'RED';
  if (s === 'neutral' || !s) return 'NEUTRAL';
  if (s.includes('independent') || s.includes('player')) return 'INDEPENDENT';
  return 'OTHER';
}

// Need exact connections - parse from generated if possible
const fs = require('fs');
const csvPath = path.join(__dirname, '../../../src/data/generated/csvSystems.ts');
const src = fs.readFileSync(csvPath, 'utf8');
const m = src.match(/"omega_station"\s*:\s*\{[\s\S]*?connections:\s*\[([^\]]+)\]/);
const conns = m ? m[1].split(',').map((x) => x.replace(/["'\s]/g, '')).filter(Boolean) : [];
console.log('\n=== omega_station connections ===', conns);

let hasBlue = false, hasRed = false;
for (const cid of conns) {
  const list = bySys[cid] || [];
  for (const h of list) {
    const side = sideOf(h.occ);
    if (side === 'BLUE') hasBlue = true;
    if (side === 'RED') hasRed = true;
  }
  console.log(' adj', cid, list.map((x) => `${x.pid}:${sideOf(x.occ)}`).join(',') || '(no hold)');
}
console.log('\n=== inferred runtimeGraph ===', hasBlue && hasRed ? 'blue_red' : hasBlue ? 'blue_neutral' : hasRed ? 'red_neutral' : 'isolated/fallback');
console.log('CSV policy combatMode = blue_neutral');
console.log('MISMATCH =', (hasBlue && hasRed) || (!hasBlue && !hasRed));
