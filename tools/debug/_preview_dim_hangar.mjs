import sharp from 'sharp';

const hangarSrc = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets/crimson_hangar_clean.jpg';
const cut = 'D:/arcfire20260607/tools/debug/_enemy_cutouts/npc_enemy_arcadia_01.png';
const outDir = 'D:/arcfire20260607/tools/debug';

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

function gradeHangar(data, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0, p = 0; i < w * h * 4; i += 4, p += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = r * 0.45 + g * 0.4 + b * 0.15;
    const steel = Math.min(210, lum * 0.62);
    const redness = r - Math.max(g, b);
    const lamp = redness > 70 && r > 150 ? Math.min(1, (r - 150) / 90) : 0;
    let nr = steel * 0.92 + 10;
    let ng = steel * 0.9 + 8;
    let nb = steel * 0.88 + 10;
    nr = nr * (1 - lamp) + Math.min(255, r * 0.82) * lamp;
    ng = ng * (1 - lamp * 0.35) + g * lamp * 0.25;
    nb = nb * (1 - lamp * 0.45) + b * lamp * 0.2;
    out[p] = Math.max(0, Math.min(255, nr));
    out[p + 1] = Math.max(0, Math.min(255, ng));
    out[p + 2] = Math.max(0, Math.min(255, nb));
  }
  return out;
}

function gradeShip(data, w, h) {
  const out = Buffer.from(data);
  for (let i = 0; i < w * h * 4; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    out[i] = Math.min(255, r * 0.74 + 28);
    out[i + 1] = Math.min(255, g * 0.66 + 12);
    out[i + 2] = Math.min(255, b * 0.6 + 8);
  }
  return out;
}

const plate = await stackExtend(hangarSrc);
const raw = await sharp(plate).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const graded = gradeHangar(raw.data, raw.info.width, raw.info.height);
const hangar = await sharp(graded, { raw: { width: 348, height: 348, channels: 3 } }).png().toBuffer();
await sharp(hangar).png().toFile(`${outDir}/_preview_hangar_dim.png`);

const shipRaw = await sharp(cut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const shipGraded = gradeShip(shipRaw.data, shipRaw.info.width, shipRaw.info.height);
const ship = await sharp(shipGraded, { raw: { width: shipRaw.info.width, height: shipRaw.info.height, channels: 4 } })
  .resize(348, 348, { fit: 'fill' })
  .png()
  .toBuffer();
await sharp(hangar).composite([{ input: ship, blend: 'over' }]).png().toFile(`${outDir}/_preview_dim_combo.png`);
console.log('preview');
