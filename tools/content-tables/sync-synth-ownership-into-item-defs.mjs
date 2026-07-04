/**
 * synth 행성 소유권 — item_defs.csv 단일 정본에만 등록 (이중 테이블 금지)
 * synth_system_colonization.csv(hasTradePort) → 누락 ownership_synth_* 행 append
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE_DIR = resolve(ROOT, 'tables', 'content');
const BALANCE_DIR = resolve(ROOT, 'tables', 'balance');
const ITEM_DEFS_PATH = resolve(TABLE_DIR, 'item_defs.csv');

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

function loadCsvPath(path) {
  const raw = readFileSync(path, 'utf8').trim();
  const rows = parseCsv(raw);
  if (rows.length < 2) return { header: [], rows: [] };
  const header = [...rows[0]];
  if (header[0]) header[0] = header[0].replace(/^\uFEFF/, '');
  const data = rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
  return { header, rows: data };
}

function toBool(raw) {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function csvEscapeField(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildSynthOwnershipItemDefRow(colonizationRow) {
  const systemId = String(colonizationRow.synthSystemId ?? '').trim();
  const planetId = `${systemId}_p`;
  const planetNameKo = String(colonizationRow.planetNameKo ?? '').trim() || planetId;
  const planetNameEn = String(colonizationRow.planetNameEn ?? '').trim() || planetId;
  const deedDescription = '행성 소유권 증서(재판매 불가).';
  const featureDescription =
    '행성 소유권 증서(재판매 불가).. 구매 시 소속 클랜이 해당 행성을 점유합니다.';
  const deedDescriptionEn =
    'Planet ownership deed (non-resale). Purchasing assigns your clan to hold this planet.';
  return {
    id: `ownership_${planetId}`,
    name: `${planetNameKo}/소유권`,
    description: deedDescription,
    특징설명: featureDescription,
    basePrice: '12000',
    priceVariance: '0',
    volume: '1',
    category: 'luxury',
    kind: 'misc',
    type: 'planet_ownership',
    tradeable: 'true',
    cargoHoldable: 'false',
    capitalShipMountable: 'false',
    nonRepurchase: 'true',
    tagsPipe: 'planet_ownership|no_resale|synth_frontier',
    attrsJson: JSON.stringify({ planetId, noResale: true, synthFrontier: true }),
    sellable: 'false',
    name_en: `${planetNameEn} / Ownership`,
    description_en: deedDescriptionEn,
    featureDescription_en: deedDescriptionEn,
  };
}

function rowToCsvLine(row, header) {
  return header.map((col) => csvEscapeField(row[col] ?? '')).join(',');
}

function main() {
  const colonPath = resolve(BALANCE_DIR, 'synth_system_colonization.csv');
  if (!existsSync(colonPath)) {
    console.log('[sync-synth-ownership] skip — no synth_system_colonization.csv');
    return;
  }
  const { header, rows: itemRows } = loadCsvPath(ITEM_DEFS_PATH);
  const existingIds = new Set(itemRows.map((r) => String(r.id ?? '').trim()));

  const colon = loadCsvPath(colonPath);
  const toAdd = [];
  for (const r of colon.rows) {
    const systemId = String(r.synthSystemId ?? '').trim();
    if (!systemId.startsWith('synth_') || !toBool(r.hasTradePort)) continue;
    const itemId = `ownership_${systemId}_p`;
    if (existingIds.has(itemId)) continue;
    toAdd.push(buildSynthOwnershipItemDefRow(r));
  }

  if (toAdd.length === 0) {
    console.log('[sync-synth-ownership] item_defs.csv — synth ownership up to date');
    return;
  }

  toAdd.sort((a, b) => a.id.localeCompare(b.id));

  let insertAt = itemRows.length;
  for (let i = itemRows.length - 1; i >= 0; i -= 1) {
    const id = String(itemRows[i].id ?? '').trim();
    if (id.startsWith('ownership_')) {
      insertAt = i + 1;
      break;
    }
  }

  const merged = [...itemRows.slice(0, insertAt), ...toAdd, ...itemRows.slice(insertAt)];
  const lines = [header.join(',')];
  for (const row of merged) lines.push(rowToCsvLine(row, header));
  writeFileSync(ITEM_DEFS_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(
    `[sync-synth-ownership] item_defs.csv +${toAdd.length} synth ownership rows (total ownership ~${merged.filter((r) => String(r.id).startsWith('ownership_')).length})`,
  );
}

main();
