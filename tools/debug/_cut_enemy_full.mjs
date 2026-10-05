import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { removeBackground } from './_bgtemp/node_modules/@imgly/background-removal-node/dist/index.mjs';

const root = 'D:/arcfire20260607';
const modelDist = path.resolve('tools/debug/_bgtemp/node_modules/@imgly/background-removal-node/dist');
const cutDir = path.join(root, 'tools/debug/_enemy_cutouts');
fs.mkdirSync(cutDir, { recursive: true });

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
    const cols = splitCsvLine(lines[i]);
    const row = {};
    for (const [k, j] of Object.entries(idx)) row[k] = cols[j] ?? '';
    rows.push(row);
  }
  return rows;
}

const captains = load(path.join(root, 'tables/content/npc_ai_captains.csv'));
const ships = load(path.join(root, 'tables/content/npc_ai_ships.csv'));
const byShip = new Map();
for (const c of captains) {
  if (!c.assignedShipId) continue;
  if (!byShip.has(c.assignedShipId)) byShip.set(c.assignedShipId, []);
  byShip.get(c.assignedShipId).push(c);
}
const keepStellium = new Set([
  'assets/images/ship/npc_red_fleet_1.png',
  'assets/images/ship/npc_vega_red_5.png',
]);
const portraits = new Set();
for (const s of ships) {
  const caps = byShip.get(s.id) ?? [];
  const enemy = caps.some((c) => c.combatTeam === 'red' || (c.aiClanId ?? '').includes('crimson'))
    || s.id.startsWith('npc_wave_invader_')
    || s.id.startsWith('npc_enemy_');
  if (!enemy) continue;
  if (keepStellium.has(s.portraitImageAssetKey)) continue;
  portraits.add(s.portraitImageAssetKey);
}

console.log('cut_targets', portraits.size);
let n = 0;
for (const rel of portraits) {
  const abs = path.join(root, rel);
  const blob = await removeBackground(pathToFileURL(abs).href, {
    publicPath: `file://${modelDist}/`,
    model: 'medium',
    output: { format: 'image/png', type: 'foreground' },
  });
  fs.writeFileSync(path.join(cutDir, path.basename(rel)), Buffer.from(await blob.arrayBuffer()));
  n += 1;
  if (n % 10 === 0) console.log('cut', n);
}
console.log('done cuts', n);
