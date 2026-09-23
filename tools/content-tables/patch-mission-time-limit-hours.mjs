import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
      } else {
        field += ch;
      }
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

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function hoursFor(id, type) {
  if (id.startsWith('mission_') || id.startsWith('story_')) return 0;
  if (type === 'combat') return 24;
  if (type === 'delivery') return 72;
  return 48;
}

const path = resolve('tables/content/missions.csv');
const raw = readFileSync(path, 'utf8');
const endedWithNl = raw.endsWith('\n');
const rows = parseCsv(raw.replace(/^\uFEFF/, ''));
const header = rows[0];
if (header[0]) header[0] = header[0].replace(/^\uFEFF/, '');
let idx = header.indexOf('timeLimitHours');
if (idx < 0) {
  header.push('timeLimitHours');
  idx = header.length - 1;
}
const idIdx = header.indexOf('id');
const typeIdx = header.indexOf('type');
for (let r = 1; r < rows.length; r += 1) {
  const row = rows[r];
  while (row.length < header.length) row.push('');
  const id = row[idIdx] ?? '';
  const type = row[typeIdx] ?? '';
  if (!id) continue;
  row[idx] = String(hoursFor(id, type));
}
const out = rows.map((row) => row.map(csvEscape).join(',')).join('\n') + (endedWithNl ? '\n' : '');
writeFileSync(path, out, 'utf8');
console.log(`patched ${rows.length - 1} mission rows with timeLimitHours`);
