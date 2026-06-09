/**
 * item_defs.csv name·description — csvItemDefs.ts 생성본 기준 한글 복구 + UTF-8 BOM
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CSV_PATH = resolve(ROOT, 'tables/content/item_defs.csv');
const TS_PATH = resolve(ROOT, 'src/data/generated/csvItemDefs.ts');
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

function looksCorrupted(text) {
  if (!text) return false;
  if (text.includes('\uFFFD')) return true;
  if (/\?{2,}/.test(text)) return true;
  if (/[ÃÂÄÅàáâãäåèéêëìíîïðñòóôõöùúûüýÿ]/.test(text)) return true;
  if (/ë|ì|í|î|ï|ê|é|è|ç|ñ|ó|ô|õ|ö|ù|ú|û|ü|ý|ÿ|ą|ę|ł|ń|ś|ź|ż/.test(text)) return true;
  return false;
}

const ts = readFileSync(TS_PATH, 'utf8');
const metaById = new Map();

for (const m of ts.matchAll(
  /"([^"]+)": \{\s*\n\s*id: "[^"]+",\s*\n\s*name: "([^"]*)",\s*\n\s*description: "([^"]*)"/g,
)) {
  metaById.set(m[1], { name: m[2], description: m[3] });
}

const raw = readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);
const header = rows[0];
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('name');
const descIdx = header.indexOf('description');
let fixedName = 0;
let fixedDesc = 0;
let missing = 0;

for (let r = 1; r < rows.length; r += 1) {
  const id = rows[r][idIdx];
  const meta = metaById.get(id);
  if (!meta) {
    missing += 1;
    continue;
  }
  const curName = rows[r][nameIdx] ?? '';
  const curDesc = rows[r][descIdx] ?? '';
  if (curName !== meta.name && (looksCorrupted(curName) || curName !== meta.name)) {
    rows[r][nameIdx] = meta.name;
    fixedName += 1;
  }
  if (curDesc !== meta.description && (looksCorrupted(curDesc) || curDesc !== meta.description)) {
    rows[r][descIdx] = meta.description;
    fixedDesc += 1;
  }
}

writeFileSync(CSV_PATH, UTF8_BOM + `${stringifyCsv(rows)}\n`, 'utf8');
console.log(
  `[repair-item-defs-csv-names] map=${metaById.size} fixedName=${fixedName} fixedDesc=${fixedDesc} missingInTs=${missing}`,
);
