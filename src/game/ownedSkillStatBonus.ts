// ============================================================
// 보유 스킬 effect.stat 합산 — store 없음 (테스트·견적 공용)
// ============================================================

import { SKILLS_FROM_CSV } from '../data/generated';

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
