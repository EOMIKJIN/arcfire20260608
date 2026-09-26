#!/usr/bin/env node
/**
 * 고유 함장 초상 입고: 생성 PNG → assets/images/npc/<captainId>.png (240×240)
 * + npc_ai_captains.csv portraitImageAssetKey 교체.
 * 보존 파일(스텔라·noname·bar_att)은 건드리지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SIZE = 240;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const destDir = path.join(root, 'assets/images/npc');
const csvPath = path.join(root, 'tables/content/npc_ai_captains.csv');
const cursorAssets = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/d-arcfire20260607/assets',
);

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

const PHASE1_IDS = [
  'npc_cpt_mireille',
  'npc_cpt_orin',
  'npc_cpt_sela',
  'npc_cpt_jex',
  'npc_cpt_vega_watch_01',
  'npc_cpt_solar_guard_01',
  'npc_cpt_arcadia_lane_01',
  'npc_cpt_bar_ret_01',
  'npc_cpt_bar_ret_02',
  'npc_cpt_gov_minerva',
  'npc_cpt_story_noah_frick',
  'npc_cpt_story_ian_koval',
  'npc_cpt_story_darel_sosa',
];

async function ingestOne(id, srcDir) {
  const file = `${id}.png`;
  if (KEEP.has(file)) throw new Error(`refusing to overwrite keep file ${file}`);
  const src = path.join(srcDir, file);
  if (!fs.existsSync(src)) throw new Error(`missing source ${src}`);
  const dest = path.join(destDir, file);
  await sharp(src)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(dest);
  return dest;
}

function patchCsv(ids) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const want = new Set(ids);
  let changed = 0;
  const out = lines.map((line) => {
    const id = line.split(',', 1)[0];
    if (!want.has(id)) return line;
    const next = `assets/images/npc/${id}.png`;
    const patched = line.replace(/assets\/images\/npc\/[^,]+\.png/, next);
    if (patched !== line) changed += 1;
    return patched;
  });
  fs.writeFileSync(csvPath, out.join(nl));
  return changed;
}

function listIdsFromDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^(npc_cpt_|Player_pilot).*\.png$/i.test(f))
    .map((f) => f.replace(/\.png$/i, ''));
}

const srcDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : cursorAssets;
const idsArg = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const auto = process.argv.includes('--auto') || idsArg.length === 0;
const target = auto && idsArg.length === 0 ? listIdsFromDir(srcDir) : idsArg.length ? idsArg : PHASE1_IDS;

let ok = 0;
let skip = 0;
for (const id of target) {
  try {
    const dest = await ingestOne(id, srcDir);
    console.log(`ingested ${id} -> ${path.relative(root, dest)}`);
    ok += 1;
  } catch (err) {
    skip += 1;
    console.warn(`skip ${id}: ${err.message}`);
  }
}
const n = patchCsv(target);
console.log(`ingested_ok=${ok} skip=${skip} csv_keys_updated=${n}`);
process.exit(0);
