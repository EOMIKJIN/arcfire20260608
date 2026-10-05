import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = 'D:/arcfire20260607';
const jpgDir = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets';
const shipDir = path.join(root, 'assets/images/ship');
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
    const cols = splitCsvLine(lines[i]);
    const row = {};
    for (const [k, j] of Object.entries(idx)) row[k] = cols[j] ?? '';
    rows.push(row);
  }
  return rows;
}

function blackRow(data, w, c, y) {
  let n = 0;
  for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * c;
    if (data[i] < 14 && data[i + 1] < 14 && data[i + 2] < 14) n += 1;
  }
  return n / w > 0.9;
}

async function stackExtend(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;
  let top = 0;
  while (top < h && blackRow(data, w, c, top)) top += 1;
  let bot = 0;
  while (bot < h && blackRow(data, w, c, h - 1 - bot)) bot += 1;
  const inner = await sharp(file).extract({ left: 0, top, width: w, height: h - top - bot }).png().toBuffer();
  const fitted = await sharp(inner).resize(348, 348, { fit: 'inside' }).png().toBuffer();
  const fm = await sharp(fitted).metadata();
  const padTop = Math.floor((348 - fm.height) / 2);
  const padBot = 348 - fm.height - padTop;
  const band = Math.min(64, Math.max(28, Math.floor(fm.height * 0.22)));
  const ceil = await sharp(fitted).extract({ left: 0, top: 0, width: fm.width, height: band }).resize(348, padTop + band, { fit: 'fill' }).png().toBuffer();
  const floor = await sharp(fitted).extract({ left: 0, top: fm.height - band, width: fm.width, height: band }).resize(348, padBot + band, { fit: 'fill' }).png().toBuffer();
  const mid = await sharp(fitted).extract({ left: 0, top: band, width: fm.width, height: fm.height - band * 2 }).png().toBuffer();
  const left = Math.floor((348 - fm.width) / 2);
  return sharp({ create: { width: 348, height: 348, channels: 3, background: { r: 12, g: 12, b: 14 } } })
    .composite([
      { input: ceil, top: 0, left },
      { input: floor, top: 348 - (padBot + band), left },
      { input: mid, top: padTop + band, left },
    ])
    .png()
    .toBuffer();
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
  if (!enemy || keepStellium.has(s.portraitImageAssetKey)) continue;
  portraits.add(s.portraitImageAssetKey);
}

const plate = await stackExtend(path.join(jpgDir, 'crimson_hangar_clean.jpg'));
let n = 0;
for (const rel of portraits) {
  const cut = path.join(cutDir, path.basename(rel));
  if (!fs.existsSync(cut)) {
    console.log('missing cut', rel);
    continue;
  }
  const ship = await sharp(cut).resize(348, 348, { fit: 'fill' }).png().toBuffer();
  const dest = path.join(root, rel);
  const tmp = `${dest}.tmp.png`;
  await sharp(plate).composite([{ input: ship, blend: 'over' }]).png().toFile(tmp);
  fs.renameSync(tmp, dest);
  n += 1;
}
console.log('crimson', n);
