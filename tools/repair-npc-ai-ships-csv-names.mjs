/**
 * npc_ai_ships.csv name 컬럼 — 생성본(csvNpcCapitalShips.ts) 기준 한글 복구 + UTF-8 BOM
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CSV_PATH = resolve(ROOT, 'tables/content/npc_ai_ships.csv');
const TS_PATH = resolve(ROOT, 'src/data/generated/csvNpcCapitalShips.ts');
const UTF8_BOM = '\uFEFF';

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

function stringifyCsv(rows) {
  return rows
    .map((cols) =>
      cols
        .map((v) => {
          const s = String(v ?? '');
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(','),
    )
    .join('\n');
}

const ts = readFileSync(TS_PATH, 'utf8');
const nameById = new Map();

for (const m of ts.matchAll(/id: "([^"]+)",\s*\n\s*name: "([^"]+)"/g)) {
  nameById.set(m[1], m[2]);
}
for (const m of ts.matchAll(/"([^"]+)": \{\s*\n\s*id: "[^"]+",\s*\n\s*displayName: "([^"]+)"/g)) {
  if (!nameById.has(m[1])) nameById.set(m[1], m[2]);
}

const raw = readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);
const header = rows[0];
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('name');
let fixed = 0;

for (let r = 1; r < rows.length; r += 1) {
  const id = rows[r][idIdx];
  const good = nameById.get(id);
  if (!good) continue;
  if (rows[r][nameIdx] !== good) {
    rows[r][nameIdx] = good;
    fixed += 1;
  }
}

writeFileSync(CSV_PATH, UTF8_BOM + `${stringifyCsv(rows)}\n`, 'utf8');
console.log(`[repair-npc-ai-ships-csv-names] fixed=${fixed} rows, map=${nameById.size}`);
