#!/usr/bin/env node
/**
 * 성계별 arc seed 수송 함장·함선 CSV 행 생성 (Table-First)
 * - npc_cpt_arc_seed_{systemId} → npc_ai_captains.csv
 * - npc_arc_seed_ship_{systemId} → npc_ai_ships.csv
 *
 * Usage: node tools/content-tables/generate-arc-seed-transport-rows.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CAPTAINS_CSV = path.join(ROOT, 'tables/content/npc_ai_captains.csv');
const SHIPS_CSV = path.join(ROOT, 'tables/content/npc_ai_ships.csv');
const PLANETS_CSV = path.join(ROOT, 'tables/content/planets.csv');

const DISPLAY_NAME_POOL = [
  '베라 호송', '카란 ARC', '듀로 ARC', '엘라 호송', '피온 ARC', '하렌 호송',
  '이온 ARC', '제나 호송', '카일 ARC', '루나 호송', '오스 ARC', '세라 호송',
  '탈로 ARC', '비온 호송', '게일 ARC', '노바 호송', '리안 ARC', '소라 호송',
  '테온 ARC', '윈드 호송', '제로 ARC',
];

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
  return { header, rows, lines };
}

function uniqueSystemIdsFromPlanets() {
  const { rows } = readCsv(PLANETS_CSV);
  const systems = new Map();
  for (const r of rows) {
    const sid = String(r.systemId ?? '').trim();
    if (!sid || systems.has(sid)) continue;
    systems.set(sid, String(r.factionId ?? 'independent').trim() || 'independent');
  }
  return [...systems.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function existingCaptainIds() {
  const { rows } = readCsv(CAPTAINS_CSV);
  return new Set(rows.map((r) => r.id));
}

function existingDisplayNames() {
  const { rows } = readCsv(CAPTAINS_CSV);
  return new Set(rows.map((r) => String(r.displayName ?? '').trim()).filter(Boolean));
}

function existingShipIds() {
  const { rows } = readCsv(SHIPS_CSV);
  return new Set(rows.map((r) => r.id));
}

function pickUniqueDisplayName(used, idx) {
  for (let i = 0; i < DISPLAY_NAME_POOL.length; i += 1) {
    const name = DISPLAY_NAME_POOL[(idx + i) % DISPLAY_NAME_POOL.length];
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `ARC 시드 ${String(idx + 1).padStart(2, '0')}`;
  used.add(fallback);
  return fallback;
}

function captainRow(systemId, factionId, displayName, shipId) {
  return [
    `npc_cpt_arc_seed_${systemId}`,
    displayName,
    '선장',
    factionId,
    'passive',
    'merchant_guard',
    `아크코어 월드 확장 수송 라인 — ${systemId} 성계 시드(Table-First).`,
    'general',
    'none',
    `${factionId}|independent`,
    'pirates|trade_coalition',
    '',
    '',
    systemId,
    systemId,
    shipId,
    '1', '0', '80', '35', '12',
    'FALSE', '', '',
    'FALSE',
    'FALSE', '5', '', '', '',
    '',
    'arc_direct',
    '',
  ].join(',');
}

function shipRow(systemId, shipId, displayName) {
  return [
    'general',
    shipId,
    `${displayName}급 ARC시드`,
    '',
    'hull_cap_patrol_01',
    `npc_cpt_arc_seed_${systemId}`,
    systemId,
    '380', '150', '10', '5', '2', '7', '3',
    '0.0188', '0.000030', '0.00168', '0.000045', '0.94',
    '120', '480', '580', '1920', '410', '560', '88', '1040',
    'w_laser_light_01', 'w_missile_guided_triple_01', 'w_missile_arc_005', '',
    'A-F1|trade:180000',
    '0.44', '1.8', '55', '180',
    'assets/images/ship/npc_test_ship_001.png',
    'assets/images/ship/ship_top_002.png',
    'FALSE', '12', '12', '0', '98', '9', '3', '1.0', 'neutral', '',
  ].join(',');
}

function main() {
  const captainIds = existingCaptainIds();
  const shipIds = existingShipIds();
  const usedNames = existingDisplayNames();
  const systems = uniqueSystemIdsFromPlanets();

  const newCaptainLines = [];
  const newShipLines = [];
  let added = 0;

  systems.forEach(([systemId, factionId], idx) => {
    const captainId = `npc_cpt_arc_seed_${systemId}`;
    const shipId = `npc_arc_seed_ship_${systemId}`;
    if (captainIds.has(captainId) && shipIds.has(shipId)) return;

    const displayName = pickUniqueDisplayName(usedNames, idx);
    if (!captainIds.has(captainId)) {
      newCaptainLines.push(captainRow(systemId, factionId, displayName, shipId));
      captainIds.add(captainId);
    }
    if (!shipIds.has(shipId)) {
      newShipLines.push(shipRow(systemId, shipId, displayName));
      shipIds.add(shipId);
    }
    added += 1;
  });

  if (newCaptainLines.length === 0 && newShipLines.length === 0) {
    console.log('[generate-arc-seed-transport-rows] nothing to add — all systems present');
    return;
  }

  if (newCaptainLines.length > 0) {
    const captainText = fs.readFileSync(CAPTAINS_CSV, 'utf8').replace(/\s+$/, '');
    fs.writeFileSync(CAPTAINS_CSV, `${captainText}\n${newCaptainLines.join('\n')}\n`, 'utf8');
    console.log(`[generate-arc-seed-transport-rows] captains +${newCaptainLines.length}`);
  }
  if (newShipLines.length > 0) {
    const shipText = fs.readFileSync(SHIPS_CSV, 'utf8').replace(/\s+$/, '');
    fs.writeFileSync(SHIPS_CSV, `${shipText}\n${newShipLines.join('\n')}\n`, 'utf8');
    console.log(`[generate-arc-seed-transport-rows] ships +${newShipLines.length}`);
  }
  console.log(`[generate-arc-seed-transport-rows] systems touched: ${added}`);
}

main();
