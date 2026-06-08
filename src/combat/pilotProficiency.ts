// ============================================================
// 마스터 사양서 §3 — 파일럿 레벨 ↔ 전투 운용 효율
// combatLevel = floor(player.level); proficiencyMultiplier = 1 + combatLevel * 0.01
// ============================================================

export function resolveCombatLevel(playerLevel: number): number {
  return Math.max(1, Math.floor(Number.isFinite(playerLevel) ? playerLevel : 1));
}

/** CSV 테이블 행과 동일 선형식 — 레벨 1 = 1.01 */
export function resolveProficiencyMultiplier(combatLevel: number): number {
  const lv = resolveCombatLevel(combatLevel);
  return 1 + lv * 0.01;
}

export function resolveOperatingEfficiencyPct(combatLevel: number): number {
  return Math.round(resolveProficiencyMultiplier(combatLevel) * 100);
}

export function scaleStatByProficiency(baseCsvValue: number, combatLevel: number): number {
  return Math.round(baseCsvValue * resolveProficiencyMultiplier(combatLevel));
}
