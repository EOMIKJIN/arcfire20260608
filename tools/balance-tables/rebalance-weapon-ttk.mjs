/**
 * weapon_list.csv — D&D3 TTK 기준 재조정
 * 레이저(기본 등급)=앵커, 미사일=동급, 로켓=저효율, 드론/함재기=고효율
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  computeWeaponRawDps,
  loadCombatRefFromKvRows,
  loadFamilyPolicyFromRows,
  rebalanceWeaponRow,
} from './weapon-ttk-balance-model.mjs';

const ROOT = resolve(process.cwd());
const WEAPON_CSV = resolve(ROOT, 'tables', 'content', 'weapon_list.csv');
const FAMILY_POLICY_CSV = resolve(ROOT, 'tables', 'balance', 'weapon_family_ttk_balance_policy.csv');
const COMBAT_REF_CSV = resolve(ROOT, 'tables', 'balance', 'weapon_combat_reference_policy.csv');
const SPECIAL_POLICY_CSV = resolve(ROOT, 'tables', 'balance', 'weapon_special_combat_balance_policy.csv');

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
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
}

function serializeCsv(header, dataRows) {
  const esc = (v) => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return `${header.map(esc).join(',')}\n${dataRows.map((r) => header.map((h) => esc(r[h])).join(',')).join('\n')}\n`;
}

function col(row, ...names) {
  for (const n of names) {
    if (row[n] != null && String(row[n]).trim() !== '') return row[n];
  }
  return '';
}

function isExcludedWeapon(id, tier) {
  const normalized = String(id ?? '').trim().toLowerCase();
  const t = String(tier ?? '').trim();
  if (!normalized.startsWith('w_')) return true;
  if (/_vmock_/.test(normalized)) return true;
  if (/_wave$/.test(normalized)) return true;
  if (t === '웨이브' || t === '테스트') return true;
  return false;
}

function toWeaponModel(row) {
  return {
    id: col(row, 'id'),
    familyKind: col(row, '종류', 'familyKind'),
    damage: Number(col(row, '대미지', 'damage')) || 1,
    cooldownMs: Number(col(row, '재장전ms', 'cooldownMs')) || 1800,
    rangePx: Number(col(row, '사거리px', 'rangePx')) || 150,
    salvoCount: Number(col(row, '연발수', 'salvoCount')) || 1,
    salvoIntervalMs: Number(col(row, '연발간격ms', 'salvoIntervalMs')) || 0,
    projectileSpeedPxPerSec: Number(col(row, '탄속px초', 'projectileSpeedPxPerSec')) || 64,
    requiredLevel: Number(col(row, '요구레벨', 'requiredLevel')) || 1,
    tierLabel: col(row, '등급라벨', 'tierLabel'),
  };
}

function main() {
  const weaponRows = loadCsv(WEAPON_CSV);
  if (weaponRows.length === 0) {
    console.error('weapon_list.csv missing or empty');
    process.exit(1);
  }
  const familyPolicyByKind = loadFamilyPolicyFromRows(loadCsv(FAMILY_POLICY_CSV));
  const combatRef = loadCombatRefFromKvRows(loadCsv(COMBAT_REF_CSV));
  const ttkRebalanceSkipIds = new Set(
    loadCsv(SPECIAL_POLICY_CSV)
      .filter((row) => String(row.excludeFromTtkRebalance ?? '').trim().toLowerCase() === 'true')
      .map((row) => String(row.weaponId ?? '').trim())
      .filter(Boolean),
  );

  const header = Object.keys(weaponRows[0]);
  const damageKey = header.find((h) => h === '대미지' || h === 'damage') ?? '대미지';
  const cooldownKey = header.find((h) => h === '재장전ms' || h === 'cooldownMs') ?? '재장전ms';

  const models = weaponRows.map((row) => ({ row, weapon: toWeaponModel(row) }));
  const anchorByLevel = new Map();

  for (const { weapon } of models) {
    if (isExcludedWeapon(weapon.id, weapon.tierLabel)) continue;
    if (weapon.familyKind !== 'laser') continue;
    if (weapon.tierLabel !== combatRef.anchorTierLabel) continue;
    const dps = computeWeaponRawDps(weapon, 'laser', combatRef, familyPolicyByKind).rawDps;
    const level = weapon.requiredLevel;
    const prev = anchorByLevel.get(level);
    if (prev == null || dps < prev) anchorByLevel.set(level, dps);
  }

  let changed = 0;
  for (const { row, weapon } of models) {
    if (isExcludedWeapon(weapon.id, weapon.tierLabel)) continue;
    if (ttkRebalanceSkipIds.has(weapon.id)) continue;
    const level = weapon.requiredLevel;
    let anchor = anchorByLevel.get(level);
    if (anchor == null) {
      for (const [lv, dps] of anchorByLevel.entries()) {
        if (lv <= level) anchor = anchor == null ? dps : Math.max(anchor, dps);
      }
    }
    if (anchor == null) anchor = computeWeaponRawDps(
      { familyKind: 'laser', damage: 4, cooldownMs: 1800, salvoCount: 1, rangePx: 151, projectileSpeedPxPerSec: 5200 },
      'laser',
      combatRef,
      familyPolicyByKind,
    ).rawDps;

    const next = rebalanceWeaponRow(weapon, anchor, combatRef, familyPolicyByKind);
    if (Number(row[damageKey]) !== next.damage || Number(row[cooldownKey]) !== next.cooldownMs) {
      row[damageKey] = String(next.damage);
      row[cooldownKey] = String(next.cooldownMs);
      changed += 1;
    }
  }

  writeFileSync(WEAPON_CSV, serializeCsv(header, weaponRows), 'utf8');
  console.log(`[rebalance-weapon-ttk] updated ${changed} weapons in weapon_list.csv`);
}

main();
