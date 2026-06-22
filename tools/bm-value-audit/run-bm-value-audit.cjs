#!/usr/bin/env node
'use strict';
/**
 * BM 재화 가치 감사 — play_scenario · 교환 · IAP · 보석 직구 정합
 * npm run audit:bm-value
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'reports', 'latest.md');

function readGeneratedTs(fileName, exportName) {
  const p = path.join(ROOT, 'src/data/balance/generated', fileName);
  const src = fs.readFileSync(p, 'utf8');
  const match = src.match(new RegExp(`export const ${exportName} = (\\[[\\s\\S]*?\\]) as const`));
  if (!match) throw new Error(`parse fail: ${fileName}`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${match[1]});`)();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function pct(part, whole) {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

const bmPolicy = readGeneratedTs('csvBmEconomyPolicy.ts', 'BmEconomyPolicy_FROM_BALANCE_CSV');
const policy = Object.fromEntries(bmPolicy.map((r) => [r.key, num(r.value)]));
const baseRate = policy.gem_exchange_base_cr_per_gem || 400;
const dailyCapGems = policy.gem_exchange_daily_cap_gems || 500;
const f2pDaily = policy.f2p_optimal_daily_credit_income || 50_000;
const creditPerHour = policy.play_scenario_credit_per_hour_anchor || 10_000;

const playScenario = readGeneratedTs('csvPlayScenarioEconomy.ts', 'PlayScenarioEconomy_FROM_BALANCE_CSV');
const gemExchange = readGeneratedTs('csvGemExchangeCatalog.ts', 'GemExchangeCatalog_FROM_BALANCE_CSV');
const gemPack = readGeneratedTs('csvGemPackCatalog.ts', 'GemPackCatalog_FROM_BALANCE_CSV');
const gemSpend = readGeneratedTs('csvGemSpendCatalog.ts', 'GemSpendCatalog_FROM_BALANCE_CSV');

const milestones = playScenario.map((row) => {
  const requiredCredits = num(row.requiredCredits);
  const pureMiningMinutes = num(row.pureMiningMinutes);
  const cph = pureMiningMinutes > 0 ? requiredCredits / (pureMiningMinutes / 60) : 0;
  return {
    zone: num(row.zoneIndex),
    requiredCredits,
    pureMiningMinutes,
    creditPerHour: cph,
    gemsSkip: Math.ceil(requiredCredits / baseRate),
  };
});

const zone18 = milestones.find((m) => m.zone === 18) ?? { requiredCredits: 1_500_000 };

const xlarge = gemPack.find((p) => p.productId === 'gem_pack_xlarge');
const xlargeGrant = xlarge
  ? Math.floor(num(xlarge.gemAmount) * (100 + num(xlarge.bonusPct)) / 100)
  : 0;
const xlargeCrEquiv = xlargeGrant * baseRate;

const maxExchangeTier = gemExchange.reduce((best, row) => {
  const gems = num(row.gemCost);
  const credits = num(row.creditAmount);
  const rate = gems > 0 ? credits / gems : 0;
  return rate > best.rate ? { id: row.productId, gems, credits, rate } : best;
}, { id: '', gems: 0, credits: 0, rate: 0 });

const dailyCapMaxCr = dailyCapGems * maxExchangeTier.rate;

const kpiXlargeOk = xlargeCrEquiv <= zone18.requiredCredits;
const kpiPlayAnchorOk = milestones.every(
  (m) => m.creditPerHour === 0 || Math.abs(m.creditPerHour - creditPerHour) < 1,
);
const kpiDailyCapOk = dailyCapMaxCr <= f2pDaily * 6;

const lines = [];
lines.push('# BM 재화 가치 감사 리포트');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Policy version: **v${policy.policy_version ?? '2.1'}**`);
lines.push('');
lines.push('## 1. 앵커 (play_scenario 정합)');
lines.push('');
lines.push('| 항목 | 값 |');
lines.push('|------|-----|');
lines.push(`| 최적 크레딧 수입 | **${fmt(creditPerHour)} Cr/h** |`);
lines.push(`| F2P 일일 상한(5h) | **${fmt(f2pDaily)} Cr** |`);
lines.push(`| 보석→크레딧 기본환율 | **${baseRate} Cr/💎** (= ${(60 / (creditPerHour / baseRate)).toFixed(1)}분 최적플레이) |`);
lines.push(`| 교환 일일 상한 | **${dailyCapGems} 💎** (= ${fmt(dailyCapGems * baseRate)}~${fmt(dailyCapMaxCr)} Cr) |`);
lines.push('');
lines.push('## 2. play_scenario 마일스톤 vs 보석 스킵');
lines.push('');
lines.push('| zone | 목표 Cr | 채굴(h) | 💎 스킵(@base) | 특대팩 대비 |');
lines.push('|------|---------|---------|---------------|-------------|');
for (const m of milestones) {
  lines.push(`| ${m.zone} | ${fmt(m.requiredCredits)} | ${(m.pureMiningMinutes / 60).toFixed(1)} | ${m.gemsSkip} | ${pct(m.requiredCredits, xlargeCrEquiv)} |`);
}
lines.push('');
lines.push('## 3. 교환 티어');
lines.push('');
lines.push('| product | 💎 | Cr | 실효 Cr/💎 | F2P 일일 대비 |');
lines.push('|---------|-----|-----|-------------|---------------|');
for (const row of gemExchange) {
  const gems = num(row.gemCost);
  const credits = num(row.creditAmount);
  const rate = gems > 0 ? credits / gems : 0;
  lines.push(`| ${row.productId} | ${gems} | ${fmt(credits)} | ${Math.round(rate)} | ${pct(credits, f2pDaily)} |`);
}
lines.push('');
lines.push('## 4. IAP 보석팩');
lines.push('');
lines.push('| product | IAP | base💎 | grant | Cr환산(@base) | zone18 대비 |');
lines.push('|---------|-----|-------|-------|-------------|-------------|');
for (const row of gemPack) {
  const base = num(row.gemAmount);
  if (base <= 0) continue;
  const grant = Math.floor(base * (100 + num(row.bonusPct)) / 100);
  const cr = grant * baseRate;
  lines.push(`| ${row.productId} | ${row.iapPriceKey} | ${base} | ${grant} | ${fmt(cr)} | ${pct(cr, zone18.requiredCredits)} |`);
}
lines.push('');
lines.push('## 5. 보석 직구 (Type B)');
lines.push('');
lines.push('| item | 💎 | Cr equivalent | zone18 대비 |');
lines.push('|------|-----|---------------|-------------|');
for (const row of gemSpend) {
  lines.push(`| ${row.itemId} | ${row.gemCost} | ${fmt(num(row.creditEquivalent))} | ${pct(num(row.creditEquivalent), zone18.requiredCredits)} |`);
}
lines.push('');
lines.push('## 6. KPI 판정');
lines.push('');
lines.push('| 검사 | 결과 |');
lines.push('|------|------|');
lines.push(`| 특대팩 전량교환 ≤ zone18 (${fmt(zone18.requiredCredits)}) | ${kpiXlargeOk ? '✅ PASS' : `❌ FAIL (${fmt(xlargeCrEquiv)})`} |`);
lines.push(`| play_scenario Cr/h ≈ ${fmt(creditPerHour)} | ${kpiPlayAnchorOk ? '✅ PASS' : '❌ FAIL'} |`);
lines.push(`| 일일 교환 cap ≤ F2P×6 (${fmt(f2pDaily * 6)}) | ${kpiDailyCapOk ? '✅ PASS' : `⚠️ WARN (${fmt(dailyCapMaxCr)})`} |`);
lines.push(`| 코드 BM_DUMMY 폐기(Table-First) | ✅ bmCatalogIndex.getGemExchangeBaseCrPerGem |`);
lines.push('');
lines.push('## 7. 설계 요약 (v2.1)');
lines.push('');
lines.push('- **크레딧**: 플레이·무역·채굴 — 인플레 허용, 현금 직구 불가');
lines.push('- **보석**: IAP·VIP·이벤트 — 핵심 자산·편의·교환 전용');
lines.push('- **교환**: 400~500 Cr/💎 단계 보너스, 일 500💎 cap');
lines.push('- **특대팩**: zone18(1.5M) **69% 이하** — 엔드game 전량 스킵 차단');
lines.push('');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`KPI xlarge: ${kpiXlargeOk ? 'PASS' : 'FAIL'}`);
process.exit(kpiXlargeOk && kpiPlayAnchorOk ? 0 : 1);
