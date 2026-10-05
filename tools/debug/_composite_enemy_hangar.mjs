import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = 'D:/arcfire20260607';
const cutDir = path.join(root, 'tools/debug/_enemy_cutouts');
const hangarSrc = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets/crimson_hangar_clean.jpg';
const shipDir = path.join(root, 'assets/images/ship');

const skipInPlace = new Set([
  'npc_red_fleet_1.png',
  'npc_vega_red_4.png',
]);

const hangar = await sharp(hangarSrc)
  .resize(348, 348, { fit: 'cover', position: 'centre' })
  .png()
  .toBuffer();

async function paint(cutName, destAbs) {
  const cut = path.join(cutDir, cutName);
  if (!fs.existsSync(cut)) throw new Error(`missing cut ${cutName}`);
  const ship = await sharp(cut).resize(348, 348, { fit: 'fill' }).png().toBuffer();
  const tmp = `${destAbs}.tmp.png`;
  await sharp(hangar).composite([{ input: ship, blend: 'over' }]).png().toFile(tmp);
  fs.renameSync(tmp, destAbs);
  console.log('wrote', path.basename(destAbs));
}

const cuts = fs.readdirSync(cutDir).filter((n) => n.endsWith('.png') && !n.startsWith('_') && !n.includes('.medium'));
let n = 0;
for (const name of cuts) {
  if (skipInPlace.has(name)) continue;
  await paint(name, path.join(shipDir, name));
  n += 1;
}

fs.copyFileSync(path.join(shipDir, 'npc_vega_red_4.png'), path.join(shipDir, 'npc_vega_red_5.png'));
await paint('npc_vega_red_4.png', path.join(shipDir, 'npc_vega_red_4.png'));
await paint('npc_red_fleet_1.png', path.join(shipDir, 'npc_red_fleet_3.png'));
console.log('exclusive', n, 'splits 2');
