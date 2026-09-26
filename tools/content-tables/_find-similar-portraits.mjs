#!/usr/bin/env node
/**
 * Face-crop dHash clusters for unique NPC portraits.
 * KEEP files are compared (to catch clones) but listed as keep=true.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'assets/images/npc');
const KEEP = new Set([
  'stella_aris_char001.png',
  'mia_bello_char002.png',
  'noname_char003.png',
  'noname_char004.png',
  'noname_char005.png',
  'noname_char006.png',
  'noname_char007.png',
  'noname_char008.png',
  'noname_char009.png',
  'noname_char010.png',
  'bar_att_char006.png',
  'bar_att_char007.png',
  'bar_att_char008.png',
  'bar_att_char009.png',
  'bar_att_char010.png',
  'bar_att_char011.png',
  'bar_att_char012.png',
  'bar_att_char013.png',
  'bar_att_char014.png',
  'bar_att_char015.png',
  'bar_att_char016.png',
]);

const HASH_W = 9;
const HASH_H = 8;
const FACE_LEFT = 0.22;
const FACE_TOP = 0.06;
const FACE_W = 0.56;
const FACE_H = 0.42;
const PAIR_MAX = 14;
const CLUSTER_LINK = 12;

function dHashBits(gray) {
  const bits = [];
  for (let y = 0; y < HASH_H; y++) {
    for (let x = 0; x < HASH_W - 1; x++) {
      const a = gray[y * HASH_W + x];
      const b = gray[y * HASH_W + x + 1];
      bits.push(a > b ? 1 : 0);
    }
  }
  return bits;
}

function hamming(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n += 1;
  return n;
}

function meanHueSat(pixels, w, h) {
  let hSum = 0;
  let sSum = 0;
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 3] / 255;
    const g = pixels[i * 3 + 1] / 255;
    const b = pixels[i * 3 + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let hDeg = 0;
    if (d !== 0) {
      if (max === r) hDeg = 60 * (((g - b) / d) % 6);
      else if (max === g) hDeg = 60 * ((b - r) / d + 2);
      else hDeg = 60 * ((r - g) / d + 4);
    }
    if (hDeg < 0) hDeg += 360;
    const s = max === 0 ? 0 : d / max;
    hSum += hDeg;
    sSum += s;
    n += 1;
  }
  return { hue: hSum / n, sat: sSum / n };
}

async function hashFile(file) {
  const full = path.join(dir, file);
  const meta = await sharp(full).metadata();
  const w = meta.width || 240;
  const h = meta.height || 240;
  const left = Math.max(0, Math.round(w * FACE_LEFT));
  const top = Math.max(0, Math.round(h * FACE_TOP));
  const cw = Math.max(8, Math.round(w * FACE_W));
  const ch = Math.max(8, Math.round(h * FACE_H));
  const gray = await sharp(full)
    .extract({ left, top, width: Math.min(cw, w - left), height: Math.min(ch, h - top) })
    .resize(HASH_W, HASH_H, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  const color = await sharp(full)
    .extract({ left, top, width: Math.min(cw, w - left), height: Math.min(ch, h - top) })
    .resize(16, 16, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();
  const hs = meanHueSat(color, 16, 16);
  return { file, keep: KEEP.has(file), bits: dHashBits(gray), hue: hs.hue, sat: hs.sat };
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.png') && !f.includes('sample'))
  .filter((f) => /^(npc_cpt_|Player_pilot|stella_aris|noname_char|bar_att_|mia_bello)/.test(f));

const rows = [];
for (const f of files) {
  try {
    rows.push(await hashFile(f));
  } catch (err) {
    console.warn(`skip ${f}: ${err.message}`);
  }
}

const pairs = [];
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const d = hamming(rows[i].bits, rows[j].bits);
    const hueDelta = Math.min(
      Math.abs(rows[i].hue - rows[j].hue),
      360 - Math.abs(rows[i].hue - rows[j].hue),
    );
    if (d <= PAIR_MAX && hueDelta < 55) {
      pairs.push({
        a: rows[i].file,
        b: rows[j].file,
        d,
        hueDelta: Math.round(hueDelta),
        aKeep: rows[i].keep,
        bKeep: rows[j].keep,
      });
    }
  }
}
pairs.sort((x, y) => x.d - y.d || x.hueDelta - y.hueDelta);

const parent = new Map();
function find(x) {
  if (!parent.has(x)) parent.set(x, x);
  const p = parent.get(x);
  if (p !== x) {
    const r = find(p);
    parent.set(x, r);
    return r;
  }
  return p;
}
function union(a, b) {
  const ra = find(a);
  const rb = find(b);
  if (ra !== rb) parent.set(ra, rb);
}

for (const p of pairs) {
  if (p.d <= CLUSTER_LINK) union(p.a, p.b);
}

const clusters = new Map();
for (const p of pairs) {
  if (p.d > CLUSTER_LINK) continue;
  const rootId = find(p.a);
  if (!clusters.has(rootId)) clusters.set(rootId, new Set());
  clusters.get(rootId).add(p.a);
  clusters.get(rootId).add(p.b);
}

const clusterList = [...clusters.values()]
  .map((s) => [...s].sort())
  .filter((c) => c.length >= 2)
  .sort((a, b) => b.length - a.length);

const out = {
  compared: rows.length,
  pairThreshold: PAIR_MAX,
  clusterLink: CLUSTER_LINK,
  pairCount: pairs.length,
  topPairs: pairs.slice(0, 80),
  clusters: clusterList,
};
const dest = path.join(root, 'tools/content-tables/_similar-portrait-clusters.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`compared=${rows.length} pairs=${pairs.length} clusters=${clusterList.length}`);
for (const c of clusterList.slice(0, 25)) {
  console.log(`[${c.length}] ${c.join(' | ')}`);
}
console.log(`wrote ${dest}`);
process.exit(0);
