import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  computeWeaponRawDps,
  loadCombatRefFromKvRows,
  loadFamilyPolicyFromRows,
} from './weapon-ttk-balance-model.mjs';

const ROOT = resolve(process.cwd());

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

function loadCsv(name) {
  const raw = readFileSync(resolve(ROOT, 'tables', name.includes('/') ? name : `balance/${name}`), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0];
  return rows.slice(1).map((cols) => Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ''])));
}

const weaponRows = parseCsv(readFileSync(resolve(ROOT, 'tables/content/weapon_list.csv'), 'utf8'));
const header = weaponRows[0];
const weapons = weaponRows.slice(1).map((cols) => Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ''])));
const ref = loadCombatRefFromKvRows(loadCsv('weapon_combat_reference_policy.csv'));
const fam = loadFamilyPolicyFromRows(loadCsv('weapon_family_ttk_balance_policy.csv'));

const anchor = computeWeaponRawDps(
  { familyKind: 'laser', damage: 4, cooldownMs: 1800, salvoCount: 1, rangePx: 151, projectileSpeedPxPerSec: 5600 },
  'laser',
  ref,
  fam,
).rawDps;

console.log('anchor laser dps', anchor.toFixed(3));
for (const id of [
  'w_laser_light_01',
  'w_missile_standard_01',
  'w_missile_barrage_01',
  'w_missile_arc_005',
  'w_missile_arc_003',
  'w_missile_arc_006',
]) {
  const row = weapons.find((w) => w.id === id);
  if (!row) continue;
  const w = {
    familyKind: row['종류'],
    damage: Number(row['대미지']),
    cooldownMs: Number(row['재장전ms']),
    rangePx: Number(row['사거리px']),
    salvoCount: Number(row['연발수']),
    salvoIntervalMs: Number(row['연발간격ms']),
    projectileSpeedPxPerSec: Number(row['탄속px초']),
  };
  const { rawDps } = computeWeaponRawDps(w, w.familyKind, ref, fam);
  console.log(
    id,
    w.familyKind,
    `dmg=${w.damage}`,
    `cd=${w.cooldownMs}`,
    `dps=${rawDps.toFixed(3)}`,
    `vs_anchor=${(rawDps / anchor).toFixed(3)}`,
  );
}
