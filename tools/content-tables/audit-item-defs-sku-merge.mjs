#!/usr/bin/env node
/**
 * 상점 SKU merge 계약 감사 — generated weapon/ship × item_defs
 * PASS: tradePortListed 무기·전함이 weapon_item_* / capital_ship_* 로 존재
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** generated Record/array 블록에서 tradePortListed:true 인 id 추출 */
function collectListedIds(src, idKeyPattern) {
  const ids = [];
  // "id": { ... tradePortListed: true ... }  — 중괄호 균형으로 블록 분리
  const startRe = new RegExp(idKeyPattern, 'g');
  let m;
  while ((m = startRe.exec(src)) !== null) {
    const id = m[1];
    let depth = 0;
    let i = m.index + m[0].length - 1;
    // find opening {
    while (i < src.length && src[i] !== '{') i += 1;
    if (src[i] !== '{') continue;
    const start = i;
    for (; i < src.length; i += 1) {
      const c = src[i];
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) {
          const block = src.slice(start, i + 1);
          if (/tradePortListed:\s*true/.test(block)) ids.push(id);
          break;
        }
      }
    }
  }
  return ids;
}

function loadEditableMergeSkuWarns() {
  const full = resolve(ROOT, 'tables/content/item_defs.csv');
  if (!existsSync(full)) return [];
  const rows = parseCsv(readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const idIdx = header.indexOf('id');
  if (idIdx < 0) return [];
  const warn = [];
  for (const cols of rows.slice(1)) {
    const id = String(cols[idIdx] ?? '').trim();
    if (id.startsWith('weapon_item_') || id.startsWith('capital_ship_')) {
      warn.push(`editable item_defs.csv has merge SKU (prefer build-only): ${id}`);
    }
  }
  return warn;
}

const weaponsPath = resolve(ROOT, 'src/data/generated/csvWeapons.ts');
const shipsPath = resolve(ROOT, 'src/data/generated/csvNpcCapitalShips.ts');
const itemsPath = resolve(ROOT, 'src/data/generated/csvItemDefs.ts');
for (const p of [weaponsPath, shipsPath, itemsPath]) {
  if (!existsSync(p)) {
    console.error(`FAIL: missing ${p}`);
    process.exit(1);
  }
}

const weaponsSrc = readFileSync(weaponsPath, 'utf8');
const shipsSrc = readFileSync(shipsPath, 'utf8');
const itemsSrc = readFileSync(itemsPath, 'utf8');

const listedWeapons = collectListedIds(weaponsSrc, /"([^"]+)":\s*\{/g);
// ships file has both array objects { id: "x" } and Record — prefer array form `id: "Player_..."`
const listedShips = [];
{
  const re = /id:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(shipsSrc)) !== null) {
    const id = m[1];
    // scan forward ~800 chars for tradePortListed
    const window = shipsSrc.slice(m.index, m.index + 900);
    if (/tradePortListed:\s*true/.test(window) && !listedShips.includes(id)) {
      listedShips.push(id);
    }
  }
}

const fail = [];
for (const wid of listedWeapons) {
  const itemId = `weapon_item_${wid}`;
  if (!itemsSrc.includes(`"${itemId}"`)) fail.push(`missing weapon SKU: ${itemId}`);
}
for (const sid of listedShips) {
  const itemId = `capital_ship_${sid}`;
  if (!itemsSrc.includes(`"${itemId}"`)) fail.push(`missing capital SKU: ${itemId}`);
}

const warn = loadEditableMergeSkuWarns();
console.log('# audit-item-defs-sku-merge');
console.log(`listedWeapons=${listedWeapons.length} listedShips=${listedShips.length}`);
if (warn.length) {
  console.log(`WARN ${warn.length}`);
  warn.slice(0, 20).forEach((w) => console.log(`  - ${w}`));
}
if (fail.length) {
  console.log(`FAIL ${fail.length}`);
  fail.slice(0, 40).forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
