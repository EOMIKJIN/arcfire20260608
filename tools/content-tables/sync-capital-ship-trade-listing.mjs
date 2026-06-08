#!/usr/bin/env node
/**
 * 유사 체급당 무역소 대표 1척 — npc_ai_ships.csv tradePortListed 동기화
 * 정본: tables/balance/capital_ship_trade_listing_policy.csv
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const SHIPS_CSV = resolve(ROOT, 'tables', 'content', 'npc_ai_ships.csv');
const POLICY_CSV = resolve(ROOT, 'tables', 'balance', 'capital_ship_trade_listing_policy.csv');

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

if (!existsSync(POLICY_CSV)) {
  console.error('Missing policy:', POLICY_CSV);
  process.exit(1);
}

const policyRows = parseCsv(readFileSync(POLICY_CSV, 'utf8').trim());
const policyHdr = policyRows[0];
const canonicalIds = new Set(
  policyRows.slice(1).map((cols) => {
    const row = Object.fromEntries(policyHdr.map((h, i) => [h, cols[i] ?? '']));
    return String(row.canonicalNpcShipId).trim();
  }),
);

const shipRows = parseCsv(readFileSync(SHIPS_CSV, 'utf8').trim());
const shipHdr = shipRows[0];
const idIdx = shipHdr.indexOf('id');
const listedIdx = shipHdr.indexOf('tradePortListed');
if (idIdx < 0 || listedIdx < 0) {
  console.error('npc_ai_ships.csv missing id or tradePortListed column');
  process.exit(1);
}

let setTrue = 0;
let setFalse = 0;
const out = [shipHdr];
for (const cols of shipRows.slice(1)) {
  const next = [...cols];
  const id = String(next[idIdx] ?? '').trim();
  const shouldList = canonicalIds.has(id);
  const was = String(next[listedIdx] ?? '').toUpperCase() === 'TRUE';
  next[listedIdx] = shouldList ? 'TRUE' : 'FALSE';
  if (shouldList) setTrue += 1;
  else if (was) setFalse += 1;
  out.push(next);
}

writeFileSync(SHIPS_CSV, rowsToCsv(out), 'utf8');
console.log(`tradePortListed sync: canonical=${canonicalIds.size} TRUE=${setTrue} demoted=${setFalse}`);
