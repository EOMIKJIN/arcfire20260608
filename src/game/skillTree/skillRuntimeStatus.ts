/**
 * 연구소 스킬 런타임 완성도 — UI 배지.
 * 정본: skills.csv runtimeStatus · runtimeNoteKey(Table-First · 2026-10-10). 효과 연동을 추가하면 CSV 를 갱신한다.
 */
import { SKILLS } from '../../data/skills';

export type SkillRuntimeStatus = 'complete' | 'partial' | 'undeveloped';

export function resolveSkillRuntimeStatus(skillId: string): SkillRuntimeStatus {
  return SKILLS[String(skillId ?? '').trim()]?.runtimeStatus ?? 'undeveloped';
}

export function resolveSkillRuntimePartialNoteKey(skillId: string): string | null {
  const skill = SKILLS[String(skillId ?? '').trim()];
  return skill?.runtimeStatus === 'partial' ? (skill.runtimeNoteKey ?? null) : null;
}

export function isSkillRuntimeReady(skillId: string): boolean {
  return resolveSkillRuntimeStatus(skillId) === 'complete';
}
