import sharp from 'sharp';

const src = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets/Player_dreadnought_mk1.jpg';
const outDir = 'D:/arcfire20260607/tools/debug';

async function contentOf(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;
  const black = (y) => {
    let n = 0;
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * c;
      if (data[i] < 14 && data[i + 1] < 14 && data[i + 2] < 14) n += 1;
    }
    return n / w > 0.9;
  };
  let top = 0;
  while (top < h && black(top)) top += 1;
  let bot = 0;
  while (bot < h && black(h - 1 - bot)) bot += 1;
  const inner = await sharp(file).extract({ left: 0, top, width: w, height: h - top - bot }).png().toBuffer();
  return inner;
}

const inner = await contentOf(src);
const fitted = await sharp(inner).resize(348, 348, { fit: 'inside' }).png().toBuffer();
const fm = await sharp(fitted).metadata();
const top = Math.floor((348 - fm.height) / 2);

const blurBg = await sharp(inner).resize(348, 348, { fit: 'fill' }).blur(12).png().toBuffer();
await sharp(blurBg).composite([{ input: fitted, top, left: 0 }]).png().toFile(`${outDir}/_preview_fit_blur.png`);

const ceilH = Math.max(24, Math.round(fm.height * 0.22));
const floorH = ceilH;
const ceil = await sharp(fitted).extract({ left: 0, top: 0, width: 348, height: ceilH }).resize(348, top, { fit: 'fill' }).blur(1.2).png().toBuffer();
const bot = 348 - top - fm.height;
const floor = await sharp(fitted)
  .extract({ left: 0, top: fm.height - floorH, width: 348, height: floorH })
  .resize(348, bot, { fit: 'fill' })
  .blur(1.2)
  .png()
  .toBuffer();
await sharp({
  create: { width: 348, height: 348, channels: 3, background: '#111' },
})
  .composite([
    { input: ceil, top: 0, left: 0 },
    { input: floor, top: top + fm.height, left: 0 },
    { input: fitted, top, left: 0 },
  ])
  .png()
  .toFile(`${outDir}/_preview_fit_extend.png`);

console.log('fitted', fm.width, fm.height, 'pad', top, bot);
