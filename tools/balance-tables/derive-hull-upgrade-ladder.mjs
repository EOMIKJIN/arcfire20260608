#!/usr/bin/env node
/**
 * 함선 곡선 × 함선 강화 (대표님 결정 2026-10-10)
 *   - 강화 완료 = 그 함선 원래 능력치(HP·실드·화력)의 upgrade_full_stat_mul(160%)
 *   - 강화 완료 = 다음 본 등급 기본형의 upgrade_cap_ratio_of_next(87.5%)
 *     → 본 등급 한 단계 능력치 배수 S = 1.6 ÷ 0.875 ≈ 1.83
 *   - 강화 총비용(크레딧 환산) = 다음 본 등급 구매가 × upgrade_cost_ratio_of_next_price(80%) · 마지막 등급은 자기 가격
 *   - 반 단계(_upgraded)는 대표님 결정 보류 중 → 앞뒤 본 등급의 중간(S^0.5) · 강화 규칙은 본 등급과 같게 둠
 *
 * 쓰기(모두 테이블):
 *   tables/content/npc_ai_ships.csv            사다리 함선 maxHp·maxShield·damageDiceBonus (지급 함선 = 기준, 변경 없음)
 *   tables/balance/hull_upgrade_tier_policy.csv 등급별 강화 상한·레벨당 효과
 *   tables/balance/hull_upgrade_cost.csv        등급·스탯·목표 레벨별 크레딧·광물
 *
 * npm run balance:hull-upgrade-ladder   (선행: npm run balance:progression-spine)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const P_BAL = (n) => `tables/balance/${n}`;
const P_CON = (n) => `tables/content/${n}`;

function parseLine(line) {
  const r = []; let f = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; } else f += c;
  }
  r.push(f);
  return r;
}
const esc = (s) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
function table(path) {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const h = parseLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((l) => { const c = parseLine(l); return Object.fromEntries(h.map((k, i) => [k, c[i] ?? ''])); });
}
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

const policy = new Map(table(P_BAL('progression_ladder_policy.csv')).map((r) => [r.key, num(r.value, NaN)]));
const P = (k) => { const v = policy.get(k); if (!Number.isFinite(v)) throw new Error(`progression_ladder_policy.csv ${k} 없음`); return v; };
const FULL = P('upgrade_full_stat_mul');
const S = FULL / P('upgrade_cap_ratio_of_next');

// ── 사다리 ──────────────────────────────────────────────────────
const hullRows = table(P_BAL('capital_hull_purchase_policy.csv'));
const ladder = hullRows
  .filter((r) => r.ladderListed === 'TRUE' && r.ladderStep !== '')
  .map((r) => ({ key: r.hullTierKey, step: num(r.ladderStep), target: num(r.targetPurchaseLevel, 1), price: num(r.purchaseCredits) }))
  .sort((a, b) => a.step - b.step);
const mains = ladder.filter((t) => Number.isInteger(t.step));
const nextMain = (t) => mains.find((m) => m.step > t.step);

// ── 함선 능력치: 지급 함선(Player_npc_red_fleet_1 · 트윈 STARTER)을 기준으로 S^step ─────
const listing = table(P_BAL('capital_ship_trade_listing_policy.csv'));
const shipsOf = (tier) => {
  const out = [];
  for (const r of listing) {
    if (r.hullTierKey !== tier || r.canonicalNpcShipId === 'player_wave_ship') continue;
    if (r.canonicalNpcShipId) out.push(r.canonicalNpcShipId);
    if (r.alternateNpcShipId) out.push(r.alternateNpcShipId);
  }
  return [...new Set(out)];
};
const shipText = readFileSync(P_CON('npc_ai_ships.csv'), 'utf8');
const shipNl = shipText.includes('\r\n') ? '\r\n' : '\n';
const shipLines = shipText.split(shipNl);
const shipHeader = parseLine(shipLines[0].replace(/^﻿/, ''));
const I = Object.fromEntries(shipHeader.map((k, i) => [k, i]));
const shipCols = new Map();
shipLines.forEach((l, i) => { if (i > 0 && l) { const c = parseLine(l); shipCols.set(c[I.id], { i, c }); } });
const stat = (id) => {
  const c = shipCols.get(id)?.c;
  if (!c) throw new Error(`npc_ai_ships.csv ${id} 없음`);
  const count = num(c[I.damageDiceCount], 1), sides = num(c[I.damageDiceSides], 6), bonus = num(c[I.damageDiceBonus]);
  return { hp: num(c[I.maxHp]), sh: num(c[I.maxShield]), base: count * (sides + 1) / 2, bonus, mean: count * (sides + 1) / 2 + bonus };
};
const STARTER = 'Player_npc_red_fleet_1';
const ref = stat(STARTER);
const shipOut = [];
for (const t of ladder) {
  if (t.step === 0) continue;
  const mul = Math.pow(S, t.step); // 반 단계 = S^(k+0.5)
  const ids = shipsOf(t.key);
  const canon = stat(ids[0]);
  for (const id of ids) {
    const s = stat(id);
    // 같은 등급 대체 함선(파이터/레인저)은 기준 함선 대비 비율 유지
    const hp = Math.round(ref.hp * mul * (s.hp / canon.hp));
    const sh = Math.round(ref.sh * mul * (canon.sh > 0 ? s.sh / canon.sh : 1));
    const mean = ref.mean * mul * (s.mean / canon.mean);
    const bonus = Math.max(0, Math.round(mean - s.base));
    const row = shipCols.get(id);
    row.c[I.maxHp] = String(hp);
    row.c[I.maxShield] = String(sh);
    row.c[I.damageDiceBonus] = String(bonus);
    shipLines[row.i] = row.c.map(esc).join(',');
    shipOut.push(`${t.key} ${id} ×${mul.toFixed(2)} → HP ${hp} 실드 ${sh} 주사위 +${bonus}`);
  }
}
writeFileSync(P_CON('npc_ai_ships.csv'), shipLines.join(shipNl), 'utf8');

// ── 등급별 강화 정책 ─────────────────────────────────────────────
const caps = table(P_CON('mineral_upgrade_level_caps.csv')).map((r) => ({ lv: num(r.combatLevelMaxInclusive), cap: num(r.maxUpgradeLevel) })).sort((a, b) => a.lv - b.lv);
const capAt = (lv) => (caps.find((c) => lv <= c.lv) ?? caps[caps.length - 1]).cap;
const zones = table(P_BAL('planet_leveling_progression.csv')).map((z) => ({ z: num(z.zoneIndex), lv: num(z.recommendedPilotLevel) })).sort((a, b) => a.lv - b.lv || a.z - b.z);
const zoneAt = (lv) => zones.filter((z) => z.lv <= lv).slice(-1)[0]?.z ?? 1;
const oreTiers = table(P_BAL('mining_mineral_zone_tier.csv'));
const oresAt = (lv) => {
  const z = zoneAt(lv);
  const row = oreTiers.find((r) => z >= num(r.zoneIndexMin) && z <= num(r.zoneIndexMax)) ?? oreTiers[oreTiers.length - 1];
  const pool = String(row.allowedMineralIdsPipe).split('|').filter(Boolean);
  return [row.primaryMineralId, pool.find((o) => o !== row.primaryMineralId) ?? row.primaryMineralId];
};
const orePrice = new Map(table(P_BAL('mining_sell_price_policy.csv')).map((r) => [r.mineralId, num(r.sellPriceCredits)]));

const stats = table(P_CON('mineral_upgrade_stats.csv')).filter((s) => s.upgradeEnabled === 'TRUE');
const dpsHalf = Math.sqrt(FULL); // 화력 160% = 피해 ×√1.6 × 연사 ×√1.6
const tierOut = ['hullTierKey,upgradeCap,hpPctPerLevel,shieldPctPerLevel,damagePctPerLevel,fireRateCooldownMulPerLevel,turnPctPerLevel,totalCostCredits,primaryOreId,secondaryOreId,notesKo'];
const costOut = ['hullTierKey,statId,targetLevel,credits,oreId,oreQty'];
const orePer = P('upgrade_ore_qty_per_level');
for (const t of ladder) {
  const cap = capAt(t.target);
  const next = nextMain(t);
  const budget = Math.round(P('upgrade_cost_ratio_of_next_price') * (next ? next.price : t.price));
  const [o1, o2] = oresAt(Math.max(1, t.target));
  const hpPct = (FULL - 1) / cap;
  const dmgPct = (dpsHalf - 1) / cap;
  const fireMul = Math.pow(1 / dpsHalf, 1 / cap);
  const turnPct = P('upgrade_turn_pct_at_cap') / cap;
  tierOut.push([t.key, cap, hpPct.toFixed(5), hpPct.toFixed(5), dmgPct.toFixed(5), fireMul.toFixed(5), turnPct.toFixed(5), budget, o1, o2,
    `강화 완료 능력치 ×${FULL} · 총비용 = ${next ? `${next.key} 가격` : '자기 가격'} × ${P('upgrade_cost_ratio_of_next_price')}`].map(esc).join(','));
  // 비용: 스탯별 균등 · 레벨 가중(목표 레벨 i 에 i 비례) · 광물(관문) 값을 뺀 나머지를 크레딧
  const perStat = budget / stats.length;
  const wSum = (cap * (cap + 1)) / 2;
  for (const s of stats) {
    for (let lv = 1; lv <= cap; lv++) {
      const value = perStat * (lv / wSum);
      const q1 = Math.ceil((orePer * lv) / 2), q2 = Math.floor((orePer * lv) / 2);
      const oreValue = q1 * (orePrice.get(o1) ?? 0) + q2 * (orePrice.get(o2) ?? 0);
      const credits = Math.max(0, Math.round((value - oreValue) / 100) * 100);
      // 주력·부가 광물이 같은 종류(초반 구간)면 한 줄로 합친다
      if (o1 === o2) {
        costOut.push([t.key, s.statId, lv, credits, o1, q1 + q2].join(','));
      } else {
        costOut.push([t.key, s.statId, lv, credits, o1, q1].join(','));
        if (q2 > 0) costOut.push([t.key, s.statId, lv, 0, o2, q2].join(','));
      }
    }
  }
}
writeFileSync(P_BAL('hull_upgrade_tier_policy.csv'), tierOut.join('\n') + '\n', 'utf8');
writeFileSync(P_BAL('hull_upgrade_cost.csv'), costOut.join('\n') + '\n', 'utf8');

console.log(`[hull-upgrade-ladder] S(본 등급 능력치 배수) = ${S.toFixed(4)} · 강화 완료 ×${FULL}`);
for (const l of shipOut) console.log('  ' + l);
for (const l of tierOut.slice(1)) console.log('  ' + l.split(',').slice(0, 8).join(' '));
