import fs from 'node:fs';
import sharp from 'sharp';

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

const raw = fs.readFileSync('tables/content/npc_ai_ships.csv', 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = splitCsvLine(lines[0]);
const idx = Object.fromEntries(header.map((k, i) => [k, i]));
const rows = [];
for (let i = 1; i < lines.length; i += 1) {
  const c = splitCsvLine(lines[i]);
  if (!c[idx.id]) continue;
  rows.push({
    id: c[idx.id],
    name: c[idx.name],
    nameEn: c[idx.name_en],
    arch: c[idx.capitalShipArchetype],
    hull: c[idx.hullTypeId],
    hp: Number(c[idx.maxHp]),
    shield: Number(c[idx.maxShield]),
    armor: Number(c[idx.armor]),
    sizeClass: c[idx.sizeClass],
    size: c[idx.size],
    level: c[idx.combatLevel],
    desc: c[idx['특징설명']] || '',
    portrait: c[idx.portraitImageAssetKey],
    mode: c[idx.npcMode],
    suffix: c[idx.infoLineSuffix],
  });
}
const arch = {};
const port = {};
const modes = {};
for (const r of rows) {
  arch[r.arch] = (arch[r.arch] || 0) + 1;
  port[r.portrait] = (port[r.portrait] || 0) + 1;
  modes[r.mode] = (modes[r.mode] || 0) + 1;
}
console.log('rows', rows.length);
console.log('archetypes', arch);
console.log('portraits', port);
console.log('modes', modes);
fs.writeFileSync('tools/debug/_ship_portrait_manifest.json', JSON.stringify(rows, null, 2));

const files = [
  'assets/images/ship/ship_001.png',
  'assets/images/ship/npc_test_ship_001.png',
  'assets/images/ship/trade_ship_100.png',
];
for (const p of files) {
  try {
    const m = await sharp(p).metadata();
    const st = fs.statSync(p);
    console.log('px', p, m.width, m.height, m.format, st.size);
  } catch (e) {
    console.log('px', p, e.message);
  }
}
