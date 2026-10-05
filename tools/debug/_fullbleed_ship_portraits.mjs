import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('assets/images/ship');

function blackRow(data, w, c, y) {
  let n = 0;
  for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * c;
    if (data[i] < 12 && data[i + 1] < 12 && data[i + 2] < 12) n += 1;
  }
  return n / w > 0.92;
}

let done = 0;
let skipped = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.png')) continue;
  const abs = path.join(dir, name);
  const img = sharp(abs);
  const meta = await img.metadata();
  if (meta.width !== 348 || meta.height !== 348) {
    skipped += 1;
    continue;
  }
  const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;
  let top = 0;
  while (top < h && blackRow(data, w, c, top)) top += 1;
  let bot = 0;
  while (bot < h && blackRow(data, w, c, h - 1 - bot)) bot += 1;
  if (top < 8 && bot < 8) {
    skipped += 1;
    continue;
  }
  const innerH = h - top - bot;
  if (innerH < 40) {
    console.log('skip thin', name, top, bot);
    skipped += 1;
    continue;
  }
  const inner = await sharp(abs).extract({ left: 0, top, width: w, height: innerH }).png().toBuffer();
  const tmp = `${abs}.full.tmp.png`;
  await sharp(inner).resize(348, 348, { fit: 'cover', position: 'centre' }).png().toFile(tmp);
  fs.renameSync(tmp, abs);
  done += 1;
}
console.log('fullbleed', done, 'skipped', skipped);
