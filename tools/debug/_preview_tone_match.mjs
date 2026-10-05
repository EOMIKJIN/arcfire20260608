import sharp from 'sharp';

const hangarSrc = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets/crimson_hangar_clean.jpg';
const cut = 'D:/arcfire20260607/tools/debug/_enemy_cutouts/npc_enemy_arcadia_01.png';
const out = 'D:/arcfire20260607/tools/debug/_preview_tone_match.png';

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
  return sharp({ create: { width: 348, height: 348, channels: 3, background: { r: 16, g: 17, b: 18 } } })
    .composite([
      { input: ceil, top: 0, left },
      { input: floor, top: 348 - (padBot + band), left },
      { input: mid, top: padTop + band, left },
    ])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function tone(data, targetMean, targetSd, satBoost) {
  const n = data.length / 4;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  }
  const mean = sum / n;
  let sum2 = 0;
  const lums = new Float32Array(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    lums[p] = lum;
    sum2 += (lum - mean) * (lum - mean);
  }
  const sd = Math.sqrt(sum2 / n) || 1;
  const scale = targetSd / sd;
  const out = Buffer.alloc(n * 3);
  for (let i = 0, p = 0, o = 0; i < data.length; i += 4, p += 1, o += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = lums[p];
    const mapped = (lum - mean) * scale + targetMean;
    const gain = lum > 1 ? mapped / lum : 1;
    let nr = r * gain;
    let ng = g * gain;
    let nb = b * gain;
    const ml = nr * 0.2126 + ng * 0.7152 + nb * 0.0722;
    nr = ml + (nr - ml) * satBoost;
    ng = ml + (ng - ml) * satBoost;
    nb = ml + (nb - ml) * satBoost;
    out[o] = Math.max(0, Math.min(255, nr));
    out[o + 1] = Math.max(0, Math.min(255, ng));
    out[o + 2] = Math.max(0, Math.min(255, nb));
  }
  return out;
}

function steelPartialRed(data) {
  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = r * 0.45 + g * 0.45 + b * 0.1;
    const redness = r - Math.max(g, b);
    const lamp = redness > 90 && r > 188 && g < 95 ? Math.min(1, (r - 188) / 40) : 0;
    let nr;
    let ng;
    let nb;
    if (lamp > 0.35) {
      nr = Math.min(255, 210 + (r - 188) * 0.7);
      ng = 48 + g * 0.15;
      nb = 42 + b * 0.12;
    } else if (lum < 42) {
      nr = lum * 0.96;
      ng = lum * 0.98;
      nb = lum * 1.02;
    } else {
      nr = lum * 1.06;
      ng = lum * 0.9;
      nb = lum * 0.84;
    }
    out[i] = Math.max(0, Math.min(255, nr));
    out[i + 1] = Math.max(0, Math.min(255, ng));
    out[i + 2] = Math.max(0, Math.min(255, nb));
    out[i + 3] = 255;
  }
  return out;
}

async function report(buf, w, h, channels, label) {
  let n = 0;
  let sum = 0;
  let sum2 = 0;
  let sat = 0;
  const step = channels;
  for (let i = 0; i < buf.length; i += step) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    sum += lum;
    sum2 += lum * lum;
    sat += (mx - mn) / (mx + 1);
    n += 1;
  }
  const mean = sum / n;
  const sd = Math.sqrt(sum2 / n - mean * mean);
  console.log(label, 'mean', mean.toFixed(1), 'sd', sd.toFixed(1), 'sat', (sat / n).toFixed(3));
}

const stacked = await stackExtend(hangarSrc);
const steel = steelPartialRed(stacked.data);
const matched = tone(await sharp(steel, { raw: { width: 348, height: 348, channels: 4 } }).ensureAlpha().raw().toBuffer(), 49, 33, 1.9);
const hangar = await sharp(matched, { raw: { width: 348, height: 348, channels: 3 } }).png().toBuffer();
const ship = await sharp(cut).resize(348, 348, { fit: 'fill' }).png().toBuffer();
const combo = await sharp(hangar).composite([{ input: ship, blend: 'over' }]).png().toBuffer();
await sharp(combo).toFile(out);
const comboRaw = await sharp(combo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
await report(comboRaw.data, 348, 348, 4, 'combo');
await report(matched, 348, 348, 3, 'hangar');
console.log('wrote', out);
