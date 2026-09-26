#!/usr/bin/env node
/**
 * Flag captain portraits whose background looks like a bar / neon lounge.
 * KEEP bar_att_* are listed but not "captain-bar" (allowed).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'assets/images/npc');

const KEEP_BAR = new Set(
  Array.from({ length: 11 }, (_, i) => `bar_att_char${String(i + 6).padStart(3, '0')}.png`),
);
/** 바 주인 — 행성 고유 라운지 허용 (2026-09-26 · 대표님) */
const ALLOW_BAR_OWNER = new Set(
  Array.from({ length: 18 }, (_, i) => `npc_cpt_bar_ret_${String(i + 1).padStart(2, '0')}.png`),
);

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
const rows = [];

for (const file of files) {
  const { data, info } = await sharp(path.join(dir, file))
    .resize(80, 80, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let neon = 0;
  let warmDark = 0;
  let edgeNeon = 0;
  let glassLike = 0;
  let n = 0;
  let edgeN = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { h, s, v } = rgbToHsv(r, g, b);
      n += 1;
      const isEdge = x < 12 || x > 67 || y < 8 || y > 68;
      if (isEdge) edgeN += 1;
      const magenta = s > 0.35 && v > 0.35 && ((h >= 270 && h <= 330) || (h >= 300 && h <= 340));
      const cyan = s > 0.35 && v > 0.4 && h >= 170 && h <= 210;
      if (magenta || cyan) {
        neon += 1;
        if (isEdge) edgeNeon += 1;
      }
      if (v < 0.45 && s > 0.25 && (h < 40 || h > 330)) warmDark += 1;
      if (y > 52 && v > 0.75 && s < 0.25 && r > 180 && g > 180 && b > 180) glassLike += 1;
    }
  }

  const neonR = neon / n;
  const edgeNeonR = edgeN ? edgeNeon / edgeN : 0;
  const warmR = warmDark / n;
  const glassR = glassLike / n;
  const score = neonR * 4 + edgeNeonR * 3 + warmR * 1.2 + glassR * 8;
  const keepBar = KEEP_BAR.has(file);
  const allowOwner = ALLOW_BAR_OWNER.has(file);
  const flag = !keepBar && !allowOwner && (score >= 0.18 || neonR >= 0.04 || glassR >= 0.012 || edgeNeonR >= 0.08);

  rows.push({
    file,
    keepBar,
    flag,
    score: Number(score.toFixed(3)),
    neonR: Number(neonR.toFixed(3)),
    edgeNeonR: Number(edgeNeonR.toFixed(3)),
    warmR: Number(warmR.toFixed(3)),
    glassR: Number(glassR.toFixed(3)),
  });
}

rows.sort((a, b) => b.score - a.score);
const flagged = rows.filter((r) => r.flag);
const keepBarHits = rows.filter((r) => r.keepBar);

const out = {
  scanned: rows.length,
  flagged: flagged.length,
  flaggedFiles: flagged.map((r) => r.file),
  keepBar: keepBarHits.map((r) => r.file),
  top: rows.slice(0, 60),
};
const dest = path.join(root, 'tools/content-tables/_bar-background-flags.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`scanned=${rows.length} flagged=${flagged.length}`);
for (const r of flagged) {
  console.log(`FLAG ${r.file} score=${r.score} neon=${r.neonR} edge=${r.edgeNeonR} glass=${r.glassR}`);
}
process.exit(0);
