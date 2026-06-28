#!/usr/bin/env node
/**
 * NPC 함장·함선 마스터 데이터 무결성 감사 — assignedShipId 중복 CI FAIL
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CAPTAINS_CSV = path.join(ROOT, 'tables/content/npc_ai_captains.csv');
const SHIPS_CSV = path.join(ROOT, 'tables/content/npc_ai_ships.csv');

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
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function main() {
  const captains = readCsv(CAPTAINS_CSV);
  const ships = readCsv(SHIPS_CSV);
  const shipIds = new Set(ships.map((r) => String(r.id ?? '').trim()).filter(Boolean));
  const captainIds = new Set(captains.map((r) => String(r.id ?? '').trim()).filter(Boolean));
  const errors = [];

  const assignedOwner = new Map();
  for (const c of captains) {
    const id = String(c.id ?? '').trim();
    const sid = String(c.assignedShipId ?? '').trim();
    if (!sid) continue;
    if (!shipIds.has(sid)) {
      errors.push(`captain ${id}: assignedShipId ${sid} missing in npc_ai_ships.csv`);
    }
    const prior = assignedOwner.get(sid);
    if (prior) {
      errors.push(`duplicate assignedShipId ${sid}: ${prior} vs ${id}`);
    } else {
      assignedOwner.set(sid, id);
    }
  }

  const displayNames = new Map();
  for (const c of captains) {
    const id = String(c.id ?? '').trim();
    const name = String(c.displayName ?? '').trim();
    if (!name) {
      errors.push(`captain ${id}: empty displayName`);
      continue;
    }
    const prior = displayNames.get(name);
    if (prior) errors.push(`duplicate displayName "${name}": ${prior} vs ${id}`);
    else displayNames.set(name, id);
  }

  for (const s of ships) {
    const id = String(s.id ?? '').trim();
    const cid = String(s.captainId ?? '').trim();
    if (cid && !captainIds.has(cid) && cid !== 'npc_cpt_ai_robot_default') {
      errors.push(`ship ${id}: captainId ${cid} missing in npc_ai_captains.csv`);
    }
  }

  if (errors.length > 0) {
    console.error('[audit:npc-fleet] FAIL');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('[audit:npc-fleet] PASS');
}

main();
