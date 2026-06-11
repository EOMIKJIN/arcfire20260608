#!/usr/bin/env node
/**
 * 무역소 판매 무기 — weapon_list.csv tradePortListed 동기화
 * 정본: tables/balance/weapon_trade_listing_policy.csv
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isTradePortEligibleWeapon } from './weapon-trade-listing-rules.mjs';

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

function loadCanonicalWeaponIds(csvPath) {
  if (!existsSync(csvPath)) return [];
  const policyRows = parseCsv(readFileSync(csvPath, 'utf8').trim());
  const policyHdr = policyRows[0];
  return policyRows.slice(1).map((cols) => {
    const row = Object.fromEntries(policyHdr.map((h, i) => [h, cols[i] ?? '']));
    return String(row.canonicalWeaponId).trim();
  }).filter(Boolean);
}

if (!existsSync(POLICY_CSV)) {
  console.error('Missing policy:', POLICY_CSV);
  process.exit(1);
}

const canonicalIds = new Set(loadCanonicalWeaponIds(POLICY_CSV));

const weaponRows = parseCsv(readFileSync(WEAPON_CSV, 'utf8').trim());
const hdr = weaponRows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
let idIdx = hdr.indexOf('id');
let listedIdx = hdr.indexOf('tradePortListed');
const tierIdx = hdr.findIndex((h) => h === 'tierLabel' || h === '등급라벨');
if (idIdx < 0) {
  console.error('weapon_list.csv missing id column');
  process.exit(1);
}
if (listedIdx < 0) {
  hdr.push('tradePortListed');
  listedIdx = hdr.length - 1;
}

let setTrue = 0;
let setFalse = 0;
const out = [hdr];
for (const cols of weaponRows.slice(1)) {
  const next = [...cols];
  while (next.length < hdr.length) next.push('');
  const id = String(next[idIdx] ?? '').trim();
  const tierLabel = String(next[tierIdx] ?? '').trim();
  const inPolicy = canonicalIds.has(id);
  const eligible = isTradePortEligibleWeapon(id, tierLabel);
  const shouldList = inPolicy && eligible;
  const was = String(next[listedIdx] ?? '').toUpperCase() === 'TRUE';
  next[listedIdx] = shouldList ? 'TRUE' : 'FALSE';
  if (shouldList) setTrue += 1;
  else if (was) setFalse += 1;
  out.push(next);
}

writeFileSync(WEAPON_CSV, rowsToCsv(out), 'utf8');
console.log(`tradePortListed sync: canonical=${canonicalIds.size} TRUE=${setTrue} demoted=${setFalse}`);
