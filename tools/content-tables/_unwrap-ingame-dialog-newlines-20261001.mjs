/**
 * 인게임 대사 CSV의 작성 \n 제거 — 엔진 soft-wrap 정본.
 * cinematic 은 유지. story_001#2 엘렌 잔해 언급 → 오랜 지인인 너에게.
 */
import { readFileSync, writeFileSync } from 'node:fs';
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

function unwrapAuthoredLines(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

const csvPath = resolve(ROOT, 'tables/content/story_scene_pages.csv');
const raw = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);
const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
const iScene = header.indexOf('sceneId');
const iPage = header.indexOf('pageIndex');
const iText = header.indexOf('text');
const iEn = header.indexOf('text_en');
const iMode = header.indexOf('viewMode');

let unwrapped = 0;
let ellen = 0;

for (let r = 1; r < rows.length; r += 1) {
  const row = rows[r];
  if (!row || !row[iScene]) continue;
  const mode = String(row[iMode] ?? '').trim();
  if (mode === 'cinematic') continue;

  const beforeKo = row[iText];
  const beforeEn = row[iEn];
  let ko = unwrapAuthoredLines(beforeKo);
  let en = unwrapAuthoredLines(beforeEn);

  const sceneId = String(row[iScene]).trim();
  const pageIndex = Number(row[iPage]);
  if (sceneId === 'story_dialog_story_001' && pageIndex === 2) {
    const nextKo = ko.replace('잔해에서 살아 돌아온 너에게', '오랜 지인인 너에게');
    if (nextKo !== ko) {
      ko = nextKo;
      ellen += 1;
    }
    const nextEn = en.replace(
      'I am assigning you myself.',
      "I'll leave this to you, an old acquaintance.",
    );
    if (nextEn !== en) en = nextEn;
  }

  if (ko !== beforeKo || en !== beforeEn) {
    row[iText] = ko;
    row[iEn] = en;
    unwrapped += 1;
  }
}

writeFileSync(csvPath, stringifyCsv(rows), 'utf8');

let leftoverLiteral = 0;
for (let r = 1; r < rows.length; r += 1) {
  const row = rows[r];
  if (!row || String(row[iMode] ?? '').trim() === 'cinematic') continue;
  if (String(row[iText] ?? '').includes('\\n') || String(row[iEn] ?? '').includes('\\n')) {
    leftoverLiteral += 1;
  }
}

console.log(JSON.stringify({ unwrapped, ellen, leftoverLiteral }, null, 2));
