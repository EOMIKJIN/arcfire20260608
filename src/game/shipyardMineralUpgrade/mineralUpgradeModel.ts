// ============================================================
// 조선소 광물 업그레이드 상한 — tables/content/mineral_upgrade_level_caps.csv
// ============================================================

/** CSV 정본과 동기 — 빌드 스크립트 미연동 시 인라인 유지 */
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
