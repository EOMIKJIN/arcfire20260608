/**
 * 전함 풀강(광물 업그레이드 최상단) 스펙·가치 추산 — 김경제 밸런스 참고 산출물
 *   npx tsx tools/ship-upgrade-value/run-ship-upgrade-value.ts
 *
 * 목적: 게임 내 모든 플레이어 보유·강화 가능 전함이 광물 자원으로 가능한
 *       최종 강화(전역 최대 15강, 9스탯 전부)를 마쳤을 때
 *       (1) 최종 전투 스펙, (2) 무역소 가격 정본 성능지수 가치, (3) EHP×DPS 전투력 지수,
 *       (4) 광물 투자 환산 크레딧 + 최종 추산 가치를 데이터화한다.
 *       추후 전투밸런스·경제밸런스 재조정의 베이스로 사용한다.
 *
 * 정본 재사용:
 *   - 강화 모델: src/game/shipyardMineralUpgrade/mineralUpgradeModel
 *   - 적용 로직: src/combat/ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance
 *   - 가치(성능지수): src/arcCore/balance/capitalShipPerformancePricing
 *   - 광물 환산: tables/balance/mining_sell_price_policy.csv (정본 동기)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import type { NpcCapitalCombatStats } from '../../src/types';

// RN 자산(require('*.png') 등)을 헤드리스 node에서 스텁 — 레지스트리(포트레이트 자산) 체인 차단.
// require.extensions 등록 후 동적 import 해야 적용되므로 app 모듈은 main()에서 await import.
const headlessRequire = createRequire(import.meta.url);
for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ttf', '.otf']) {
  (headlessRequire.extensions as NodeJS.Dict<(m: NodeModule, filename: string) => void>)[ext] = (
    m: NodeModule,
  ) => {
    m.exports = 0;
  };
}

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, 'tools/ship-upgrade-value/reports');
const BALANCE_CSV = path.join(ROOT, 'tables/balance/capital_ship_max_upgrade_value.csv');

// main()에서 동적 import 후 채워지는 app 바인딩 (자산 스텁 적용 이후 로드 필요).
/* eslint-disable @typescript-eslint/no-explicit-any */
let listAllNpcCapitalShipRows: () => readonly any[];
let resolveCapitalShipPerformanceBasePrice: (npcShipId: string) => number;
let scoreCapitalCombatStats: (c: NpcCapitalCombatStats) => number;
let resolveHullTierKeyForTradeCatalogShip: (npcShipId: string) => string;
let applyMineralUpgradeToShipPerformance: (perf: any, state: Record<string, number>) => any;
let NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV: Record<string, any>;
let MINERAL_UPGRADE_STATS: readonly { statId: string }[];
let MINERAL_UPGRADE_COST_LINES: readonly { statId: string; oreId: string; qtyPerTargetLevel: number }[];
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 전역 최대 강화 레벨(최상단) — combatLevel 상한 밴드의 max(15). main()에서 확정. */
let MAX_UPGRADE_LEVEL = 15;

async function loadAppModules(): Promise<void> {
  const registry = await import('../../src/npc/npcFleetRegistry');
  const pricing = await import('../../src/arcCore/balance/capitalShipPerformancePricing');
  const listing = await import('../../src/arcCore/balance/capitalShipTradeListingPolicy');
  const calc = await import('../../src/combat/ShipPerformanceCalculator');
  const gen = await import('../../src/data/generated/csvNpcCapitalShips');
  const model = await import('../../src/game/shipyardMineralUpgrade/mineralUpgradeModel');

  listAllNpcCapitalShipRows = registry.listAllNpcCapitalShipRows;
  resolveCapitalShipPerformanceBasePrice = pricing.resolveCapitalShipPerformanceBasePrice;
  scoreCapitalCombatStats = pricing.scoreCapitalCombatStats;
  resolveHullTierKeyForTradeCatalogShip = listing.resolveHullTierKeyForTradeCatalogShip;
  applyMineralUpgradeToShipPerformance = calc.applyMineralUpgradeToShipPerformance;
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV = gen.NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV;
  MINERAL_UPGRADE_STATS = model.MINERAL_UPGRADE_STATS;
  MINERAL_UPGRADE_COST_LINES = model.MINERAL_UPGRADE_COST_LINES;
  MAX_UPGRADE_LEVEL = model.resolveMineralUpgradeMaxLevel(999);
}

/** ore → 판매 환산 크레딧 (mining_sell_price_policy.csv 정본 동기) */
const ORE_SELL_PRICE_CREDITS: Record<string, number> = {
  ore_ferrite: 10,
  ore_silicate: 12,
  ore_crystal: 52,
};

/** 풀강 상태: 9개 스탯 전부 MAX_UPGRADE_LEVEL */
function buildFullUpgradeState(): Record<string, number> {
  const state: Record<string, number> = {};
  for (const stat of MINERAL_UPGRADE_STATS) state[stat.statId] = MAX_UPGRADE_LEVEL;
  return state;
}

/**
 * 풀강 총 광물 비용. 각 레벨 k 비용 = qtyPerTargetLevel × k 이므로
 * 1→N 누적 = qtyPerTargetLevel × N(N+1)/2. (전함 무관·전역 동일)
 */
function computeFullUpgradeOreCost(): Record<string, number> {
  const triangular = (MAX_UPGRADE_LEVEL * (MAX_UPGRADE_LEVEL + 1)) / 2;
  const totals: Record<string, number> = {};
  for (const line of MINERAL_UPGRADE_COST_LINES) {
    totals[line.oreId] = (totals[line.oreId] ?? 0) + line.qtyPerTargetLevel * triangular;
  }
  return totals;
}

function oreCostToCredits(oreTotals: Record<string, number>): number {
  let credits = 0;
  for (const [oreId, qty] of Object.entries(oreTotals)) {
    credits += qty * (ORE_SELL_PRICE_CREDITS[oreId] ?? 0);
  }
  return Math.round(credits);
}

function diceMean(combat: NpcCapitalCombatStats): number {
  const d = combat.damageDice;
  return d.count * ((d.sides + 1) / 2) + d.bonus;
}

function cooldownMean(min?: number, max?: number): number {
  const lo = typeof min === 'number' ? min : undefined;
  const hi = typeof max === 'number' ? max : undefined;
  if (lo != null && hi != null) return (lo + hi) / 2;
  if (lo != null) return lo;
  if (hi != null) return hi;
  return 0;
}

/**
 * EHP×DPS 전투력 지수 — 가격 성능지수가 못 잡는 연사(쿨다운)·실드 가치를 반영(전투밸런스 참고).
 *   EHP = maxHp + maxShield + armor×8 (가격 모델 armor 가중과 동일 스케일)
 *   DPS = diceMean × (1000/laserCd + 1000/missileCd)   (laser/missile 데미지는 공용 damageDice)
 *   power = EHP × DPS / 1000
 */
function combatPowerIndex(
  combat: NpcCapitalCombatStats,
  laserCdMs: number,
  missileCdMs: number,
): number {
  const ehp = combat.maxHp + combat.maxShield + combat.armor * 8;
  const dmg = diceMean(combat);
  const laserDps = laserCdMs > 0 ? (dmg * 1000) / laserCdMs : 0;
  const missileDps = missileCdMs > 0 ? (dmg * 1000) / missileCdMs : 0;
  return (ehp * (laserDps + missileDps)) / 1000;
}

function pct(base: number, full: number): number {
  if (base <= 0) return 0;
  return ((full - base) / base) * 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type Row = {
  npcShipId: string;
  shipName: string;
  hullTier: string;
  archetype: string;
  ownable: boolean;
  maxUpgradeLevel: number;
  baseMaxHp: number;
  baseMaxShield: number;
  baseArmor: number;
  baseDmgBonus: number;
  baseDiceMean: number;
  fullMaxHp: number;
  fullMaxShield: number;
  fullArmor: number;
  fullDmgBonus: number;
  fullDiceMean: number;
  baseLaserCdMs: number;
  fullLaserCdMs: number;
  baseMissileCdMs: number;
  fullMissileCdMs: number;
  basePerfScore: number;
  fullPerfScore: number;
  perfScoreGainPct: number;
  baseCombatPower: number;
  fullCombatPower: number;
  combatPowerGainPct: number;
  baseTradePrice: number;
  mineralInvestCredits: number;
  finalEstimatedValue: number;
  perfScaledValue: number;
};

async function main(): Promise<void> {
  await loadAppModules();
  const fullState = buildFullUpgradeState();
  const oreTotals = computeFullUpgradeOreCost();
  const mineralInvestCredits = oreCostToCredits(oreTotals);

  const ships = listAllNpcCapitalShipRows()
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  const rows: Row[] = [];
  for (const ship of ships) {
    const runtime = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[ship.id];
    const basePerf = { combat: ship.combat, runtimeConfig: runtime };
    const fullPerf = applyMineralUpgradeToShipPerformance(
      { combat: { ...ship.combat, damageDice: { ...ship.combat.damageDice } }, runtimeConfig: runtime ? { ...runtime } : runtime },
      fullState,
    );

    const baseLaserCd = cooldownMean(runtime?.laserCooldownJitterMinMs, runtime?.laserCooldownJitterMaxMs);
    const baseMissileCd = cooldownMean(runtime?.missileCooldownJitterMinMs, runtime?.missileCooldownJitterMaxMs);
    const fullLaserCd = cooldownMean(
      fullPerf.runtimeConfig?.laserCooldownJitterMinMs,
      fullPerf.runtimeConfig?.laserCooldownJitterMaxMs,
    );
    const fullMissileCd = cooldownMean(
      fullPerf.runtimeConfig?.missileCooldownJitterMinMs,
      fullPerf.runtimeConfig?.missileCooldownJitterMaxMs,
    );

    const basePerfScore = scoreCapitalCombatStats(basePerf.combat);
    const fullPerfScore = scoreCapitalCombatStats(fullPerf.combat);
    const baseCombatPower = combatPowerIndex(basePerf.combat, baseLaserCd, baseMissileCd);
    const fullCombatPower = combatPowerIndex(fullPerf.combat, fullLaserCd, fullMissileCd);

    const baseTradePrice = resolveCapitalShipPerformanceBasePrice(ship.id);
    const perfScaledValue =
      basePerfScore > 0 ? Math.round(baseTradePrice * (fullPerfScore / basePerfScore)) : baseTradePrice;
    const finalEstimatedValue = baseTradePrice + mineralInvestCredits;

    rows.push({
      npcShipId: ship.id,
      shipName: ship.name,
      hullTier: resolveHullTierKeyForTradeCatalogShip(ship.id),
      archetype: ship.combat.capitalShipArchetype ?? 'neutral',
      ownable: Boolean(ship.tradePortListed) || String(ship.id).startsWith('Player_'),
      maxUpgradeLevel: MAX_UPGRADE_LEVEL,
      baseMaxHp: basePerf.combat.maxHp,
      baseMaxShield: basePerf.combat.maxShield,
      baseArmor: basePerf.combat.armor,
      baseDmgBonus: basePerf.combat.damageDice.bonus,
      baseDiceMean: round1(diceMean(basePerf.combat)),
      fullMaxHp: fullPerf.combat.maxHp,
      fullMaxShield: fullPerf.combat.maxShield,
      fullArmor: fullPerf.combat.armor,
      fullDmgBonus: fullPerf.combat.damageDice.bonus,
      fullDiceMean: round1(diceMean(fullPerf.combat)),
      baseLaserCdMs: Math.round(baseLaserCd),
      fullLaserCdMs: Math.round(fullLaserCd),
      baseMissileCdMs: Math.round(baseMissileCd),
      fullMissileCdMs: Math.round(fullMissileCd),
      basePerfScore: Math.round(basePerfScore),
      fullPerfScore: Math.round(fullPerfScore),
      perfScoreGainPct: round1(pct(basePerfScore, fullPerfScore)),
      baseCombatPower: Math.round(baseCombatPower),
      fullCombatPower: Math.round(fullCombatPower),
      combatPowerGainPct: round1(pct(baseCombatPower, fullCombatPower)),
      baseTradePrice,
      mineralInvestCredits,
      finalEstimatedValue,
      perfScaledValue,
    });
  }

  writeBalanceCsv(rows, oreTotals, mineralInvestCredits);
  writeReport(rows, oreTotals, mineralInvestCredits);

  // eslint-disable-next-line no-console
  console.log(
    `[ship-upgrade-value] ships=${rows.length} maxLevel=${MAX_UPGRADE_LEVEL} ` +
      `mineralInvestCredits=${mineralInvestCredits}\n` +
      `  → ${path.relative(ROOT, BALANCE_CSV)}\n` +
      `  → ${path.relative(ROOT, path.join(REPORTS, 'latest.md'))}`,
  );
}

const CSV_HEADER = [
  'npcShipId',
  'shipName',
  'hullTier',
  'archetype',
  'ownable',
  'maxUpgradeLevel',
  'baseMaxHp',
  'fullMaxHp',
  'baseMaxShield',
  'fullMaxShield',
  'baseArmor',
  'fullArmor',
  'baseDmgBonus',
  'fullDmgBonus',
  'baseDiceMean',
  'fullDiceMean',
  'baseLaserCdMs',
  'fullLaserCdMs',
  'baseMissileCdMs',
  'fullMissileCdMs',
  'basePerfScore',
  'fullPerfScore',
  'perfScoreGainPct',
  'baseCombatPower',
  'fullCombatPower',
  'combatPowerGainPct',
  'baseTradePrice',
  'mineralInvestCredits',
  'finalEstimatedValue',
  'perfScaledValue',
];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeBalanceCsv(
  rows: Row[],
  oreTotals: Record<string, number>,
  mineralInvestCredits: number,
): void {
  const oreNote = Object.entries(oreTotals)
    .map(([ore, qty]) => `${ore}:${qty}`)
    .join(' ');
  const lines: string[] = [];
  lines.push(
    `# GENERATED by tools/ship-upgrade-value/run-ship-upgrade-value.ts — 직접 편집 금지. ` +
      `풀강(${MAX_UPGRADE_LEVEL}강·9스탯) 전함 스펙·가치 추산. ` +
      `광물투자=${mineralInvestCredits}cr (${oreNote}). 전투/경제 밸런스 참고용.`,
  );
  lines.push(CSV_HEADER.join(','));
  for (const r of rows) {
    lines.push(
      [
        r.npcShipId,
        r.shipName,
        r.hullTier,
        r.archetype,
        r.ownable ? 1 : 0,
        r.maxUpgradeLevel,
        r.baseMaxHp,
        r.fullMaxHp,
        r.baseMaxShield,
        r.fullMaxShield,
        r.baseArmor,
        r.fullArmor,
        r.baseDmgBonus,
        r.fullDmgBonus,
        r.baseDiceMean,
        r.fullDiceMean,
        r.baseLaserCdMs,
        r.fullLaserCdMs,
        r.baseMissileCdMs,
        r.fullMissileCdMs,
        r.basePerfScore,
        r.fullPerfScore,
        r.perfScoreGainPct,
        r.baseCombatPower,
        r.fullCombatPower,
        r.combatPowerGainPct,
        r.baseTradePrice,
        r.mineralInvestCredits,
        r.finalEstimatedValue,
        r.perfScaledValue,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  fs.mkdirSync(path.dirname(BALANCE_CSV), { recursive: true });
  fs.writeFileSync(BALANCE_CSV, `\uFEFF${lines.join('\n')}\n`, 'utf8');
}

function writeReport(
  rows: Row[],
  oreTotals: Record<string, number>,
  mineralInvestCredits: number,
): void {
  const ts = new Date().toISOString();
  const ownable = rows.filter((r) => r.ownable);
  const rankBase = ownable.length > 0 ? ownable : rows;
  const avgPerfGain = round1(rankBase.reduce((s, r) => s + r.perfScoreGainPct, 0) / Math.max(1, rankBase.length));
  const avgPowerGain = round1(rankBase.reduce((s, r) => s + r.combatPowerGainPct, 0) / Math.max(1, rankBase.length));
  const topPower = rankBase.slice().sort((a, b) => b.fullCombatPower - a.fullCombatPower).slice(0, 10);
  const topGain = rankBase.slice().sort((a, b) => b.combatPowerGainPct - a.combatPowerGainPct).slice(0, 10);

  const oreNote = Object.entries(oreTotals)
    .map(([ore, qty]) => `\`${ore}\` ×${qty}`)
    .join(', ');

  const md: string[] = [];
  md.push('# 전함 풀강(광물 업그레이드 최상단) 스펙·가치 추산');
  md.push('');
  md.push(`- 생성: ${ts}`);
  md.push(`- 대상 전함: 전체 **${rows.length}척** (그중 보유·강화 가능 **${ownable.length}척**) · 최종 강화 레벨: **${MAX_UPGRADE_LEVEL}강** (9스탯 전부)`);
  md.push('- 랭킹·평균은 **보유·강화 가능 전함(ownable=1)** 기준 (적 NPC·테스트함은 광물 강화 비대상이라 제외).');
  md.push(`- 풀강 총 광물(전함 무관 동일): ${oreNote}`);
  md.push(`- 광물 투자 환산 크레딧(mining_sell_price 정본): **${mineralInvestCredits.toLocaleString()} cr**`);
  md.push(`- 평균 성능지수 증가: **${avgPerfGain}%** · 평균 전투력(EHP×DPS) 증가: **${avgPowerGain}%**`);
  md.push('');
  md.push('> 정본 데이터: `tables/balance/capital_ship_max_upgrade_value.csv` — 전투/경제 밸런스 재조정 베이스.');
  md.push('');
  md.push('## 풀강 전투력 상위 10');
  md.push('');
  md.push('| 전함 | 체급 | 타입 | 풀강 EHP기여(HP/실드) | 풀강 전투력 | 증가율 | 최종추산가치(cr) |');
  md.push('|------|------|------|------|------|------|------|');
  for (const r of topPower) {
    md.push(
      `| ${r.shipName} | ${r.hullTier} | ${r.archetype} | ${r.fullMaxHp}/${r.fullMaxShield} | ` +
        `${r.fullCombatPower.toLocaleString()} | +${r.combatPowerGainPct}% | ${r.finalEstimatedValue.toLocaleString()} |`,
    );
  }
  md.push('');
  md.push('## 풀강 전투력 증가율 상위 10 (강화 수혜가 큰 전함)');
  md.push('');
  md.push('| 전함 | 체급 | base→full 전투력 | 증가율 | base→full 성능지수 |');
  md.push('|------|------|------|------|------|');
  for (const r of topGain) {
    md.push(
      `| ${r.shipName} | ${r.hullTier} | ${r.baseCombatPower.toLocaleString()}→${r.fullCombatPower.toLocaleString()} | ` +
        `+${r.combatPowerGainPct}% | ${r.basePerfScore.toLocaleString()}→${r.fullPerfScore.toLocaleString()} |`,
    );
  }
  md.push('');
  md.push('## 해석·한계 (정직 고지)');
  md.push('');
  md.push('- **성능지수 가치**: 무역소 가격 정본(`combatPerformanceScore`)으로 HP·실드·무기 데미지만 반영. 무역소 등재가는 체급 기준가 ±14% 클램프라 풀강이 등재가를 크게 바꾸지 않음 — `perfScaledValue`는 클램프 제거 시 내재가치(참고).');
  md.push('- **전투력 지수(EHP×DPS)**: 가격 모델이 못 잡는 연사(쿨다운 −5%/lv)·실드를 반영한 실전 가치 — 전투밸런스 재조정의 주 참고축.');
  md.push('- **선회속도·사거리** 강화는 본 지수에 미반영(기동/교전거리 효과는 별도 시뮬 필요). 사거리(`weapon_range_flat`)는 calculator v1에서 미적용 상태.');
  md.push('- **광물 투자 가치**는 전함과 무관하게 동일하므로, 저티어 전함일수록 투자 대비 상대 가치 상승폭이 큼 — 경제 밸런스에서 티어별 광물 sink 차등 검토 권장.');
  md.push('');

  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(path.join(REPORTS, 'latest.md'), md.join('\n'), 'utf8');
}

main().catch((err) => {
  console.error('[ship-upgrade-value] FAILED', err);
  process.exit(1);
});
