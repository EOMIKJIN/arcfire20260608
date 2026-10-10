// ============================================================
// 보유 스킬 effect.stat 합산 — store 없음 (테스트·견적 공용)
// ============================================================

import { SKILLS_FROM_CSV } from '../data/generated';

/**
 * 보유 스킬 중 effect.stat 이 statKey 인 것이 있는가 — 스킬 id 대신 CSV 효과 스탯으로 판정(Table-First · 2026-10-10).
 * 값이 0인 효과(예: 수수료 면제 service_fee)도 보유만으로 true.
 */
export function ownsSkillWithStat(
  statKey: string,
  ownedSkillIds: readonly string[],
): boolean {
  const key = String(statKey ?? '').trim();
  if (!key) return false;
  for (let i = 0; i < ownedSkillIds.length; i += 1) {
    if (SKILLS_FROM_CSV[ownedSkillIds[i]!]?.effect?.stat === key) return true;
  }
  return false;
}

export function sumOwnedSkillStatBonus(
  statKey: string,
  ownedSkillIds: readonly string[],
): number {
  const key = String(statKey ?? '').trim();
  if (!key || ownedSkillIds.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < ownedSkillIds.length; i += 1) {
    const skill = SKILLS_FROM_CSV[ownedSkillIds[i]!];
    if (!skill?.effect?.stat || skill.effect.stat !== key) continue;
    const v = Number(skill.effect.value);
    if (Number.isFinite(v)) sum += v;
  }
  return sum;
}
