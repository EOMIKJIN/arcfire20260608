import sharp from 'sharp';

const portrait = 'D:/arcfire20260607/assets/images/ship/npc_enemy_arcadia_01.png';
const cut = 'D:/arcfire20260607/tools/debug/_enemy_cutouts/npc_enemy_arcadia_01.png';
const out = 'D:/arcfire20260607/tools/debug/_preview_red_gradient.png';

const base = await sharp(portrait).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const ship = await sharp(cut).resize(348, 348, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
const w = base.info.width;
const h = base.info.height;
const mask = Buffer.alloc(w * h);
let cores = 0;
for (let p = 0, i = 0; p < w * h; p += 1, i += 4) {
  const r = base.data[i];
  const g = base.data[i + 1];
  const b = base.data[i + 2];
  const shipA = ship[i + 3];
  if (shipA > 48) continue;
  if (r > 220 && g < 80 && b < 55 && r > g + 120) {
    mask[p] = 255;
    cores += 1;
  }
}
const blurred = await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
  .blur(9)
  .raw()
  .toBuffer();
const outPx = Buffer.from(base.data);
const RED = [255, 42, 16];
const MAX = 0.14;
for (let p = 0, i = 0; p < w * h; p += 1, i += 4) {
  if (ship[i + 3] > 48) continue;
  const t = (blurred[p] / 255) * MAX;
  if (t < 0.012) continue;
  const r = outPx[i];
  const g = outPx[i + 1];
  const b = outPx[i + 2];
  outPx[i] = Math.min(255, r * (1 - t) + (r * 0.3 + RED[0] * 0.7) * t);
  outPx[i + 1] = Math.min(255, g * (1 - t) + (g * 0.45 + RED[1] * 0.55) * t);
  outPx[i + 2] = Math.min(255, b * (1 - t) + (b * 0.45 + RED[2] * 0.55) * t);
}
await sharp(outPx, { raw: { width: w, height: h, channels: 4 } }).png().toFile(out);
console.log('cores', cores, 'wrote', out);
