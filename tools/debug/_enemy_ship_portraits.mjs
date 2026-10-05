import fs from 'node:fs';

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function load(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const c = splitCsvLine(lines[i]);
    const row = {};
    for (const [k, j] of Object.entries(idx)) row[k] = c[j] ?? '';
    rows.push(row);
  }
  return rows;
}

const captains = load('tables/content/npc_ai_captains.csv');
const ships = load('tables/content/npc_ai_ships.csv');
const byShip = new Map();
for (const c of captains) {
  const sid = c.assignedShipId;
  if (!sid) continue;
  if (!byShip.has(sid)) byShip.set(sid, []);
  byShip.get(sid).push(c);
}

const enemy = [];
for (const s of ships) {
  const caps = byShip.get(s.id) ?? [];
  const teams = [...new Set(caps.map((c) => c.combatTeam))];
  const factions = [...new Set(caps.map((c) => c.factionId))];
  const clans = [...new Set(caps.map((c) => c.aiClanId))];
  const red = teams.includes('red');
  const crimson = clans.some((id) => id.includes('crimson'));
  const wave = s.id.startsWith('npc_wave_invader_');
  const enemyId = s.id.startsWith('npc_enemy_');
  if (red || crimson || wave || enemyId) {
    enemy.push({
      id: s.id,
      name: s.name,
      portrait: s.portraitImageAssetKey,
      teams: teams.join('|'),
      factions: factions.join('|'),
      why: [red ? 'team-red' : '', crimson ? 'crimson-clan' : '', wave ? 'wave' : '', enemyId ? 'enemy-id' : ''].filter(Boolean).join(','),
    });
  }
}
const portraits = new Map();
for (const e of enemy) {
  if (!portraits.has(e.portrait)) portraits.set(e.portrait, []);
  portraits.get(e.portrait).push(e.id);
}
const enemyIds = new Set(enemy.map((e) => e.id));
const users = new Map();
for (const s of ships) {
  const key = s.portraitImageAssetKey;
  if (!users.has(key)) users.set(key, []);
  users.get(key).push(s.id);
}
let mixed = 0;
let exclusive = 0;
for (const [p, ids] of portraits) {
  const all = users.get(p) ?? [];
  const outsiders = all.filter((id) => !enemyIds.has(id));
  if (outsiders.length) {
    mixed += 1;
    console.log('MIXED', p, 'enemy', ids.join(','), 'keep', outsiders.join(','));
  } else {
    exclusive += 1;
  }
}
console.log('enemy_ships', enemy.length, 'unique_portraits', portraits.size, 'exclusive', exclusive, 'mixed', mixed);
