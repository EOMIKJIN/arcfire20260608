import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = 'D:/arcfire20260607';
const jpgDir = 'C:/Users/eomsp/.cursor/projects/d-arcfire20260607/assets';
const shipDir = path.join(root, 'assets/images/ship');
const skip = new Set([
  'npc_wave_invader_basic.png',
  'trade_ship_100.png',
  'ship_002.png',
  'ship_100.png',
  'ship_200.png',
]);

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
  const innerH = h - top - bot;
  if (innerH < 40) throw new Error(`thin ${file}`);
  const inner = await sharp(file).extract({ left: 0, top, width: w, height: innerH }).png().toBuffer();
  const fitted = await sharp(inner).resize(348, 348, { fit: 'inside' }).png().toBuffer();
  const fm = await sharp(fitted).metadata();
  const padTop = Math.floor((348 - fm.height) / 2);
  const padBot = 348 - fm.height - padTop;
  if (padTop < 4 && padBot < 4) {
    return sharp(fitted).resize(348, 348, { fit: 'fill' }).png().toBuffer();
  }
  const band = Math.min(64, Math.max(28, Math.floor(fm.height * 0.22)));
  const ceil = await sharp(fitted)
    .extract({ left: 0, top: 0, width: fm.width, height: band })
    .resize(348, padTop + band, { fit: 'fill' })
    .png()
    .toBuffer();
  const floor = await sharp(fitted)
    .extract({ left: 0, top: fm.height - band, width: fm.width, height: band })
    .resize(348, padBot + band, { fit: 'fill' })
    .png()
    .toBuffer();
  const mid = await sharp(fitted)
    .extract({ left: 0, top: band, width: fm.width, height: fm.height - band * 2 })
    .png()
    .toBuffer();
  const left = Math.floor((348 - fm.width) / 2);
  return sharp({
    create: { width: 348, height: 348, channels: 3, background: { r: 12, g: 12, b: 14 } },
  })
    .composite([
      { input: ceil, top: 0, left },
      { input: floor, top: 348 - (padBot + band), left },
      { input: mid, top: padTop + band, left },
    ])
    .png()
    .toBuffer();
}

function gitPng(name) {
  const rel = `assets/images/ship/${name}`;
  const buf = execFileSync('git', ['show', `HEAD:${rel}`], { cwd: root });
  return buf;
}

const sourceFor = {
  'npc_vega_red_5.png': 'npc_vega_red_4.jpg',
  'npc_red_fleet_3.png': 'npc_red_fleet_1.jpg',
};

let done = 0;
let missing = [];
for (const name of fs.readdirSync(shipDir)) {
  if (!name.endsWith('.png') || skip.has(name) || name.startsWith('ship_top_')) continue;
  const dest = path.join(shipDir, name);
  const jpgName = sourceFor[name] ?? name.replace(/\.png$/, '.jpg');
  const jpg = path.join(jpgDir, jpgName);
  let srcBuf = null;
  let label = jpgName;
  if (fs.existsSync(jpg)) {
    srcBuf = await stackExtend(jpg);
  } else if (name === 'ship_001.png' || name === 'npc_test_ship_001.png') {
    const tmp = path.join(root, 'tools/debug/_git_src.png');
    fs.writeFileSync(tmp, gitPng(name));
    srcBuf = await stackExtend(tmp);
    label = `git:${name}`;
  } else {
    missing.push(name);
    continue;
  }
  const tmpOut = `${dest}.full.tmp.png`;
  await sharp(srcBuf).png().toFile(tmpOut);
  fs.renameSync(tmpOut, dest);
  done += 1;
  if (done % 25 === 0) console.log('stacked', done, label);
}
console.log('stacked', done, 'no_source', missing.join(','));
