#!/usr/bin/env node
/**
 * 무역소 구매 팝업용 특징설명 — item_defs / weapon_list / npc_ai_ships CSV 동기화
 *
 * 주의: attrsJson 등 JSON 컬럼이 있는 CSV는 RFC4180 "" 이스케이프 파서 필수.
 *       parseCsvLine 단순 토글 방식 사용 금지(교역품 attrsJson 손상 회귀).
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT = resolve(ROOT, 'tables/content');
const BALANCE = resolve(ROOT, 'tables/balance');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          q = false;
        }
      } else {
        cur += c;
      }
      continue;
    }
    if (c === '"') {
      q = true;
      continue;
    }
    if (c === ',' && !q) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function escapeCsvCell(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(path, header, rows) {
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((col) => escapeCsvCell(row[col] ?? '')).join(','));
  }
  writeFileSync(path, `\ufeff${lines.join('\r\n')}\r\n`, 'utf8');
}

function readCsv(path) {
  const raw = readFileSync(path, 'utf8').replace(/^\ufeff/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    header.forEach((col, i) => {
      row[col] = cells[i] ?? '';
    });
    return row;
  });
  return { header, rows };
}

function loadHullNotes() {
  const { rows } = readCsv(resolve(BALANCE, 'capital_hull_purchase_policy.csv'));
  return new Map(rows.map((r) => [String(r.hullTierKey).trim(), String(r.notesKo ?? '').trim()]));
}

function loadShipListingIndex() {
  const { rows } = readCsv(resolve(BALANCE, 'capital_ship_trade_listing_policy.csv'));
  const byNpc = new Map();
  for (const row of rows) {
    const canonical = String(row.canonicalNpcShipId ?? '').trim();
    const alternate = String(row.alternateNpcShipId ?? '').trim();
    if (canonical) byNpc.set(canonical, row);
    if (alternate) byNpc.set(alternate, row);
  }
  return byNpc;
}

function buildShipFeatureDescription(shipRow, listingByNpc, hullNotes) {
  const id = String(shipRow.id ?? '').trim();
  const name = String(shipRow.name ?? '').trim();
  const hp = String(shipRow.maxHp ?? '').trim();
  const shield = String(shipRow.maxShield ?? '').trim();
  const armor = String(shipRow.armor ?? '').trim();
  const listing = listingByNpc.get(id);
  const tierNote = listing ? hullNotes.get(String(listing.hullTierKey ?? '').trim()) : '';
  const listingNote = listing ? String(listing.notesKo ?? '').trim() : '';
  const lead = listingNote || tierNote || name;
  return `${lead}. HP ${hp} · 실드 ${shield} · 장갑 ${armor}. 구매 시 조선소 격납고에 인도됩니다.`;
}

function syncItemDefs() {
  const path = resolve(CONTENT, 'item_defs.csv');
  const { header, rows } = readCsv(path);
  const descIdx = header.indexOf('description');
  if (descIdx < 0) throw new Error('item_defs.csv: description column missing');

  let nextHeader = header.filter((h) => h !== '특징설명');
  const insertAt = nextHeader.indexOf('description') + 1;
  nextHeader.splice(insertAt, 0, '특징설명');

  for (const row of rows) {
    const existing = String(row['특징설명'] ?? '').trim();
    const desc = String(row.description ?? '').trim();
    if (row.type === 'planet_ownership') {
      row['특징설명'] =
        existing
        || `${desc || '행성 소유권 증서'}. 구매 시 소속 클랜이 해당 행성을 점유합니다.`;
    } else if (row.id === 'clan_disband_order') {
      row['특징설명'] = existing || desc;
    } else {
      row['특징설명'] = existing || desc;
    }
  }

  writeCsv(path, nextHeader, rows);
  console.log(`item_defs.csv: 특징설명 ${rows.length} rows`);
}

function syncWeaponList() {
  const path = resolve(CONTENT, 'weapon_list.csv');
  const { header, rows } = readCsv(path);
  const nextHeader = header.map((h) => (h === '특성설명' ? '특징설명' : h));
  if (!nextHeader.includes('특징설명')) {
    const buyIdx = nextHeader.indexOf('구매가');
    nextHeader.splice(buyIdx + 1, 0, '특징설명');
  }
  for (const row of rows) {
    if (row['특성설명'] && !row['특징설명']) {
      row['특징설명'] = row['특성설명'];
    }
    delete row['특성설명'];
  }
  writeCsv(path, nextHeader, rows);
  console.log(`weapon_list.csv: 특징설명 ${rows.length} rows`);
}

function syncNpcShips() {
  const path = resolve(CONTENT, 'npc_ai_ships.csv');
  const { header, rows } = readCsv(path);
  const listingByNpc = loadShipListingIndex();
  const hullNotes = loadHullNotes();

  let nextHeader = header.filter((h) => h !== '특징설명');
  const insertAt = nextHeader.indexOf('name') + 1;
  nextHeader.splice(insertAt, 0, '특징설명');

  for (const row of rows) {
    const listed = String(row.tradePortListed ?? '').trim().toUpperCase() === 'TRUE';
    const existing = String(row['특징설명'] ?? '').trim();
    if (listed && String(row.id ?? '').startsWith('Player_')) {
      row['특징설명'] = existing || buildShipFeatureDescription(row, listingByNpc, hullNotes);
    } else {
      row['특징설명'] = existing;
    }
  }

  writeCsv(path, nextHeader, rows);
  const filled = rows.filter((r) => String(r['특징설명'] ?? '').trim()).length;
  console.log(`npc_ai_ships.csv: 특징설명 ${filled} rows with text`);
}

syncItemDefs();
syncWeaponList();
syncNpcShips();
console.log('sync-trade-feature-descriptions: done');
