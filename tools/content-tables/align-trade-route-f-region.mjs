#!/usr/bin/env node
/**
 * tg_* attrsJson · tagsPipe — F1↔W F2↔S F3↔E F4↔N
 * F 코드(진열 정본)는 유지하고 지역·태그만 맞춤.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CSV_PATH = resolve(ROOT, 'tables/content/item_defs.csv');
const GEN_PATH = resolve(ROOT, 'src/data/generated/csvItemDefs.ts');

const REGION_BY_F = { F1: 'W', F2: 'S', F3: 'E', F4: 'N' };

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

function escapeCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function alignAttrs(attrs) {
  if (!attrs || attrs.tradeRoute !== true) return { attrs, changed: false };
  const srcF = String(attrs.srcFactionCode ?? '').trim();
  const dstF = String(attrs.dstFactionCode ?? '').trim();
  const srcR = REGION_BY_F[srcF];
  const dstR = REGION_BY_F[dstF];
  if (!srcR || !dstR) return { attrs, changed: false };
  const next = { ...attrs, srcRegion: srcR, dstRegion: dstR };
  const changed = next.srcRegion !== attrs.srcRegion || next.dstRegion !== attrs.dstRegion;
  return { attrs: next, changed };
}

function alignTagsPipe(tagsPipe, srcF, dstF) {
  const parts = String(tagsPipe ?? '')
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^src_F[1-4]$/.test(p) && !/^dst_F[1-4]$/.test(p));
  if (!parts.includes('trade_route')) parts.unshift('trade_route');
  parts.push(`src_${srcF}`, `dst_${dstF}`);
  return parts.join('|');
}

const raw = readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(raw.replace(/^\uFEFF/, ''));
const header = rows[0];
const tagsIdx = header.indexOf('tagsPipe');
const attrsIdx = header.indexOf('attrsJson');
const idIdx = header.indexOf('id');
if (tagsIdx < 0 || attrsIdx < 0) throw new Error('item_defs header missing tagsPipe/attrsJson');

let csvChanged = 0;
for (let r = 1; r < rows.length; r += 1) {
  const cols = rows[r];
  const rawAttrs = String(cols[attrsIdx] ?? '').trim();
  if (!rawAttrs) continue;
  let parsed;
  try {
    parsed = JSON.parse(rawAttrs);
  } catch {
    continue;
  }
  const { attrs, changed } = alignAttrs(parsed);
  if (!attrs.tradeRoute) continue;
  const srcF = String(attrs.srcFactionCode ?? '').trim();
  const dstF = String(attrs.dstFactionCode ?? '').trim();
  const nextTags = alignTagsPipe(cols[tagsIdx], srcF, dstF);
  const tagsChanged = nextTags !== cols[tagsIdx];
  if (!changed && !tagsChanged) continue;
  cols[attrsIdx] = JSON.stringify(attrs);
  cols[tagsIdx] = nextTags;
  csvChanged += 1;
}

writeFileSync(
  CSV_PATH,
  `${rows.map((row) => row.map(escapeCell).join(',')).join('\n')}\n`,
  'utf8',
);

let gen = readFileSync(GEN_PATH, 'utf8');
let genChanged = 0;
gen = gen.replace(
  /tags: \[([^\]]+)\],\n    attrs: (\{[^\n]+\})/g,
  (full, _tags, attrsLit) => {
    let parsed;
    try {
      parsed = JSON.parse(attrsLit);
    } catch {
      return full;
    }
    const { attrs, changed } = alignAttrs(parsed);
    if (!attrs.tradeRoute) return full;
    const srcF = String(attrs.srcFactionCode ?? '').trim();
    const dstF = String(attrs.dstFactionCode ?? '').trim();
    const nextTags = `["trade_route","src_${srcF}","dst_${dstF}"]`;
    const nextAttrs = JSON.stringify(attrs);
    if (!changed && full.includes(nextTags) && full.includes(nextAttrs)) return full;
    genChanged += 1;
    return `tags: ${nextTags},\n    attrs: ${nextAttrs}`;
  },
);
writeFileSync(GEN_PATH, gen, 'utf8');

console.log(`align-trade-route-f-region: csvRows=${csvChanged} genBlocks=${genChanged}`);
