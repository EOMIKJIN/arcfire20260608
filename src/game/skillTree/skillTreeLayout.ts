// ============================================================
// 연구소 스킬 트리 — 티어·열 배치 (2026-05 UI 스크린샷 + skills.csv 정본)
// tier·column(treeColumn) 모두 skills.csv · 선행 관계는 CSV prerequisiteIds
// ============================================================

import type { SkillCategory } from '../../types';
import { SKILLS } from '../../data/skills';

export type SkillTreeNodeLayout = {
  skillId: string;
  tier: number;
  /** 0=좌 / 1=중 / 2=우 */
  column: number;
};

export type SkillTreeEdge = {
  fromSkillId: string;
  toSkillId: string;
};

export function listSkillTreeNodesForCategory(category: SkillCategory): SkillTreeNodeLayout[] {
  // 열은 skills.csv treeColumn(Table-First · 2026-10-10)
  return Object.values(SKILLS)
    .filter((s) => s.category === category)
    .sort((a, b) => a.tier - b.tier || (a.treeColumn ?? 1) - (b.treeColumn ?? 1))
    .map((skill) => ({
      skillId: skill.id,
      tier: skill.tier,
      column: skill.treeColumn ?? 1,
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
