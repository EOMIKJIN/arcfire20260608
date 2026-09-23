/**
 * 임시 포트레이트 채움 — 원본 200장 함장 초상 제공 전.
 * 빈 portrait/image 컬럼만 채움. 이미 키가 있는 행은 유지.
 * 무기·밸런스·레이아웃 상수 미변경.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const NPC_POOL = [
  'assets/images/npc/stella_aris_char001.png',
  'assets/images/npc/mia_bello_char002.png',
  'assets/images/npc/noname_char003.png',
  'assets/images/npc/noname_char004.png',
  'assets/images/npc/noname_char005.png',
  'assets/images/npc/noname_char006.png',
  'assets/images/npc/noname_char007.png',
  'assets/images/npc/noname_char008.png',
  'assets/images/npc/noname_char009.png',
  'assets/images/npc/noname_char010.png',
];

const PLANET_PIP_POOL = [
  'assets/images/planet/pip_synth_fallback.jpg',
];

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

function csvEscape(value) {
  const t = value == null ? '' : String(value);
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function serializeCsv(rows, newline) {
  return rows.map((cols) => cols.map(csvEscape).join(',')).join(newline) + newline;
}

function fillColumn(fileRel, column, pool, opts = {}) {
  const abs = resolve(ROOT, fileRel);
  const raw = readFileSync(abs, 'utf8');
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const hadBom = raw.charCodeAt(0) === 0xfeff;
  const rows = parseCsv(hadBom ? raw.slice(1) : raw).filter((r) => r.length > 0);
  if (rows.length < 2) throw new Error(`${fileRel}: no data`);
  const header = [...rows[0]];
  header[0] = String(header[0]).replace(/^\uFEFF/, '');
  const idx = header.indexOf(column);
  if (idx < 0) throw new Error(`${fileRel}: missing ${column}`);

  const viewModeIdx = header.indexOf('viewMode');
  let filled = 0;
  let kept = 0;
  let skipped = 0;
  let cycle = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];
    while (cols.length < header.length) cols.push('');
    const rowId = String(cols[0] ?? '').trim();
    if (!rowId) {
      skipped += 1;
      continue;
    }
    if (opts.viewModeOnly && viewModeIdx >= 0 && String(cols[viewModeIdx]).trim() !== opts.viewModeOnly) {
      skipped += 1;
      continue;
    }
    const cur = String(cols[idx] ?? '').trim();
    if (cur) {
      kept += 1;
      continue;
    }
    cols[idx] = pool[cycle % pool.length];
    cycle += 1;
    filled += 1;
  }

  rows[0] = header;
  const out = (hadBom ? '\uFEFF' : '') + serializeCsv(rows, newline);
  writeFileSync(abs, out, 'utf8');
  return { fileRel, column, filled, kept, skipped, total: rows.length - 1 };
}

const reports = [];
reports.push(fillColumn('tables/content/npc_ai_captains.csv', 'portraitImageAssetKey', NPC_POOL));
reports.push(fillColumn('tables/content/planets.csv', 'infoPanelPortraitAssetKey', PLANET_PIP_POOL));
reports.push(
  fillColumn('tables/content/story_scene_pages.csv', 'imageAssetKey', NPC_POOL, {
    viewModeOnly: 'ingame_dialog',
  }),
);
reports.push(fillColumn('tables/balance/planet_info_panel_stage.csv', 'infoPanelPortraitAssetKey', PLANET_PIP_POOL));
reports.push(fillColumn('tables/content/player_professions.csv', 'portraitImageAssetKey', NPC_POOL));

console.log(JSON.stringify({ ok: true, reports }, null, 2));
