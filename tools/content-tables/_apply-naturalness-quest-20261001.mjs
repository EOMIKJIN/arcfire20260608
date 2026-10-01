/**
 * §5 퀘스트 목표 대사 자연화 패치 적용.
 * story_scene_pages.csv 의 text · text_en 만. id·화자·에셋 불변.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

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

function csvEscape(field) {
  const s = String(field ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function stringifyCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

function visualLen(s) {
  return Array.from(String(s ?? '').replace(/\r/g, '')).length;
}

function checkKo(text, key) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const errs = [];
  if (lines.length > 3) errs.push(`${key} KO lines=${lines.length}>3`);
  lines.forEach((ln, i) => {
    if (visualLen(ln) > 21) errs.push(`${key} KO L${i + 1} ${visualLen(ln)}자 「${ln}」`);
  });
  if (/"/.test(text)) errs.push(`${key} KO quote`);
  if (/~다\.\s*~다\.\s*~다/.test(text.replace(/\n/g, ' '))) errs.push(`${key} KO staccato leftover`);
  return errs;
}

function checkEn(text, key) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const errs = [];
  if (lines.length > 3) errs.push(`${key} EN lines=${lines.length}>3`);
  if (/"/.test(text)) errs.push(`${key} EN quote`);
  return errs;
}

const patchDir = resolve(ROOT, 'tools/content-tables');
const patchFiles = readdirSync(patchDir)
  .filter((n) => /^_naturalness-patch-b[1-4]\.json$/.test(n))
  .sort();
if (patchFiles.length === 0) {
  console.error('no patch files');
  process.exit(1);
}

const patches = new Map();
for (const f of patchFiles) {
  const raw = JSON.parse(readFileSync(resolve(patchDir, f), 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.items ?? raw.patches ?? [];
  for (const it of items) {
    const key = it.key || `${it.sceneId}#${it.pageIndex}`;
    patches.set(key, { text: it.text, text_en: it.text_en, src: f });
  }
}

const csvPath = resolve(ROOT, 'tables/content/story_scene_pages.csv');
const raw = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);
const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
const iScene = header.indexOf('sceneId');
const iPage = header.indexOf('pageIndex');
const iText = header.indexOf('text');
const iEn = header.indexOf('text_en');

const errs = [];
let applied = 0;
const missing = [];
const seen = new Set();

for (const [key, patch] of patches) {
  seen.add(key);
  const [sceneId, pageStr] = key.split('#');
  const pageIndex = String(Number(pageStr));
  const row = rows.find((r, idx) => idx > 0 && r[iScene] === sceneId && String(Number(r[iPage])) === pageIndex);
  if (!row) {
    missing.push(key);
    continue;
  }
  errs.push(...checkKo(patch.text, key));
  errs.push(...checkEn(patch.text_en, key));
  row[iText] = patch.text;
  row[iEn] = patch.text_en;
  applied += 1;
}

if (errs.length) {
  console.error(JSON.stringify({ fail: 'validate', errs }, null, 2));
  process.exit(2);
}

writeFileSync(csvPath, stringifyCsv(rows), 'utf8');
console.log(JSON.stringify({
  patchFiles,
  patchCount: patches.size,
  applied,
  missing,
}, null, 2));
