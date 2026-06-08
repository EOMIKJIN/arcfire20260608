// ============================================================
// 연구소 스킬 트리 — 티어·열 배치 (2026-05 UI 스크린샷 + skills.csv 정본)
// tier는 CSV, column은 시각 트리 복구용(선행 관계는 CSV prerequisiteIds)
// ============================================================

import type { SkillCategory } from '../../types';
import { SKILLS } from '../../data/skills';

export type SkillTreeNodeLayout = {
  skillId: string;
  tier: number;
  /** 0=좌 / 1=중 / 2=우 */
  column: number;
};

/** 카테고리별 열 배치 — 스크린샷 전투 트리 분기 구조 기준 */
const SKILL_TREE_COLUMN_BY_ID: Record<SkillCategory, Record<string, number>> = {
  combat: {
    double_shot: 0,
    shield_overload: 2,
    armor_piercing: 0,
    emp_blast: 1,
    reactive_armor: 2,
    critical_focus: 0,
    plasma_cannon: 1,
    fortress_mode: 2,
    multi_lockon: 0,
    hull_regeneration: 2,
    singularity_cannon: 0,
    perfect_defense: 2,
  },
  navigation: {
    jump_boost: 0,
    sensor_array: 2,
    stealth_drive: 0,
    warp_stabilizer: 2,
    ghost_vessel: 0,
    wormhole_finder: 2,
    gravity_swing: 1,
    dimensional_blink: 0,
    orbit_surge: 1,
    star_pathfinder: 2,
    wormhole_generator: 1,
  },
  trade: {
    market_sense: 0,
    cargo_stacking: 2,
    negotiation_pro: 0,
    smuggler_route: 1,
    bulk_trading: 0,
    tax_exemption: 2,
    black_market_boss: 0,
    investor_deal: 2,
    monopoly_master: 1,
  },
  fleet: {
    wingman_recruit: 0,
    formation_basic: 2,
    wingman: 0,
    wingman_synergy: 1,
    repair_drone: 2,
    fleet_command: 0,
    emergency_warp: 2,
    tactical_link: 0,
    carrier_command: 1,
    carrier_protocol: 2,
    overlord_presence: 1,
  },
};

export type SkillTreeEdge = {
  fromSkillId: string;
  toSkillId: string;
};

export function listSkillTreeNodesForCategory(category: SkillCategory): SkillTreeNodeLayout[] {
  const columnMap = SKILL_TREE_COLUMN_BY_ID[category];
  return Object.values(SKILLS)
    .filter((s) => s.category === category)
    .sort((a, b) => a.tier - b.tier || (columnMap[a.id] ?? 0) - (columnMap[b.id] ?? 0))
    .map((skill) => ({
      skillId: skill.id,
      tier: skill.tier,
      column: columnMap[skill.id] ?? 1,
    }));
}

export function listSkillTreeEdgesForCategory(category: SkillCategory): SkillTreeEdge[] {
  const edges: SkillTreeEdge[] = [];
  for (const skill of Object.values(SKILLS)) {
    if (skill.category !== category) continue;
    for (const fromSkillId of skill.prerequisiteIds) {
      edges.push({ fromSkillId, toSkillId: skill.id });
    }
  }
  return edges;
}

export function getMaxSkillTreeTier(category: SkillCategory): number {
  return listSkillTreeNodesForCategory(category).reduce((m, n) => Math.max(m, n.tier), 1);
}
