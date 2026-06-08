// ============================================================
// 아크파이어 온라인 - 스킬 트리
// ============================================================

import { Skill } from '../types';
import { SKILLS_FROM_CSV } from './generated';

export const SKILLS: Record<string, Skill> = SKILLS_FROM_CSV;

export const SKILLS_LIST = Object.values(SKILLS);

export const SKILL_CATEGORIES = {
  combat:     { name: '전투',   icon: '⚔' },
  navigation: { name: '항법',   icon: '🧭' },
  trade:      { name: '무역',   icon: '💰' },
  fleet:      { name: '함대',   icon: '🚢' },
} as const;
