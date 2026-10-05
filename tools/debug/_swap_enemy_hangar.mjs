import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { removeBackground } from './_bgtemp/node_modules/@imgly/background-removal-node/dist/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const modelDist = path.resolve(here, '_bgtemp/node_modules/@imgly/background-removal-node/dist');

const root = 'D:/arcfire20260607';
const cutDir = path.join(root, 'tools/debug/_enemy_cutouts');

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

function enemyPortraits() {
  const captains = load(path.join(root, 'tables/content/npc_ai_captains.csv'));
  const ships = load(path.join(root, 'tables/content/npc_ai_ships.csv'));
  const byShip = new Map();
  for (const c of captains) {
    const sid = c.assignedShipId;
    if (!sid) continue;
    if (!byShip.has(sid)) byShip.set(sid, []);
    byShip.get(sid).push(c);
  }
  const portraits = new Map();
  for (const s of ships) {
    const caps = byShip.get(s.id) ?? [];
    const red = caps.some((c) => c.combatTeam === 'red');
    const crimson = caps.some((c) => (c.aiClanId ?? '').includes('crimson'));
    const wave = s.id.startsWith('npc_wave_invader_');
    const enemyId = s.id.startsWith('npc_enemy_');
    if (!(red || crimson || wave || enemyId)) continue;
    const key = s.portraitImageAssetKey;
    if (!portraits.has(key)) portraits.set(key, []);
    portraits.get(key).push(s.id);
  }
  return [...portraits.keys()];
}

async function cutout(absPng) {
  const blob = await removeBackground(pathToFileURL(absPng).href, {
    publicPath: `file://${modelDist}/`,
    model: 'medium',
    debug: false,
    progress: (key, current, total) => {
      if (current === total || current === 0) console.log('model', key, current, total);
    },
    output: { format: 'image/png', type: 'foreground' },
  });
  return Buffer.from(await blob.arrayBuffer());
}

const only = process.argv[2];
const portraits = enemyPortraits().filter((p) => !only || p.includes(only));
fs.mkdirSync(cutDir, { recursive: true });
console.log('targets', portraits.length);

for (const rel of portraits) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log('missing', rel);
    continue;
  }
  const ship = await cutout(abs);
  const out = path.join(cutDir, path.basename(rel));
  fs.writeFileSync(out, ship);
  console.log('cut', rel);
}
console.log('done cuts', portraits.length);
