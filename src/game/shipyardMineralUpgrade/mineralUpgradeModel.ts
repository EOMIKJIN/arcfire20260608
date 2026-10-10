// ============================================================
// 조선소 함선 강화(광물 강화) — 정본 모델 (Table-First · 2026-10-10)
//   tables/content/mineral_upgrade_level_caps.csv   (파일럿 레벨 상한)
//   tables/content/mineral_upgrade_stats.csv        (강화 스탯·노출·소요시간)
//   tables/balance/hull_upgrade_tier_policy.csv     (함선 등급별 강화 상한·레벨당 효과 %)
//   tables/balance/hull_upgrade_cost.csv            (등급·스탯·목표 레벨별 크레딧·광물)
//   → 등급 표는 tools/balance-tables/derive-hull-upgrade-ladder.mjs 가 규칙으로 생성
// 대표님 결정(10-10): 강화 완료 = 그 함선 원래 능력치의 160% · 다음 본 등급 기본형의 87.5%
//                    · 강화 총비용 = 다음 본 등급 구매가의 80% · 함선별 저장(넘겨주지 않음)
// 스탯 적용은 ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance 경유.
// ============================================================

import { resolveShipyardMineralUpgradeCapForLevel } from '../../arcCore/balance/facilityShipyardLevelPolicy';
import {
  MINERAL_UPGRADE_LEVEL_CAPS_FROM_CSV,
  MINERAL_UPGRADE_STATS_FROM_CSV,
  type MineralUpgradeStatCsvRow,
} from '../../data/generated/csvMineralUpgrade';
import { HullUpgradeTierPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated/csvHullUpgradeTierPolicy';
import { HullUpgradeCost_FROM_BALANCE_CSV } from '../../data/balance/generated/csvHullUpgradeCost';

/** 강화 효과 종류 — ShipPerformanceCalculator 에서 해석 */
export type MineralUpgradeEffectKind = MineralUpgradeStatCsvRow['effectKind'];

export type MineralUpgradeGroup = MineralUpgradeStatCsvRow['upgradeGroup'];

export type MineralUpgradeStatDef = MineralUpgradeStatCsvRow;

/** 강화 목록 — upgradeEnabled=FALSE(효과 미구현 등) 행 제외 */
export const MINERAL_UPGRADE_STATS: readonly MineralUpgradeStatDef[] = MINERAL_UPGRADE_STATS_FROM_CSV
  .filter((s) => s.upgradeEnabled)
  .slice()
  .sort((a, b) => a.sortOrder - b.sortOrder);

const MINERAL_UPGRADE_LEVEL_CAPS = MINERAL_UPGRADE_LEVEL_CAPS_FROM_CSV;

export type HullUpgradeTier = {
  hullTierKey: string;
  upgradeCap: number;
  hpPctPerLevel: number;
  shieldPctPerLevel: number;
  damagePctPerLevel: number;
  fireRateCooldownMulPerLevel: number;
  turnPctPerLevel: number;
  totalCostCredits: number;
};

const TIER_BY_KEY = new Map<string, HullUpgradeTier>(
  HullUpgradeTierPolicy_FROM_BALANCE_CSV.map((r) => [
    String(r.hullTierKey),
    {
      hullTierKey: String(r.hullTierKey),
      upgradeCap: Number(r.upgradeCap) || 0,
      hpPctPerLevel: Number(r.hpPctPerLevel) || 0,
      shieldPctPerLevel: Number(r.shieldPctPerLevel) || 0,
      damagePctPerLevel: Number(r.damagePctPerLevel) || 0,
      fireRateCooldownMulPerLevel: Number(r.fireRateCooldownMulPerLevel) || 1,
      turnPctPerLevel: Number(r.turnPctPerLevel) || 0,
      totalCostCredits: Number(r.totalCostCredits) || 0,
    },
  ]),
);

/** 함선 등급 강화 규칙 — 표에 없는 등급(사다리 밖)은 null(강화 불가) */
export function getHullUpgradeTier(hullTierKey: string | null | undefined): HullUpgradeTier | null {
  return TIER_BY_KEY.get(String(hullTierKey ?? '').trim()) ?? null;
}

export function resolveMineralUpgradeMaxLevel(combatLevel: number): number {
  const lv = Math.max(1, Math.floor(Number.isFinite(combatLevel) ? combatLevel : 1));
  for (const row of MINERAL_UPGRADE_LEVEL_CAPS) {
    if (lv <= row.combatLevelMaxInclusive) return row.maxUpgradeLevel;
  }
  return MINERAL_UPGRADE_LEVEL_CAPS[MINERAL_UPGRADE_LEVEL_CAPS.length - 1]?.maxUpgradeLevel ?? 0;
}

/** 최종 상한 = min(파일럿 레벨 상한, 조선소 상한, 함선 등급 상한) */
export function getFinalMineralUpgradeCap(
  combatLevel: number,
  shipyardLevel: number,
  hullTierKey?: string | null,
): number {
  const combatCap = resolveMineralUpgradeMaxLevel(combatLevel);
  const shipyardCap = shipyardLevel > 0
    ? resolveShipyardMineralUpgradeCapForLevel(shipyardLevel)
    : combatCap;
  const tier = hullTierKey === undefined ? null : getHullUpgradeTier(hullTierKey);
  const hullCap = hullTierKey === undefined ? combatCap : (tier?.upgradeCap ?? 0);
  return Math.min(combatCap, shipyardCap, hullCap);
}

/** statId·목표레벨 기준 강화 소요시간(초) — CSV `durationSec` */
export function resolveMineralUpgradeDurationSec(
  statId: string,
  _targetLevel: number,
): number {
  return STAT_ALL_BY_ID.get(statId)?.durationSec ?? 0;
}

/** job 진행률(0~100) — 시작·완료 시각 기반. 게이지 표시에 사용. */
export function resolveMineralUpgradeJobProgressPct(
  job: { startedAtMs: number; completeAtMs: number } | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!job) return 0;
  const total = job.completeAtMs - job.startedAtMs;
  if (total <= 0) return 100;
  const elapsed = nowMs - job.startedAtMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

/** 효과 해석용 — 숨긴 행 포함(기존 저장 레벨 해석) */
const STAT_ALL_BY_ID = new Map(MINERAL_UPGRADE_STATS_FROM_CSV.map((s) => [s.statId, s]));
/** 강화 가능(노출) 스탯 */
const STAT_BY_ID = new Map(MINERAL_UPGRADE_STATS.map((s) => [s.statId, s]));

export function listMineralUpgradeStats(): readonly MineralUpgradeStatDef[] {
  return MINERAL_UPGRADE_STATS;
}

export function getMineralUpgradeStatDef(statId: string): MineralUpgradeStatDef | undefined {
  return STAT_ALL_BY_ID.get(statId);
}

export function isMineralUpgradeStatId(statId: string): boolean {
  return STAT_BY_ID.has(statId);
}

export type MineralUpgradeCost = { credits: number; ores: { oreId: string; qty: number }[] };

const COST_BY_KEY = new Map<string, MineralUpgradeCost>();
for (const r of HullUpgradeCost_FROM_BALANCE_CSV) {
  const key = `${r.hullTierKey}|${r.statId}|${r.targetLevel}`;
  const c = COST_BY_KEY.get(key) ?? { credits: 0, ores: [] };
  c.credits += Number(r.credits) || 0;
  const qty = Number(r.oreQty) || 0;
  if (r.oreId && qty > 0) {
    // 같은 광물은 합친다(검사·차감 일치)
    const same = c.ores.find((o) => o.oreId === String(r.oreId));
    if (same) same.qty += qty;
    else c.ores.push({ oreId: String(r.oreId), qty });
  }
  COST_BY_KEY.set(key, c);
}

/** 함선 등급·스탯·목표 레벨 강화 비용(크레딧 + 광물). 표에 없으면 null(강화 불가). */
export function getMineralUpgradeCost(
  hullTierKey: string | null | undefined,
  statId: string,
  targetLevel: number,
): MineralUpgradeCost | null {
  return COST_BY_KEY.get(`${String(hullTierKey ?? '').trim()}|${statId}|${Math.max(1, Math.floor(targetLevel))}`) ?? null;
}

/** 광물 단가로 환산한 강화 1회 투자액(크레딧) — 함선 판매가 반영용 */
export function mineralUpgradeCostCreditValue(
  cost: MineralUpgradeCost,
  orePrice: (oreId: string) => number,
): number {
  let v = cost.credits;
  for (const o of cost.ores) v += o.qty * Math.max(0, orePrice(o.oreId));
  return Math.round(v);
}

/**
 * statId 의 현재 레벨 효과량(함선 등급별 · hull_upgrade_tier_policy).
 * - ship_hp_pct / ship_shield_pct / weapon_damage_pct: 1 + 레벨 × 레벨당% (배수)
 * - ship_turn_rate_mul_per_level: 1 + 레벨 × 레벨당% (배수)
 * - weapon_fire_rate_cooldown: 레벨당 배수^레벨 (하한은 적용 시 effectFloor)
 * 등급 표가 없으면 효과 없음(배수 1).
 */
export function computeMineralUpgradeEffectScalar(
  statId: string,
  level: number,
  hullTierKey?: string | null,
): number {
  const def = STAT_ALL_BY_ID.get(statId);
  const tier = getHullUpgradeTier(hullTierKey);
  const lv = Math.max(0, Math.floor(level));
  if (!def || !tier || lv <= 0) return 1;
  const capped = Math.min(lv, tier.upgradeCap);
  switch (def.effectKind) {
    case 'ship_hp_pct':
      return 1 + capped * tier.hpPctPerLevel;
    case 'ship_shield_pct':
      return 1 + capped * tier.shieldPctPerLevel;
    case 'weapon_damage_pct':
      return 1 + capped * tier.damagePctPerLevel;
    case 'ship_turn_rate_mul_per_level':
      return 1 + capped * tier.turnPctPerLevel;
    case 'weapon_fire_rate_cooldown':
      return Math.pow(tier.fireRateCooldownMulPerLevel, capped);
    default:
      return 1;
  }
}
