#!/usr/bin/env node
/**
 * 전함 무역소 진열·재분배 연동 검증
 * - capital_ship_trade_listing_policy.csv ↔ npc_ai_ships.tradePortListed
 * - 생성본 item_defs · 런타임 zone 슬라이딩
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = resolve(process.cwd());
const require = createRequire(import.meta.url);

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

const NEW_RANGER_IDS = [
  'Player_hunter_mk1',
  'Player_hunter_mk2',
  'Player_shadow_cruiser_mk1',
  'Player_shadow_cruiser_mk2',
  'Player_raptor_bc_mk1',
  'Player_raptor_bc_apex',
  'Player_phantom_dreadnought_mk1',
  'Player_phantom_super_capital_mk1',
  'Player_phantom_apex_legend_mk1',
];

const policyPath = resolve(ROOT, 'tables/balance/capital_ship_trade_listing_policy.csv');
const shipsPath = resolve(ROOT, 'tables/content/npc_ai_ships.csv');
const itemDefsPath = resolve(ROOT, 'src/data/generated/csvItemDefs.ts');

const policyRows = parseCsv(readFileSync(policyPath, 'utf8').trim());
const policyHdr = policyRows[0];
const policyIds = new Set();
for (const cols of policyRows.slice(1)) {
  const row = Object.fromEntries(policyHdr.map((h, i) => [h, cols[i] ?? '']));
  const primary = String(row.canonicalNpcShipId ?? '').trim();
  const alternate = String(row.alternateNpcShipId ?? '').trim();
  if (primary) policyIds.add(primary);
  if (alternate) policyIds.add(alternate);
}

const shipRows = parseCsv(readFileSync(shipsPath, 'utf8').trim());
const shipHdr = shipRows[0];
const idIdx = shipHdr.indexOf('id');
const listedIdx = shipHdr.indexOf('tradePortListed');
const shipById = new Map();
for (const cols of shipRows.slice(1)) {
  const id = String(cols[idIdx] ?? '').trim();
  shipById.set(id, {
    tradePortListed: String(cols[listedIdx] ?? '').toUpperCase() === 'TRUE',
  });
}

const itemDefsText = readFileSync(itemDefsPath, 'utf8');

const issues = [];
const ok = [];

for (const id of NEW_RANGER_IDS) {
  if (!policyIds.has(id)) {
    issues.push(`[정책 누락] ${id} — capital_ship_trade_listing_policy.csv alternate에 없음`);
    continue;
  }
  const ship = shipById.get(id);
  if (!ship) {
    issues.push(`[CSV 누락] ${id} — npc_ai_ships.csv에 없음`);
    continue;
  }
  if (!ship.tradePortListed) {
    issues.push(`[tradePortListed=FALSE] ${id} — sync-capital-ship-trade-listing.mjs 재실행 필요`);
    continue;
  }
  const itemKey = `"capital_ship_${id}"`;
  if (!itemDefsText.includes(itemKey)) {
    issues.push(`[item_defs 누락] capital_ship_${id} — build:content-tables 재실행 필요`);
    continue;
  }
  ok.push(id);
}

// 런타임 모듈 (빌드된 TS)
let runtimeOk = [];
try {
  // eslint-disable-next-line import/no-unresolved
  const listing = require('../../src/arcCore/balance/capitalShipTradeListingPolicy.ts');
  const tradePort = require('../../src/arcCore/balance/tradePortCapitalShipPolicy.ts');

  const canonical = listing.listCanonicalTradePortNpcShipIds();
  const missingCanonical = NEW_RANGER_IDS.filter((id) => !canonical.includes(id));
  if (missingCanonical.length > 0) {
    issues.push(`[런타임 정책] listCanonicalTradePortNpcShipIds 누락: ${missingCanonical.join(', ')}`);
  } else {
    runtimeOk.push('listCanonicalTradePortNpcShipIds — 9척 포함');
  }

  const zone20 = listing.resolveTradePortNpcShipIdsForZone(20);
  const inZone20 = NEW_RANGER_IDS.filter((id) => zone20.includes(id));
  if (inZone20.length < NEW_RANGER_IDS.length) {
    const absent = NEW_RANGER_IDS.filter((id) => !zone20.includes(id));
    issues.push(`[zone20 슬라이딩] 미포함: ${absent.join(', ')} (window=${zone20.length})`);
  } else {
    runtimeOk.push(`resolveTradePortNpcShipIdsForZone(20) — 9척 포함 (총 ${zone20.length}척)`);
  }

  const edenItems = tradePort.listCapitalShipItemIdsForPlanet('eden_city');
  const edenRanger = NEW_RANGER_IDS.filter((id) => edenItems.includes(`capital_ship_${id}`));
  runtimeOk.push(`eden_city 진열 전함 ${edenItems.length}종 (신규 레인저 ${edenRanger.length}/9)`);
} catch (e) {
  issues.push(`[런타임 검증 스킵] TS 직접 require 실패 — tsx로 재시도: ${e.message}`);
}

console.log('=== 전함 무역소 진열 검증 ===');
console.log(`정책 등록 ID: ${policyIds.size}종`);
console.log(`신규 레인저 OK: ${ok.length}/${NEW_RANGER_IDS.length}`);
for (const line of runtimeOk) console.log(`  ✓ ${line}`);
if (issues.length === 0) {
  console.log('\n결과: PASS — 신규 전함이 정책·tradePortListed·item_defs·zone 재분배에 반영됨');
  process.exit(0);
}
console.log('\n결과: FAIL');
for (const line of issues) console.log(`  ✗ ${line}`);
process.exit(1);
