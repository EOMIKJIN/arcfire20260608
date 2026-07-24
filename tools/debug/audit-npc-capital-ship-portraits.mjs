#!/usr/bin/env node
/**
 * npc_ai_ships / capital ship portraitImageAssetKey ↔ npcCapitalShipPortraitAssets ↔ assets/images/ship
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const csvPath = path.join(root, 'tables/content/npc_ai_ships.csv');
const mapPath = path.join(root, 'src/game/npcCapitalShipPortraitAssets.ts');
const dirPath = path.join(root, 'assets/images/ship');

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

function parseCsvKeys(raw) {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split(',');
  const idx = header.indexOf('portraitImageAssetKey');
  if (idx < 0) throw new Error('portraitImageAssetKey column missing in npc_ai_ships.csv');
  const keys = [];
  let empty = 0;
  let total = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (!cols.some((c) => String(c).trim())) continue;
    total += 1;
    const v = (cols[idx] ?? '').trim();
    if (!v) empty += 1;
    else keys.push(v);
  }
  return { keys, empty, total };
}

function parseMapKeys(src) {
  const keys = new Set();
  const re = /['"](assets\/images\/[^'"]+\.(?:png|webp|jpg))['"]\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

const csv = parseCsvKeys(fs.readFileSync(csvPath, 'utf8'));
const mapKeys = parseMapKeys(fs.readFileSync(mapPath, 'utf8'));
const files = fs.existsSync(dirPath)
  ? new Set(
      fs
        .readdirSync(dirPath)
        .filter((f) => /\.(png|webp|jpg)$/i.test(f))
        .map((f) => `assets/images/ship/${f}`),
    )
  : new Set();

const unique = [...new Set(csv.keys)];
const csvNotInMap = unique.filter((k) => !mapKeys.has(k));
const csvNotInFile = unique.filter((k) => {
  const base = path.basename(k);
  return !fs.existsSync(path.join(dirPath, base));
});
const mapNotInFile = [...mapKeys].filter((k) => {
  if (!k.includes('/ship/')) return false;
  return !fs.existsSync(path.join(dirPath, path.basename(k)));
});
const fileNotInMap = [...files].filter((k) => !mapKeys.has(k));

console.log('# audit:npc-capital-ship-portraits');
console.log(`ship_rows=${csv.total} csv_empty=${csv.empty} keyed=${csv.keys.length} unique=${unique.length}`);
console.log(`map_keys=${mapKeys.size} ship_files=${files.size}`);
console.log(`csv_not_in_map=${csvNotInMap.length}`);
csvNotInMap.slice(0, 15).forEach((k) => console.log(`  - ${k}`));
console.log(`csv_not_in_file=${csvNotInFile.length}`);
csvNotInFile.slice(0, 15).forEach((k) => console.log(`  - ${k}`));
console.log(`map_not_in_file=${mapNotInFile.length}`);
mapNotInFile.forEach((k) => console.log(`  - ${k}`));
console.log(`file_not_in_map=${fileNotInMap.length} (info — 맵 미등록 파일은 WARN만, CSV 키가 맵에 없으면 FAIL)`);
fileNotInMap.slice(0, 15).forEach((k) => console.log(`  - ${k}`));

const hardFail = csvNotInMap.length > 0 || csvNotInFile.length > 0 || mapNotInFile.length > 0;
console.log(hardFail ? 'RESULT=FAIL' : 'RESULT=PASS');
process.exit(hardFail ? 1 : 0);
