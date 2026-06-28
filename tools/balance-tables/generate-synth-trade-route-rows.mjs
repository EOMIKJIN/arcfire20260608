/**
 * synth 행성 교역 프로필·tg 배정 audit CSV 생성 (런타임 bridge와 동일 규칙).
 * - 생산 CSV(planet_trade_route_profile)에 merge하지 않음 — SIM·밸런스 검토용.
 *
 * Usage:
 *   node tools/balance-tables/generate-synth-trade-route-rows.mjs
 *   node tools/balance-tables/generate-synth-trade-route-rows.mjs --write
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const BALANCE = resolve(ROOT, 'tables', 'balance');
const CONTENT = resolve(ROOT, 'tables', 'content');
const OUT_DIR = resolve(BALANCE, '_audit');
const SKU_CAP = 10;

const QUADRANT_TRADE = {
  north: { tradeFactionCode: 'F4', tradeRegionCode: 'N' },
  south: { tradeFactionCode: 'F2', tradeRegionCode: 'S' },
  east: { tradeFactionCode: 'F3', tradeRegionCode: 'E' },
  west: { tradeFactionCode: 'F1', tradeRegionCode: 'W' },
};

const CATEGORY_ALIASES = {
  minerals: 'mineral',
  mineral: 'mineral',
  food: 'food',
  tech: 'tech',
  luxury: 'luxury',
  weapon: 'weapon',
  contraband: 'contraband',
};

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

function loadCsv(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8').trim();
  if (!raw) return [];
  const rows = parseCsv(raw);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) {
      out[header[i]] = cols[i] ?? '';
    }
    return out;
  });
}

function resolveQuadrant(profile) {
  const p = String(profile ?? '').trim().toLowerCase();
  if (p in QUADRANT_TRADE) return p;
  return 'east';
}

function splitPipeCategories(sectorBand, sectorPolicyRows) {
  const row = sectorPolicyRows.find((r) => String(r.sectorBand).trim() === sectorBand.trim())
    ?? sectorPolicyRows.find((r) => String(r.sectorBand).trim() === 'early');
  const pipe = String(row?.commodityItemIdsPipe ?? 'food|mineral')
    .split('|')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(pipe.map((t) => CATEGORY_ALIASES[t] ?? t));
}

function capIds(ids) {
  const sorted = [...new Set(ids)].sort();
  return sorted.length <= SKU_CAP ? sorted : sorted.slice(0, SKU_CAP);
}

function loadTradeRouteItems() {
  const rows = loadCsv(resolve(CONTENT, 'item_defs.csv'));
  const out = [];
  for (const row of rows) {
    const id = String(row.id ?? '').trim();
    if (!id.startsWith('tg_')) continue;
    const category = String(row.category ?? '').trim().toLowerCase();
    let attrs = {};
    try {
      attrs = JSON.parse(String(row.attrsJson ?? row.attrs ?? '{}'));
    } catch {
      attrs = {};
    }
    const srcFactionCode = String(attrs.srcFactionCode ?? '').trim();
    const dstFactionCode = String(attrs.dstFactionCode ?? '').trim();
    if (!srcFactionCode || !dstFactionCode) continue;
    out.push({ id, category, srcFactionCode, dstFactionCode });
  }
  return out;
}

function zoneToSectorBand(zoneIndex, levelingRows) {
  const z = Math.max(1, Math.min(21, Math.round(Number(zoneIndex) || 1)));
  const row = levelingRows.find((r) => Math.round(Number(r.zoneIndex)) === z)
    ?? levelingRows.find((r) => Math.round(Number(r.zoneIndex)) === 1);
  return String(row?.sectorBand ?? 'early').trim();
}

function computeAssignments(tradeFactionCode, sectorBand, sectorPolicyRows, tgItems) {
  const allowed = splitPipeCategories(sectorBand, sectorPolicyRows);
  const supply = [];
  const demand = [];
  for (const item of tgItems) {
    if (!allowed.has(item.category)) continue;
    if (item.srcFactionCode === tradeFactionCode) supply.push(item.id);
    if (item.dstFactionCode === tradeFactionCode) demand.push(item.id);
  }
  return {
    supplyTgIds: capIds(supply),
    demandTgIds: capIds(demand),
  };
}

function main() {
  const synthRows = loadCsv(resolve(BALANCE, 'synth_system_colonization.csv'));
  const levelingRows = loadCsv(resolve(BALANCE, 'planet_leveling_progression.csv'));
  const sectorPolicyRows = loadCsv(resolve(BALANCE, 'trade_port_sector_commodity_policy.csv'));
  const tgItems = loadTradeRouteItems();

  const profileLines = ['planetId,tradeFactionCode,tradeRegionCode,synthSystemId,zoneIndex,sectorBand,notesKo'];
  const assignmentLines = ['planetId,tgId,role,synthSystemId,notesKo'];

  for (const row of synthRows) {
    const systemId = String(row.synthSystemId ?? '').trim();
    if (!systemId.startsWith('synth_')) continue;
    const planetId = `${systemId}_p`;
    const quadrant = resolveQuadrant(row.tradeProfile);
    const tradeMeta = QUADRANT_TRADE[quadrant];
    const zoneIndex = String(row.zoneIndex ?? '1').trim();
    const sectorBand = zoneToSectorBand(zoneIndex, levelingRows);
    const { supplyTgIds, demandTgIds } = computeAssignments(
      tradeMeta.tradeFactionCode,
      sectorBand,
      sectorPolicyRows,
      tgItems,
    );

    profileLines.push([
      planetId,
      tradeMeta.tradeFactionCode,
      tradeMeta.tradeRegionCode,
      systemId,
      zoneIndex,
      sectorBand,
      `synth audit — ${row.planetNameKo ?? systemId}`,
    ].join(','));

    for (const tgId of supplyTgIds) {
      assignmentLines.push([planetId, tgId, 'supply', systemId, 'runtime-cap'].join(','));
    }
    for (const tgId of demandTgIds) {
      assignmentLines.push([planetId, tgId, 'demand', systemId, 'runtime-cap'].join(','));
    }
  }

  const profileCsv = `${profileLines.join('\n')}\n`;
  const assignmentCsv = `${assignmentLines.join('\n')}\n`;

  if (!process.argv.includes('--write')) {
    console.log('# synth_planet_trade_route_audit.csv (preview)');
    console.log(profileCsv);
    console.log('# synth_trade_route_assignments_audit.csv (preview)');
    console.log(assignmentCsv.slice(0, 2000));
    console.log(`\n(${profileLines.length - 1} synth planets · use --write to save under tables/balance/_audit/)`);
    return;
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, 'synth_planet_trade_route_audit.csv'), profileCsv, 'utf8');
  writeFileSync(resolve(OUT_DIR, 'synth_trade_route_assignments_audit.csv'), assignmentCsv, 'utf8');
  console.log(`Wrote audit CSVs to ${OUT_DIR} (${profileLines.length - 1} synth planets)`);
}

main();
