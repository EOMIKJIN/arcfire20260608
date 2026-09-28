import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SIZE = 240;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const srcDir = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/d-arcfire20260607/assets',
);
const destDir = path.join(root, 'assets/images/npc');

for (let n = 17; n <= 25; n += 1) {
  const name = `bar_att_char0${n}.png`;
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
  await sharp(src).resize(SIZE, SIZE, { fit: 'cover', position: 'centre' }).png().toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`${name} ${meta.width}x${meta.height} ${fs.statSync(dest).size}`);
}

const PORTRAIT_BY_NAME = {
  세이블: 'assets/images/npc/bar_att_char017.png',
  신더: 'assets/images/npc/bar_att_char018.png',
  오팔: 'assets/images/npc/bar_att_char019.png',
  에코: 'assets/images/npc/bar_att_char020.png',
  니온: 'assets/images/npc/bar_att_char021.png',
  제이드: 'assets/images/npc/bar_att_char022.png',
  루미: 'assets/images/npc/bar_att_char023.png',
  카일라: 'assets/images/npc/bar_att_char024.png',
  세레: 'assets/images/npc/bar_att_char025.png',
};

const csvPath = path.join(root, 'tables/content/bar_attendants.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
const header = lines[0].split(',');
const nameIdx = header.indexOf('displayNameKo');
const portraitIdx = header.indexOf('portraitImageAssetKey');
if (nameIdx < 0 || portraitIdx < 0) throw new Error('bar_attendants.csv columns missing');
let patched = 0;
const out = lines.map((line, i) => {
  if (i === 0 || !line.trim()) return line;
  const cols = line.split(',');
  const name = (cols[nameIdx] ?? '').trim();
  const key = PORTRAIT_BY_NAME[name];
  if (!key) return line;
  if ((cols[portraitIdx] ?? '').trim() === key) return line;
  cols[portraitIdx] = key;
  patched += 1;
  return cols.join(',');
});
fs.writeFileSync(csvPath, out.join(nl).replace(/\n?$/, nl), 'utf8');
console.log(`patched bar_attendants.csv rows=${patched}`);
