// ============================================================
// 아크파이어 온라인 - D20 수치 테이블
// ============================================================

import { DiceDef } from '../types';
import { ENEMY_TEMPLATES_FROM_CSV, PLAYER_LEVEL_EXP_FROM_CSV } from './generated';

// 레벨별 경험치 테이블(1-indexed): 값 = 해당 레벨의 누적 도달 경험치
export const EXP_TABLE: number[] = (() => {
  const maxLv = PLAYER_LEVEL_EXP_FROM_CSV.reduce((m, r) => Math.max(m, r.level), 1);
  const table = new Array<number>(maxLv + 1).fill(0);
  for (const row of PLAYER_LEVEL_EXP_FROM_CSV) {
    table[row.level] = row.currentExp;
  }
  return table;
})();

/** 플레이어 최고 레벨(현재 CSV 기준 60) */
export const MAX_PLAYER_LEVEL = Math.max(1, EXP_TABLE.length - 1);

// 레벨별 숙련도 보너스 (D&D 5e 스타일)
export const PROFICIENCY_BONUS: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
};

// 적 레벨별 스탯 테이블
export interface EnemyTemplate {
  id: string;
  name: string;
  level: number;
  hp: number;
  shield: number;
  armor: number;         // AC
  attackBonus: number;
  damageDice: DiceDef;
  expReward: number;
  creditReward: number;
}

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = Object.fromEntries(
  Object.entries(ENEMY_TEMPLATES_FROM_CSV).map(([id, row]) => [
    id,
    {
      id: row.id,
      name: row.name,
      level: row.level,
      hp: row.hp,
      shield: row.shield,
      armor: row.armor,
      attackBonus: row.attackBonus,
      damageDice: {
        count: row.damageDiceCount,
        sides: row.damageDiceSides,
        bonus: row.damageDiceBonus,
      },
      expReward: row.expReward,
      creditReward: row.creditReward,
    } satisfies EnemyTemplate,
  ]),
);

// 기본 플레이어 스탯
export const DEFAULT_PLAYER_STATS = {
  strength:     10,
  dexterity:    10,
  constitution: 10,
  intelligence: 10,
  wisdom:       10,
  charisma:     10,
};

// 레벨업 시 스킬 포인트
export const SKILL_POINTS_PER_LEVEL = 1;
