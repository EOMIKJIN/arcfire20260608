#!/usr/bin/env node
/**
 * npc_ai_captains.csv portraitImageAssetKey ↔ npcCaptainPortraitAssets 맵 ↔ assets/images/npc
 * CSV에 키가 있는데 맵/파일이 없으면 exit 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const csvPath = path.join(root, 'tables/content/npc_ai_captains.csv');
const mapPath = path.join(root, 'src/game/npcCaptainPortraitAssets.ts');
const dirPath = path.join(root, 'assets/images/npc');

function parseCsvPortraitKeys(raw) {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return { keys: [], emptyRows: 0, totalRows: 0 };
  const header = lines[0].split(',');
  const idx = header.indexOf('portraitImageAssetKey');
  if (idx < 0) throw new Error('portraitImageAssetKey column missing');
  const keys = [];
  let emptyRows = 0;
  let totalRows = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < header.length && !cols.some((c) => c.trim())) continue;
    totalRows += 1;
    const v = (cols[idx] ?? '').trim();
    if (!v) emptyRows += 1;
    else keys.push(v);
  }
  return { keys, emptyRows, totalRows };
}

/** minimal CSV split (no multiline fields in this table) */
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseMapKeys(src) {
  const keys = new Set();
  const re = /['"](assets\/images\/[^'"]+\.(?:png|webp|jpg))['"]\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

function listPngFiles(dir) {
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => /\.(png|webp|jpg)$/i.test(f))
      .map((f) => `assets/images/npc/${f}`),
  );
}

/** PNG IHDR — 범용 초상 규격 240×240 (`noname_char007` 정본) */
const CANONICAL_W = 240;
const CANONICAL_H = 240;

function readPngSize(absPath) {
  const buf = fs.readFileSync(absPath);
  if (buf.length < 24) return null;
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const csv = parseCsvPortraitKeys(fs.readFileSync(csvPath, 'utf8'));
const mapKeys = parseMapKeys(fs.readFileSync(mapPath, 'utf8'));
const files = listPngFiles(dirPath);
const csvUnique = [...new Set(csv.keys)];

const csvNotInMap = csvUnique.filter((k) => !mapKeys.has(k));
const csvNotInFile = csvUnique.filter((k) => {
  const base = k.replace(/^assets\/images\/npc\//, '');
  return !files.has(`assets/images/npc/${base}`) && !files.has(k);
});
const mapNotInFile = [...mapKeys].filter((k) => {
  if (!k.includes('/npc/')) return false;
  const base = path.basename(k);
  return !fs.existsSync(path.join(dirPath, base));
});
const fileNotInMap = [...files].filter((k) => !mapKeys.has(k));

const sizeMismatches = [];
for (const rel of files) {
  const base = path.basename(rel);
  const abs = path.join(dirPath, base);
  if (!/\.png$/i.test(base)) continue;
  const size = readPngSize(abs);
  if (!size) {
    sizeMismatches.push(`${rel} (unreadable)`);
    continue;
  }
  if (size.width !== CANONICAL_W || size.height !== CANONICAL_H) {
    sizeMismatches.push(`${rel} ${size.width}x${size.height} (want ${CANONICAL_W}x${CANONICAL_H})`);
  }
}

console.log('# audit:npc-captain-portraits');
console.log(`captain_rows=${csv.totalRows} csv_empty=${csv.emptyRows} csv_keyed=${csv.keys.length} unique_keys=${csvUnique.length}`);
console.log(`map_keys=${mapKeys.size} npc_files=${files.size}`);
console.log(`canonical_px=${CANONICAL_W}x${CANONICAL_H} (noname_char007)`);
console.log(`csv_not_in_map=${csvNotInMap.length}`);
csvNotInMap.slice(0, 20).forEach((k) => console.log(`  - ${k}`));
console.log(`csv_not_in_file=${csvNotInFile.length}`);
csvNotInFile.slice(0, 20).forEach((k) => console.log(`  - ${k}`));
console.log(`map_npc_not_in_file=${mapNotInFile.length}`);
mapNotInFile.forEach((k) => console.log(`  - ${k}`));
console.log(`file_not_in_map=${fileNotInMap.length}`);
fileNotInMap.forEach((k) => console.log(`  - ${k}`));
console.log(`size_mismatch=${sizeMismatches.length}`);
sizeMismatches.forEach((k) => console.log(`  - ${k}`));

const hardFail =
  csvNotInMap.length > 0 ||
  csvNotInFile.length > 0 ||
  mapNotInFile.length > 0 ||
  sizeMismatches.length > 0;
if (hardFail) {
  console.log('RESULT=FAIL');
  process.exit(1);
}
console.log('RESULT=PASS');
process.exit(0);
