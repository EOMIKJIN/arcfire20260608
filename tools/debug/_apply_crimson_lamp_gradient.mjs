import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = 'D:/arcfire20260607';
const shipDir = path.join(root, 'assets/images/ship');
const cutDir = path.join(root, 'tools/debug/_enemy_cutouts');
const mapPath = path.join(root, 'src/game/npcCapitalShipPortraitAssets.ts');
const csvPath = path.join(root, 'tables/content/npc_ai_ships.csv');
const genPath = path.join(root, 'src/data/generated/csvNpcCapitalShips.ts');

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
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = split(lines[0]);
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const rows = lines.slice(1).map((line) => {
    const cols = split(line);
    const row = {};
    for (const [k, i] of Object.entries(idx)) row[k] = cols[i] ?? '';
    return row;
  });
  return { rows, lines, nl, header: lines[0] };
}

async function gradient(srcPath, cutPath) {
  const base = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = base.info.width;
  const h = base.info.height;
  const ship = fs.existsSync(cutPath)
    ? await sharp(cutPath).resize(w, h, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
    : null;
  const mask = Buffer.alloc(w * h);
  for (let p = 0, i = 0; p < w * h; p += 1, i += 4) {
    if (ship && ship[i + 3] > 48) continue;
    const r = base.data[i];
    const g = base.data[i + 1];
    const b = base.data[i + 2];
    if (r > 220 && g < 80 && b < 55 && r > g + 120) mask[p] = 255;
  }
  const blurred = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(9).raw().toBuffer();
  const out = Buffer.from(base.data);
  const RED = [255, 42, 16];
  const MAX = 0.14;
  for (let p = 0, i = 0; p < w * h; p += 1, i += 4) {
    if (ship && ship[i + 3] > 48) continue;
    const t = (blurred[p] / 255) * MAX;
    if (t < 0.012) continue;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    out[i] = Math.min(255, r * (1 - t) + (r * 0.3 + RED[0] * 0.7) * t);
    out[i + 1] = Math.min(255, g * (1 - t) + (g * 0.45 + RED[1] * 0.55) * t);
    out[i + 2] = Math.min(255, b * (1 - t) + (b * 0.45 + RED[2] * 0.55) * t);
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

const { rows } = load(csvPath);
const caps = load(path.join(root, 'tables/content/npc_ai_captains.csv')).rows;
const by = new Map();
for (const c of caps) {
  if (!c.assignedShipId) continue;
  if (!by.has(c.assignedShipId)) by.set(c.assignedShipId, []);
  by.get(c.assignedShipId).push(c);
}
const groups = new Map();
for (const s of rows) {
  const p = s.portraitImageAssetKey;
  if (!groups.has(p)) groups.set(p, []);
  groups.get(p).push(s);
}

const retargets = [];
let painted = 0;
for (const [portrait, ships] of groups) {
  const crimson = ships.filter((s) => (by.get(s.id) ?? []).some((c) => (c.aiClanId ?? '').includes('crimson')));
  if (crimson.length === 0) continue;
  const others = ships.filter((s) => !crimson.includes(s));
  const src = path.join(root, portrait);
  const cut = path.join(cutDir, path.basename(portrait));
  const graded = await gradient(src, cut);
  const fileId = path.basename(portrait, '.png');
  const fileIsCrimson = crimson.some((s) => s.id === fileId);
  if (others.length === 0) {
    const tmp = `${src}.tmp.png`;
    await sharp(graded).toFile(tmp);
    fs.renameSync(tmp, src);
    painted += 1;
    console.log('in-place', fileId);
    continue;
  }
  if (fileIsCrimson) {
    const keepId = others[0].id;
    const keepPath = path.join(shipDir, `${keepId}.png`);
    if (!fs.existsSync(keepPath)) fs.copyFileSync(src, keepPath);
    const tmp = `${src}.tmp.png`;
    await sharp(graded).toFile(tmp);
    fs.renameSync(tmp, src);
    for (const s of others) retargets.push({ id: s.id, from: portrait, to: `assets/images/ship/${keepId}.png` });
    painted += 1;
    console.log('gradient', fileId, 'keep', keepId);
  } else {
    const newId = crimson[0].id;
    const dest = path.join(shipDir, `${newId}.png`);
    const tmp = `${dest}.tmp.png`;
    await sharp(graded).toFile(tmp);
    fs.renameSync(tmp, dest);
    for (const s of crimson) retargets.push({ id: s.id, from: portrait, to: `assets/images/ship/${newId}.png` });
    painted += 1;
    console.log('split', newId);
  }
}

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const nl = csvRaw.includes('\r\n') ? '\r\n' : '\n';
const csvLines = csvRaw.split(/\r?\n/);
let gen = fs.readFileSync(genPath, 'utf8');
let map = fs.readFileSync(mapPath, 'utf8');
const newKeys = new Set();
for (const t of retargets) {
  const i = csvLines.findIndex((l) => split(l)[1] === t.id);
  if (i < 0 || !csvLines[i].includes(t.from)) throw new Error(`csv ${t.id}`);
  csvLines[i] = csvLines[i].replace(t.from, t.to);
  const at = gen.indexOf(`id: "${t.id}"`);
  if (at < 0) throw new Error(`gen ${t.id}`);
  const window = gen.slice(at, at + 2500);
  const key = `portraitImageAssetKey: "${t.from}"`;
  const rel = window.indexOf(key);
  if (rel < 0) throw new Error(`portrait ${t.id}`);
  const abs = at + rel;
  gen = `${gen.slice(0, abs)}portraitImageAssetKey: "${t.to}"${gen.slice(abs + key.length)}`;
  newKeys.add(t.to);
}
for (const key of newKeys) {
  if (map.includes(`'${key}'`)) continue;
  const line = `  '${key}': require('../../${key}'),\n`;
  const anchor = "  'assets/images/ship/ship_001.png':";
  if (!map.includes(anchor)) throw new Error('map anchor');
  map = map.replace(anchor, line + anchor);
}
fs.writeFileSync(csvPath, csvLines.join(nl));
fs.writeFileSync(genPath, gen);
fs.writeFileSync(mapPath, map);
console.log('painted', painted, 'retargets', retargets.length, 'new_keys', newKeys.size);
