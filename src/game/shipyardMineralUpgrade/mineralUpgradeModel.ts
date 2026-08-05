// ============================================================
// 조선소 광물 업그레이드 — 정본 모델 (기존 CSV 테이블 인라인 동기)
//   tables/content/mineral_upgrade_level_caps.csv  (강화 상한)
//   tables/content/mineral_upgrade_stats.csv       (강화 스탯 9종·효과)
//   tables/content/mineral_upgrade_cost_lines.csv  (스탯별 ore 비용)
//   tables/content/mineral_upgrade_ore_pools.csv   (ore 분류)
// 빌드 스크립트 미연동 → 인라인 유지(수정 시 CSV 동기). 기획안 v1은 UI 참고.
// 스탯 적용은 ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance 경유.
// ============================================================

import { resolveShipyardMineralUpgradeCapForLevel } from '../../arcCore/balance/facilityShipyardLevelPolicy';

/** 강화 효과 종류 — ShipPerformanceCalculator 에서 해석 */
export type MineralUpgradeEffectKind =
  | 'ship_bonus_max_hp'
  | 'ship_bonus_max_shield'
  | 'ship_turn_rate_mul_per_level'
  | 'weapon_damage_flat'
  | 'weapon_fire_rate_cooldown'
  | 'weapon_range_flat';

export type MineralUpgradeGroup = 'ship' | 'weapon_laser' | 'weapon_missile';

export type MineralUpgradeStatDef = {
  statId: string;
  label: string;
  upgradeGroup: MineralUpgradeGroup;
  sortOrder: number;
  perLevelHint: string;
  effectKind: MineralUpgradeEffectKind;
  /** 레벨당 효과량(flat은 가산, mul/cooldown은 배수, per level 누적) */
  effectValuePerLevel: number;
  /** cooldown 류 하한(ms 등) */
  effectFloor: number;
};

export type MineralUpgradeCostLine = { statId: string; oreId: string; qtyPerTargetLevel: number };

/** mineral_upgrade_stats.csv 정본 동기 */
/** label/perLevelHint = EN fallback; UI uses `mineralStat.label.*` / `mineralStat.hint.*` */
export const MINERAL_UPGRADE_STATS: readonly MineralUpgradeStatDef[] = [
  { statId: 'ship_hull_hp', label: 'Hull Durability (HP)', upgradeGroup: 'ship', sortOrder: 1, perLevelHint: '+50 Max HP', effectKind: 'ship_bonus_max_hp', effectValuePerLevel: 50, effectFloor: 0 },
  { statId: 'ship_shield', label: 'Shield', upgradeGroup: 'ship', sortOrder: 2, perLevelHint: '+30 Max Shield', effectKind: 'ship_bonus_max_shield', effectValuePerLevel: 30, effectFloor: 0 },
  { statId: 'ship_turn_speed', label: 'Turn Speed', upgradeGroup: 'ship', sortOrder: 3, perLevelHint: '+3% Turn Rate', effectKind: 'ship_turn_rate_mul_per_level', effectValuePerLevel: 0.03, effectFloor: 0 },
  { statId: 'weapon_laser_damage', label: 'Laser Damage', upgradeGroup: 'weapon_laser', sortOrder: 4, perLevelHint: '+1 DMG', effectKind: 'weapon_damage_flat', effectValuePerLevel: 1, effectFloor: 0 },
  { statId: 'weapon_laser_fire_rate', label: 'Laser Fire Rate', upgradeGroup: 'weapon_laser', sortOrder: 5, perLevelHint: 'Cooldown -5%', effectKind: 'weapon_fire_rate_cooldown', effectValuePerLevel: 0.95, effectFloor: 120 },
  { statId: 'weapon_laser_range', label: 'Laser Range', upgradeGroup: 'weapon_laser', sortOrder: 6, perLevelHint: '+8 px', effectKind: 'weapon_range_flat', effectValuePerLevel: 8, effectFloor: 0 },
  { statId: 'weapon_missile_damage', label: 'Missile Damage', upgradeGroup: 'weapon_missile', sortOrder: 7, perLevelHint: '+1 DMG', effectKind: 'weapon_damage_flat', effectValuePerLevel: 1, effectFloor: 0 },
  { statId: 'weapon_missile_fire_rate', label: 'Missile Fire Rate', upgradeGroup: 'weapon_missile', sortOrder: 8, perLevelHint: 'Cooldown -5%', effectKind: 'weapon_fire_rate_cooldown', effectValuePerLevel: 0.95, effectFloor: 120 },
  { statId: 'weapon_missile_range', label: 'Missile Range', upgradeGroup: 'weapon_missile', sortOrder: 9, perLevelHint: '+10 px', effectKind: 'weapon_range_flat', effectValuePerLevel: 10, effectFloor: 0 },
];

/** mineral_upgrade_cost_lines.csv 정본 동기 — N강 비용 = qtyPerTargetLevel × N */
export const MINERAL_UPGRADE_COST_LINES: readonly MineralUpgradeCostLine[] = [
  { statId: 'ship_hull_hp', oreId: 'ore_ferrite', qtyPerTargetLevel: 12 },
  { statId: 'ship_hull_hp', oreId: 'ore_silicate', qtyPerTargetLevel: 8 },
  { statId: 'ship_shield', oreId: 'ore_ferrite', qtyPerTargetLevel: 11 },
  { statId: 'ship_shield', oreId: 'ore_silicate', qtyPerTargetLevel: 7 },
  { statId: 'ship_turn_speed', oreId: 'ore_ferrite', qtyPerTargetLevel: 8 },
  { statId: 'ship_turn_speed', oreId: 'ore_silicate', qtyPerTargetLevel: 4 },
  { statId: 'ship_turn_speed', oreId: 'ore_crystal', qtyPerTargetLevel: 2 },
  { statId: 'weapon_laser_damage', oreId: 'ore_ferrite', qtyPerTargetLevel: 9 },
  { statId: 'weapon_laser_damage', oreId: 'ore_silicate', qtyPerTargetLevel: 6 },
  { statId: 'weapon_laser_fire_rate', oreId: 'ore_ferrite', qtyPerTargetLevel: 9 },
  { statId: 'weapon_laser_fire_rate', oreId: 'ore_silicate', qtyPerTargetLevel: 5 },
  { statId: 'weapon_laser_fire_rate', oreId: 'ore_crystal', qtyPerTargetLevel: 1 },
  { statId: 'weapon_laser_range', oreId: 'ore_ferrite', qtyPerTargetLevel: 7 },
  { statId: 'weapon_laser_range', oreId: 'ore_silicate', qtyPerTargetLevel: 5 },
  { statId: 'weapon_missile_damage', oreId: 'ore_ferrite', qtyPerTargetLevel: 11 },
  { statId: 'weapon_missile_damage', oreId: 'ore_silicate', qtyPerTargetLevel: 7 },
  { statId: 'weapon_missile_fire_rate', oreId: 'ore_ferrite', qtyPerTargetLevel: 10 },
  { statId: 'weapon_missile_fire_rate', oreId: 'ore_silicate', qtyPerTargetLevel: 6 },
  { statId: 'weapon_missile_fire_rate', oreId: 'ore_crystal', qtyPerTargetLevel: 1 },
  { statId: 'weapon_missile_range', oreId: 'ore_ferrite', qtyPerTargetLevel: 8 },
  { statId: 'weapon_missile_range', oreId: 'ore_silicate', qtyPerTargetLevel: 6 },
];

/** mineral_upgrade_level_caps.csv 정본 동기 */
const MINERAL_UPGRADE_LEVEL_CAPS: readonly { combatLevelMaxInclusive: number; maxUpgradeLevel: number }[] = [
  { combatLevelMaxInclusive: 14, maxUpgradeLevel: 5 },
  { combatLevelMaxInclusive: 30, maxUpgradeLevel: 8 },
  { combatLevelMaxInclusive: 50, maxUpgradeLevel: 12 },
  { combatLevelMaxInclusive: 999, maxUpgradeLevel: 15 },
];

export function resolveMineralUpgradeMaxLevel(combatLevel: number): number {
  const lv = Math.max(1, Math.floor(Number.isFinite(combatLevel) ? combatLevel : 1));
  for (const row of MINERAL_UPGRADE_LEVEL_CAPS) {
    if (lv <= row.combatLevelMaxInclusive) return row.maxUpgradeLevel;
  }
  return 15;
}

/** combatLevel 캡 × 조선소 mineralUpgradeCap — §2-3 설계 정본 */
export function getFinalMineralUpgradeCap(combatLevel: number, shipyardLevel: number): number {
  const combatCap = resolveMineralUpgradeMaxLevel(combatLevel);
  const shipyardCap = shipyardLevel > 0
    ? resolveShipyardMineralUpgradeCapForLevel(shipyardLevel)
    : combatCap;
  return Math.min(combatCap, shipyardCap);
}

/**
 * 강화 소요시간 기본값(초) — 행성개발 게이지와 동일한 진행 표시를 위한 디폴트.
 * 조건·수치(스탯·목표레벨별 차등, 조선소 레벨 단축 등)는 향후 조절 예정.
 */
export const MINERAL_UPGRADE_DEFAULT_DURATION_SEC = 60;

/**
 * statId·목표레벨 기준 강화 소요시간(초). 현재는 기본 디폴트만 반환하며,
 * 향후 스탯 그룹·레벨·조선소 등급에 따른 차등을 이 함수에 확장한다.
 */
export function resolveMineralUpgradeDurationSec(
  _statId: string,
  _targetLevel: number,
): number {
  return MINERAL_UPGRADE_DEFAULT_DURATION_SEC;
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

const STAT_BY_ID = new Map(MINERAL_UPGRADE_STATS.map((s) => [s.statId, s]));

export function listMineralUpgradeStats(): readonly MineralUpgradeStatDef[] {
  return MINERAL_UPGRADE_STATS;
}

export function getMineralUpgradeStatDef(statId: string): MineralUpgradeStatDef | undefined {
  return STAT_BY_ID.get(statId);
}

export function isMineralUpgradeStatId(statId: string): boolean {
  return STAT_BY_ID.has(statId);
}

/** statId 의 N강(목표 레벨) 달성에 필요한 ore 비용 목록 — qtyPerTargetLevel × targetLevel */
export function getMineralUpgradeOreCost(
  statId: string,
  targetLevel: number,
): { oreId: string; qty: number }[] {
  const lv = Math.max(1, Math.floor(targetLevel));
  return MINERAL_UPGRADE_COST_LINES
    .filter((c) => c.statId === statId)
    .map((c) => ({ oreId: c.oreId, qty: c.qtyPerTargetLevel * lv }));
}

/**
 * statId 의 현재 레벨 효과량.
 * - flat 류(hp/shield/damage/range): value × level
 * - mul per level(turn): (1 + perLevel)^level 배수
 * - cooldown: perLevel^level 배수(하한은 적용 시 effectFloor 로 클램프)
 */
export function computeMineralUpgradeEffectScalar(statId: string, level: number): number {
  const def = STAT_BY_ID.get(statId);
  if (!def) return 0;
  const lv = Math.max(0, Math.floor(level));
  if (lv <= 0) {
    return def.effectKind === 'ship_turn_rate_mul_per_level' || def.effectKind === 'weapon_fire_rate_cooldown' ? 1 : 0;
  }
  switch (def.effectKind) {
    case 'ship_turn_rate_mul_per_level':
      return Math.pow(1 + def.effectValuePerLevel, lv);
    case 'weapon_fire_rate_cooldown':
      return Math.pow(def.effectValuePerLevel, lv);
    default:
      return def.effectValuePerLevel * lv;
  }
}
