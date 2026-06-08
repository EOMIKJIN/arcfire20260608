// ============================================================
// 아크파이어 온라인 - 스킬 엔진
// ============================================================

import { Skill, Player } from '../types';
import { SKILLS } from '../data/skills';
import { EXP_TABLE, MAX_PLAYER_LEVEL, SKILL_POINTS_PER_LEVEL } from '../data/d20tables';

export function canLearnSkill(skill: Skill, player: Player): boolean {
  if (player.skills.includes(skill.id)) return false;
  if (player.level < skill.levelRequired) return false;
  if (player.skillPoints <= 0) return false;
  return skill.prerequisiteIds.every(id => player.skills.includes(id));
}

export function learnSkill(skill: Skill, player: Player): Player {
  if (!canLearnSkill(skill, player)) return player;
  return {
    ...player,
    skills: [...player.skills, skill.id],
    skillPoints: player.skillPoints - 1,
  };
}

export function getStatBonus(player: Player, stat: string): number {
  return player.skills.reduce((total, skillId) => {
    const skill = SKILLS[skillId];
    if (!skill) return total;
    if (skill.effect.type === 'passive' && skill.effect.stat === stat) {
      return total + (skill.effect.value ?? 0);
    }
    return total;
  }, 0);
}

export function processLevelUp(player: Player): { player: Player; leveledUp: boolean } {
  const nextLevel = player.level + 1;
  if (nextLevel > MAX_PLAYER_LEVEL) return { player, leveledUp: false };
  // EXP_TABLE[level] = 해당 레벨 도달 누적 경험치(currentExp)
  if (player.exp < (EXP_TABLE[nextLevel] ?? Infinity)) return { player, leveledUp: false };

  return {
    player: {
      ...player,
      level: nextLevel,
      skillPoints: player.skillPoints + SKILL_POINTS_PER_LEVEL,
      expToNext: EXP_TABLE[nextLevel + 1] ?? 999999,
    },
    leveledUp: true,
  };
}

export function gainExp(player: Player, amount: number): Player {
  return { ...player, exp: player.exp + amount };
}
