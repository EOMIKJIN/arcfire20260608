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

for (const n of [26, 27]) {
  const name = `bar_att_char0${n}.png`;
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
  await sharp(src).resize(SIZE, SIZE, { fit: 'cover', position: 'centre' }).png().toFile(dest);
  const meta = await sharp(dest).metadata();
  if (meta.width !== SIZE || meta.height !== SIZE) {
    throw new Error(`${name} not ${SIZE}x${SIZE}`);
  }
  console.log(`${name} ${meta.width}x${meta.height} ${fs.statSync(dest).size}`);
}
