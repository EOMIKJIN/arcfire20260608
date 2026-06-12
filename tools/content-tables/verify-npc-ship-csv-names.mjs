#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const CSV_PATH = resolve(ROOT, 'tables/content/npc_ai_ships.csv');
const TS_PATH = resolve(ROOT, 'src/data/generated/csvNpcCapitalShips.ts');

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

const ts = readFileSync(TS_PATH, 'utf8');
const nameById = new Map();
for (const m of ts.matchAll(/id: "([^"]+)",\s*\n\s*name: "([^"]+)"/g)) {
  nameById.set(m[1], m[2]);
}

const raw = readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);
const hdr = rows[0];
const idIdx = hdr.indexOf('id');
const nameIdx = hdr.indexOf('name');
const mismatches = [];
const mojibake = [];

for (let r = 1; r < rows.length; r += 1) {
  const id = rows[r][idIdx];
  const name = rows[r][nameIdx];
  const good = nameById.get(id);
  if (good && name !== good) mismatches.push({ id, csv: name, ts: good });
  if (/^[\x00-\x7F]*$/.test(name)) continue;
  if (/[]/.test(name) || /(?:\?){2,}/.test(name)) mojibake.push({ id, name });
}

console.log(`rows=${rows.length - 1} nameMap=${nameById.size} mismatches=${mismatches.length} mojibake=${mojibake.length}`);
for (const m of mismatches.slice(0, 20)) console.log('mismatch', m.id, JSON.stringify(m.csv), '->', JSON.stringify(m.ts));
for (const m of mojibake.slice(0, 20)) console.log('mojibake', m.id, JSON.stringify(m.name));
