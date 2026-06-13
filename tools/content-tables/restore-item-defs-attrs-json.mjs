#!/usr/bin/env node
/** item_defs attrsJson — git 7f1dd8c 정본 복원(특징설명 유지) */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CSV_PATH = resolve(ROOT, 'tables/content/item_defs.csv');
const GIT_REF = '7f1dd8c:tables/content/item_defs.csv';

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

function toRows(raw) {
  const rows = parseCsv(raw.trim());
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, ''));
  const data = rows.slice(1).map((cols) => {
    const out = {};
    header.forEach((h, i) => {
      out[h] = cols[i] ?? '';
    });
    return out;
  });
  return { header, data };
}

function escapeCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const oldRaw = execSync(`git show ${GIT_REF}`, { encoding: 'utf8', cwd: ROOT });
const curRaw = readFileSync(CSV_PATH, 'utf8');
const old = toRows(oldRaw);
const cur = toRows(curRaw);
const oldAttrs = new Map(old.data.map((r) => [r.id, r.attrsJson]));

let restored = 0;
for (const row of cur.data) {
  const prev = oldAttrs.get(row.id);
  if (!prev || !String(prev).trim()) continue;
  if (row.attrsJson !== prev) {
    row.attrsJson = prev;
    restored += 1;
  }
}

const lines = [cur.header.join(',')];
for (const row of cur.data) {
  lines.push(cur.header.map((h) => escapeCell(row[h])).join(','));
}
writeFileSync(CSV_PATH, `\ufeff${lines.join('\r\n')}\r\n`, 'utf8');
console.log(`restore-item-defs-attrs-json: ${restored} rows restored from ${GIT_REF.split(':')[0]}`);
