// ============================================================
// 플레이어 보유 스킬 — effect.stat 합산 (Table-First csvSkills)
// ============================================================

import { SKILLS_FROM_CSV } from '../data/generated';
import { usePlayerStore } from '../store/playerStore';

/** 보유 스킬 중 `effect.stat` 일치 합산 — passive/active 구분 없음 */
export function resolvePlayerOwnedSkillStatBonus(statKey: string): number {
  const key = String(statKey ?? '').trim();
  if (!key) return 0;
  const owned = usePlayerStore.getState().player?.skills ?? [];
  if (owned.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < owned.length; i += 1) {
    const skill = SKILLS_FROM_CSV[owned[i]!];
    if (!skill?.effect?.stat || skill.effect.stat !== key) continue;
    const v = Number(skill.effect.value);
    if (Number.isFinite(v)) sum += v;
  }
  return sum;
}

export function playerOwnsSkill(skillId: string): boolean {
  const id = String(skillId ?? '').trim();
  if (!id) return false;
  const owned = usePlayerStore.getState().player?.skills ?? [];
  return owned.includes(id);
}
