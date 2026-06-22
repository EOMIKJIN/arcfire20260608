/**
 * npc_ai_ships.csv → npc_capital_ship_equip_slots.csv
 * NPC 전함당 최대 4개 장비 슬롯(플레이어 slotId 동일). itemDefId는 비워도 됨.
 * npm run build:content-tables 전에 실행
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const NPC_SHIPS = resolve(ROOT, 'tables/content/npc_ai_ships.csv');
const OUT = resolve(ROOT, 'tables/content/npc_capital_ship_equip_slots.csv');

/** NPC 기본 4슬롯 — 무기 슬롯 제외, 플레이어 조선소 slotId와 동일 */
const DEFAULT_NPC_EQUIP_SLOTS = [
  { slotOrder: 1, slotId: 'ARMOR' },
  { slotOrder: 2, slotId: 'ENGINE' },
  { slotOrder: 3, slotId: 'SYSTEM' },
  { slotOrder: 4, slotId: 'EX_01' },
];

export const NPC_MAX_EQUIP_SLOTS = 4;

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
      } else {
        field += ch;
      }
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
      if (row.some((c) => c.length > 0)) rows.push(row);
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

function csvEscape(s) {
  const t = String(s ?? '');
  return t.includes(',') || t.includes('"') || t.includes('\n')
    ? `"${t.replace(/"/g, '""')}"`
    : t;
}

function main() {
  const text = readFileSync(NPC_SHIPS, 'utf8');
  const table = parseCsv(text);
  const header = table[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const outRows = [
    ['id', 'npcShipId', 'slotOrder', 'slotId', 'itemDefId', 'notesKo'],
  ];

  for (let r = 1; r < table.length; r += 1) {
    const row = table[r];
    const shipId = String(row[idx.id] ?? '').trim();
    if (!shipId) continue;
    const archetype = String(row[idx.capitalShipArchetype] ?? 'neutral').trim().toLowerCase();
    if (archetype === 'survival') continue;

    for (const slot of DEFAULT_NPC_EQUIP_SLOTS) {
      outRows.push([
        `${shipId}__${slot.slotId}`,
        shipId,
        String(slot.slotOrder),
        slot.slotId,
        '',
        `NPC 장비슬롯 ${slot.slotOrder}/${NPC_MAX_EQUIP_SLOTS} · itemDefId 비우면 미장착`,
      ]);
    }
  }

  const body = outRows.map((cols) => cols.map(csvEscape).join(',')).join('\n');
  writeFileSync(OUT, `${body}\n`, 'utf8');
  console.log(`Wrote ${outRows.length - 1} rows (${NPC_MAX_EQUIP_SLOTS} slots × ships) → ${OUT}`);
}

main();
