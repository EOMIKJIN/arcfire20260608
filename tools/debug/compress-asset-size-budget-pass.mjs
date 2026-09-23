/**
 * One-shot: compress install-size FAIL assets toward asset_size_budget_policy caps.
 * Run: node tools/debug/compress-asset-size-budget-pass.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const JOBS = [
  { dir: 'assets/images/npc', filter: (f) => f.endsWith('.png'), maxEdge: 240, hardCapKb: 148 },
  { dir: 'assets/images/ship', filter: (f) => f.endsWith('.png'), maxEdge: 512, hardCapKb: 195 },
  {
    dir: 'assets/images/planet',
    filter: (f) => /^pip_00[23]\.png$/i.test(f),
    maxEdge: 640,
    hardCapKb: 390,
  },
  { dir: 'assets/images/nebula/baked', filter: (f) => f.endsWith('.png'), maxEdge: 768, hardCapKb: 580 },
];

async function compressToCap(file, maxEdge, hardCapKb) {
  const beforeKb = fs.statSync(file).size / 1024;
  const meta = await sharp(file).metadata();
  const edge = Math.max(meta.width || 0, meta.height || 0);
  if (beforeKb <= hardCapKb && edge <= maxEdge) {
    return { file, skipped: true, beforeKb, afterKb: beforeKb };
  }

  let w = Math.min(maxEdge, edge || maxEdge);
  let last = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const usePalette = attempt >= 3;
    const tmp = `${file}.tmp.png`;
    await sharp(file)
      .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, effort: 10, palette: usePalette })
      .toFile(tmp);
    const afterKb = fs.statSync(tmp).size / 1024;
    const m2 = await sharp(tmp).metadata();
    last = {
      afterKb,
      w,
      palette: usePalette,
      dim: `${m2.width}x${m2.height}`,
    };
    if (afterKb <= hardCapKb) {
      fs.renameSync(tmp, file);
      return { file, skipped: false, beforeKb, ...last };
    }
    fs.unlinkSync(tmp);
    w = Math.max(128, Math.floor(w * 0.88));
  }

  const tmp = `${file}.tmp.png`;
  await sharp(file)
    .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10, palette: true })
    .toFile(tmp);
  const afterKb = fs.statSync(tmp).size / 1024;
  const m2 = await sharp(tmp).metadata();
  fs.renameSync(tmp, file);
  return {
    file,
    skipped: false,
    beforeKb,
    afterKb,
    w,
    palette: true,
    dim: `${m2.width}x${m2.height}`,
    warn: afterKb > hardCapKb,
  };
}

const results = [];
for (const job of JOBS) {
  const abs = path.join(ROOT, job.dir);
  if (!fs.existsSync(abs)) continue;
  const files = fs
    .readdirSync(abs)
    .filter(job.filter)
    .map((f) => path.join(abs, f));
  for (const f of files) {
    const r = await compressToCap(f, job.maxEdge, job.hardCapKb);
    results.push(r);
    const name = path.relative(ROOT, f).replace(/\\/g, '/');
    if (r.skipped) {
      console.log(`SKIP ${name} ${Math.round(r.beforeKb)}KB`);
    } else {
      console.log(
        `${r.warn ? 'WARN' : 'OK  '} ${name} ${Math.round(r.beforeKb)}->${Math.round(r.afterKb)}KB ${r.dim} edge${r.w}${r.palette ? ' pal' : ''}`,
      );
    }
  }
}

const touched = results.filter((r) => !r.skipped);
const still = results.filter((r) => r.warn);
console.log(`--- touched=${touched.length} stillOver=${still.length}`);
if (still.length) process.exitCode = 2;
