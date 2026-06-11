/**
 * 무기 가격 정책 ↔ 아크코어 경제 연동 점검
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  computeWeaponRawDps,
  loadCombatRefFromKvRows,
  loadFamilyPolicyFromRows,
} from '../balance-tables/weapon-ttk-balance-model.mjs';

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

function loadKvCsv(rel) {
  const raw = readFileSync(resolve(ROOT, 'tables/balance', rel), 'utf8').trim();
  const rows = parseCsv(raw);
  return Object.fromEntries(rows.slice(1).map((c) => [c[0], c[1]]));
}

function loadTableCsv(rel) {
  const raw = readFileSync(resolve(ROOT, 'tables/balance', rel), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0];
  return rows.slice(1).map((cols) => Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ''])));
}

function pickWeapon(id) {
  const raw = readFileSync(resolve(ROOT, 'tables/content/weapon_list.csv'), 'utf8');
  const rows = parseCsv(raw);
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

export function runWeaponEconomyLinkageChecks() {
  const checks = [];

  const push = (name, ok, detail) => checks.push({ name, ok, detail });

  const policy = loadKvCsv('weapon_trade_base_price_policy.csv');
  push('pricing_model=integrated_leveling_v2', policy.pricing_model === 'integrated_leveling_v2', policy.pricing_model ?? 'missing');
  push('arcCore weaponTradePricing entry', existsSync(resolve(ROOT, 'src/arcCore/economy/weaponTradePricing.ts')), 'src/arcCore/economy/weaponTradePricing.ts');
  push('TradeEngine imports arcCore pricing', readFileSync(resolve(ROOT, 'src/engine/TradeEngine.ts'), 'utf8').includes('arcCore/economy/weaponTradePricing'), 'TradeEngine.ts');

  for (const table of [
    'weapon_combat_reference_policy.csv',
    'weapon_family_ttk_balance_policy.csv',
    'weapon_special_combat_balance_policy.csv',
  ]) {
    push(`balance table ${table}`, existsSync(resolve(ROOT, 'tables/balance', table)), table);
  }

  const special = loadTableCsv('weapon_special_combat_balance_policy.csv');
  const novaPolicy = special.find((r) => r.weaponId === 'w_missile_nova_01');
  push('nova special policy row', Boolean(novaPolicy), 'w_missile_nova_01');

  const standard = pickWeapon('w_missile_standard_01');
  const nova = pickWeapon('w_missile_nova_01');
  if (standard && nova) {
    push('nova purchasePrice > standard', nova.purchasePrice > standard.purchasePrice, `${nova.purchasePrice} vs ${standard.purchasePrice}`);
    const minNova = Number(novaPolicy?.minPurchasePriceCredits) || 0;
    push('nova policy minPurchase >= csv', minNova <= 0 || minNova === nova.purchasePrice, `policy=${minNova} csv=${nova.purchasePrice}`);
  }

  const tradeEngine = readFileSync(resolve(ROOT, 'src/engine/TradeEngine.ts'), 'utf8');
  push('weapon price uses demandMul inside resolver', readFileSync(resolve(ROOT, 'src/economy/integratedWeaponTradePricing.ts'), 'utf8').includes("getEconomyCategoryPriceMul('weapon')"), 'integratedWeaponTradePricing.ts');
  push('weapon TradeEngine no double category mul', !tradeEngine.includes("resolveItemCategoryPriceMul('weapon") && tradeEngine.includes('resolveIntegratedWeaponTradePrice'), 'single mul path');

  const ref = loadCombatRefFromKvRows(loadTableCsv('weapon_combat_reference_policy.csv').map((r) => ({ key: r.key, value: r.value })));
  const fam = loadFamilyPolicyFromRows(loadTableCsv('weapon_family_ttk_balance_policy.csv'));
  if (standard && nova) {
    const stdDps = computeWeaponRawDps(standard, standard.familyKind, ref, fam).rawDps;
    push('standard missile rebalance anchor ~1.0', stdDps > 0.5 && stdDps < 1.2, stdDps.toFixed(3));
  }

  return checks;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const checks = runWeaponEconomyLinkageChecks();
  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(c.ok ? 'OK' : 'FAIL', c.name, c.detail ?? '');
  }
  if (failed.length) process.exitCode = 1;
}
