// ============================================================
// 플레이어 보유 스킬 — effect.stat 합산 (Table-First csvSkills)
// ============================================================

import { usePlayerStore } from '../store/playerStore';
import { sumOwnedSkillStatBonus } from './ownedSkillStatBonus';

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  return ownedSkillIds ?? usePlayerStore.getState().player?.skills ?? [];
}

/** 보유 스킬 중 `effect.stat` 일치 합산 — passive/active 구분 없음 */
export function resolvePlayerOwnedSkillStatBonus(
  statKey: string,
  ownedSkillIds?: readonly string[],
): number {
  return sumOwnedSkillStatBonus(statKey, readOwnedSkillIds(ownedSkillIds));
}

export function playerOwnsSkill(skillId: string): boolean {
  const id = String(skillId ?? '').trim();
  if (!id) return false;
  return readOwnedSkillIds().includes(id);
}
