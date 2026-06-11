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

function loadCsv(rel) {
  const raw = readFileSync(resolve(ROOT, 'tables', rel), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0];
  return rows.slice(1).map((cols) => Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ''])));
}

function pickWeapon(id) {
  const rows = parseCsv(readFileSync(resolve(ROOT, 'tables/content/weapon_list.csv'), 'utf8'));
  const header = rows[0];
  const row = rows.slice(1).find((c) => c[0] === id);
  if (!row) return null;
  const o = Object.fromEntries(header.map((h, i) => [h, row[i]]));
  return {
    id,
    familyKind: o['종류'],
    damage: Number(o['대미지']),
    cooldownMs: Number(o['재장전ms']),
    rangePx: Number(o['사거리px']),
    salvoCount: Number(o['연발수']),
    salvoIntervalMs: Number(o['연발간격ms']),
    projectileSpeedPxPerSec: Number(o['탄속px초']),
    purchasePrice: Number(o['구매가']),
  };
}

const ref = loadCombatRefFromKvRows(loadCsv('balance/weapon_combat_reference_policy.csv'));
const fam = loadFamilyPolicyFromRows(loadCsv('balance/weapon_family_ttk_balance_policy.csv'));
const specialRows = loadCsv('balance/weapon_special_combat_balance_policy.csv');
const specialById = new Map(specialRows.map((r) => [r.weaponId, r]));

function projectileCycleSec(weapon) {
  const salvo = Math.max(1, weapon.salvoCount || 1);
  const salvoSpanMs = salvo > 1 ? (salvo - 1) * Math.max(0, weapon.salvoIntervalMs || 0) : 0;
  const speed = Math.max(1, weapon.projectileSpeedPxPerSec || 64);
  const rangePx = Math.max(40, weapon.rangePx || 150);
  const travelOverlap = 0.35;
  const travelSec = (rangePx * 0.72) / speed;
  return Math.max(0.12, weapon.cooldownMs) / 1000 + salvoSpanMs / 1000 + travelSec * (1 - travelOverlap);
}

function pricingDps(weapon) {
  const { rawDps } = computeWeaponRawDps(weapon, weapon.familyKind, ref, fam);
  const special = specialById.get(weapon.id);
  if (!special) return rawDps;
  const w = Number(special.pricingAoeBlendWeight) || 0;
  if (w <= 0) return rawDps;
  const hull = Number(ref.hull_hp_reference ?? 300);
  const frac = Number(special.pricingAoeHullFraction) || 0;
  const targets = Number(special.pricingAoeTargetCount) || 1;
  const cycle = projectileCycleSec(weapon);
  const aoeDps = (hull * frac * targets) / cycle;
  return rawDps * (1 - w) + aoeDps * w;
}

for (const id of ['w_missile_standard_01', 'w_missile_nova_01']) {
  const w = pickWeapon(id);
  const dps = pricingDps(w);
  const floor = Number(specialById.get(id)?.minPurchasePriceCredits) || w.purchasePrice;
  console.log(
    id,
    `csv구매가=${w.purchasePrice}`,
    `가격하한=${floor}`,
    `단일DPS=${computeWeaponRawDps(w, w.familyKind, ref, fam).rawDps.toFixed(3)}`,
    `가격용DPS=${dps.toFixed(3)}`,
    `cd=${w.cooldownMs}ms`,
  );
}
