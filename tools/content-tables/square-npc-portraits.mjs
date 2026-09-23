#!/usr/bin/env node
/**
 * assets/images/npc 직사각 PNG → 정본 240×240.
 * 원본 캐릭터는 1:1 중앙 유지(크롭·복제 없음).
 * 좌우 여백은 모서리 배경색 세로 그라데이션으로만 채운다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SIZE = 240;
const CORNER = 16;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'assets/images/npc');

function rgbCss(c) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function gradientSvg(width, height, topRgb, bottomRgb) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${rgbCss(topRgb)}"/>
      <stop offset="1" stop-color="${rgbCss(bottomRgb)}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`,
  );
}

async function sampleCorners(pngBuf, w, h) {
  const { data, info } = await sharp(pngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sw = info.width;
  const sample = (x0, y0) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = y0; y < y0 + CORNER; y += 1) {
      for (let x = x0; x < x0 + CORNER; x += 1) {
        const i = (y * sw + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  };
  return {
    tl: sample(0, 0),
    tr: sample(w - CORNER, 0),
    bl: sample(0, h - CORNER),
    br: sample(w - CORNER, h - CORNER),
  };
}

async function squareOne(absPath) {
  const meta = await sharp(absPath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error(`unreadable ${absPath}`);
  if (w === SIZE && h === SIZE) return 'skip';

  let orig = await sharp(absPath).ensureAlpha().png().toBuffer();
  let fw = w;
  let fh = h;
  if (w > SIZE || h > SIZE) {
    orig = await sharp(orig)
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const fitted = await sharp(orig).metadata();
    fw = fitted.width ?? SIZE;
    fh = fitted.height ?? SIZE;
  }

  const left = Math.max(0, Math.floor((SIZE - fw) / 2));
  const top = Math.max(0, Math.floor((SIZE - fh) / 2));
  const corners = await sampleCorners(orig, fw, fh);

  const canvas = sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: corners.tl[0], g: corners.tl[1], b: corners.tl[2], alpha: 255 },
    },
  });

  const composites = [];
  if (left > 0) {
    composites.push({
      input: gradientSvg(left, SIZE, corners.tl, corners.bl),
      left: 0,
      top: 0,
    });
  }
  const right = SIZE - fw - left;
  if (right > 0) {
    composites.push({
      input: gradientSvg(right, SIZE, corners.tr, corners.br),
      left: left + fw,
      top: 0,
    });
  }
  const bottom = SIZE - fh - top;
  if (top > 0) {
    composites.push({
      input: gradientSvg(SIZE, top, corners.tl, corners.tr),
      left: 0,
      top: 0,
    });
  }
  if (bottom > 0) {
    composites.push({
      input: gradientSvg(SIZE, bottom, corners.bl, corners.br),
      left: 0,
      top: top + fh,
    });
  }
  composites.push({ input: orig, left, top });

  const tmp = `${absPath}.sqtmp.png`;
  await canvas.composite(composites).png().toFile(tmp);
  fs.renameSync(tmp, absPath);
  return `${w}x${h}->${SIZE}x${SIZE}`;
}

const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort();
let changed = 0;
for (const f of files) {
  const abs = path.join(dir, f);
  const result = await squareOne(abs);
  console.log(`${f.padEnd(28)} ${result}`);
  if (result !== 'skip') changed += 1;
}
console.log(`done changed=${changed} total=${files.length} canonical=${SIZE}x${SIZE}`);
