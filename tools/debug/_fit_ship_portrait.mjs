import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const srcDir = process.argv[2];
const ids = process.argv.slice(3);
const outDir = path.resolve('assets/images/ship');
for (const id of ids) {
  const src = path.join(srcDir, `${id}.jpg`);
  const out = path.join(outDir, `${id}.png`);
  await sharp(src)
    .resize(348, 348, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(out);
  const m = await sharp(out).metadata();
  const st = fs.statSync(out);
  console.log(id, m.width, m.height, st.size);
}
