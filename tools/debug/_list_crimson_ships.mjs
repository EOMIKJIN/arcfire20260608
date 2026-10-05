import fs from 'node:fs';

function split(line) {
  const o = [];
  let c = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === ',' && !q) {
      o.push(c);
      c = '';
      continue;
    }
    c += ch;
  }
  o.push(c);
  return o;
}

function load(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const header = split(lines[0]);
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row = {};
    for (const [k, i] of Object.entries(idx)) row[k] = cols[i] ?? '';
    return row;
  });
}

const caps = load('tables/content/npc_ai_captains.csv');
const ships = load('tables/content/npc_ai_ships.csv');
const by = new Map();
for (const c of caps) {
  if (!c.assignedShipId) continue;
  if (!by.has(c.assignedShipId)) by.set(c.assignedShipId, []);
  by.get(c.assignedShipId).push(c);
}
const clanIds = new Set();
for (const c of caps) if ((c.aiClanId ?? '').toLowerCase().includes('crimson')) clanIds.add(c.aiClanId);
console.log('clans', [...clanIds].join(','));
const portraits = new Map();
for (const s of ships) {
  const cs = by.get(s.id) ?? [];
  const hit = cs.some((c) => (c.aiClanId ?? '').toLowerCase().includes('crimson'));
  if (!hit) continue;
  const p = s.portraitImageAssetKey;
  if (!portraits.has(p)) portraits.set(p, []);
  portraits.get(p).push(s.id);
}
const users = new Map();
for (const s of ships) {
  const p = s.portraitImageAssetKey;
  if (!users.has(p)) users.set(p, []);
  users.get(p).push(s.id);
}
console.log('portraits', portraits.size);
for (const [p, ids] of portraits) {
  const all = users.get(p) ?? [];
  const outsiders = all.filter((id) => !ids.includes(id));
  console.log(p.split('/').pop(), 'crimson', ids.length, 'other', outsiders.join(',') || '-');
}
