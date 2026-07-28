const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname);
const sqlite = 'C:/Users/eomsp/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const db = path.join(dir, 'RKStorage-ok.db');

function q(sql) {
  return execFileSync(sqlite, [db, sql], { encoding: 'utf8' }).trim();
}

const war = JSON.parse(q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_clan_war_foundation_v2';"));
const ter = JSON.parse(q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_arc_core_territorial_combat_v1';"));
const root = war.data || war;
const h = root.planetHolds.omega_hub;
console.log('=== LIVE omega_hub hold ===');
console.log(JSON.stringify(h, null, 2));

const ops = root.operations || [];
const om = ops.filter((o) => o.targetPlanetId === 'omega_hub');
console.log('=== omega ops total', om.length);
for (const o of om) {
  const t = o.resolvedAt || o.createdAt || 0;
  const ext = o.ext || {};
  console.log(
    new Date(t).toISOString(),
    'dec=' + ext.decision,
    String(ext.previousSide) + '->' + String(ext.newSide || ext.factionSide),
    'mode=' + ext.combatMode,
    'atk=' + ext.attackerSide,
    'def=' + ext.defenderSide,
  );
}

const neut = ops.filter((o) => o.ext && o.ext.decision === 'neutral_declare').slice(-12);
console.log('=== recent neutral_declare (any planet) ===');
for (const o of neut) {
  const ext = o.ext || {};
  console.log(
    new Date(o.resolvedAt || 0).toISOString(),
    o.targetPlanetId,
    String(ext.previousSide) + '->' + String(ext.newSide || ext.factionSide),
  );
}

const st = ter.data || ter;
console.log('=== territorial state keys ===', Object.keys(st));
fs.writeFileSync(path.join(dir, 'omega-audit-out.json'), JSON.stringify({ hold: h, omegaOps: om, territorial: st }, null, 2));
console.log('wrote omega-audit-out.json');

// adjacent presence snapshot from current holds
const holds = root.planetHolds || {};
const bySys = {};
for (const [pid, hold] of Object.entries(holds)) {
  const sid = hold.systemId;
  if (!sid) continue;
  bySys[sid] = bySys[sid] || [];
  bySys[sid].push({ pid, occ: hold.occupierClanId, kind: hold.kind });
}
console.log('=== omega_station neighbors sample ===');
for (const sys of ['omega_station', 'new_eden', 'draco_nebula', 'helios', 'titan_gate']) {
  console.log(sys, JSON.stringify(bySys[sys] || []));
}
