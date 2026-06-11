#!/usr/bin/env node
/**
 * 무역소 무기 정본 — weapon_list.csv 전체 중
 * NPC 슬롯 번호 복제(vmock·wave)만 제외. 기본 _01·arc 성장 라인 모두 포함.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isPinnedStarterTradeWeapon,
  isTradePortEligibleWeapon,
} from './weapon-trade-listing-rules.mjs';

const ROOT = resolve(process.cwd());
const WEAPON_CSV = resolve(ROOT, 'tables', 'content', 'weapon_list.csv');
const POLICY_CSV = resolve(ROOT, 'tables', 'balance', 'weapon_trade_listing_policy.csv');

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

function rowsToCsv(rows) {
  return rows
    .map((cols) =>
      cols
        .map((c) => {
          const s = String(c ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(','),
    )
    .join('\n')
    .concat('\n');
}

if (!existsSync(WEAPON_CSV)) {
  console.error('Missing:', WEAPON_CSV);
  process.exit(1);
}

const weaponRows = parseCsv(readFileSync(WEAPON_CSV, 'utf8').trim());
const hdr = weaponRows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
const idIdx = hdr.indexOf('id');
const nameIdx = hdr.findIndex((h) => h === 'name' || h === '이름');
const kindIdx = hdr.findIndex((h) => h === 'kind' || h === '종류');
const lvIdx = hdr.findIndex((h) => h === 'requiredLevel' || h === '요구레벨');
const tierIdx = hdr.findIndex((h) => h === 'tierLabel' || h === '등급라벨');

const candidates = weaponRows.slice(1).map((cols) => {
  const id = String(cols[idIdx] ?? '').trim();
  const tierLabel = String(cols[tierIdx] ?? '').trim();
  if (!isTradePortEligibleWeapon(id, tierLabel)) return null;
  const requiredLevel = Number.parseInt(String(cols[lvIdx] ?? '1'), 10) || 1;
  const weaponFamilyKind = String(cols[kindIdx] ?? 'laser').trim().toLowerCase();
  const name = String(cols[nameIdx] ?? id).trim();
  const listingAnchor = isPinnedStarterTradeWeapon(tierLabel) ? 'pinned' : 'progression';
  return { id, name, requiredLevel, weaponFamilyKind, listingAnchor };
}).filter(Boolean);

candidates.sort((a, b) => {
  if (a.requiredLevel !== b.requiredLevel) return a.requiredLevel - b.requiredLevel;
  if (a.listingAnchor !== b.listingAnchor) return a.listingAnchor === 'pinned' ? -1 : 1;
  return a.id.localeCompare(b.id);
});

const out = [
  [
    'tradeGradeRank',
    'canonicalWeaponId',
    'weaponFamilyKind',
    'requiredPilotLevelMin',
    'listingAnchor',
    'notesKo',
  ],
  ...candidates.map((w, idx) => [
    String(idx + 1),
    w.id,
    w.weaponFamilyKind,
    String(w.requiredLevel),
    w.listingAnchor,
    w.name,
  ]),
];

writeFileSync(POLICY_CSV, rowsToCsv(out), 'utf8');
const excluded = weaponRows.slice(1).length - candidates.length;
console.log(
  `weapon_trade_listing_policy: shop=${candidates.length} excluded_npc_clone=${excluded}`,
);
