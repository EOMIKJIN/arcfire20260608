import type { Skill } from '../types';
import type { AppLocale } from './types';
import { resolveDictionaryLocale } from './index';
import { EN_DICTIONARY } from './locales/en';

/**
 * 스킬 표시 — KO는 skills.csv 정본, EN만 사전(skillEn).
 * `t()` 2차 폴백(KO 없음 → EN)을 쓰면 한글 UI에 영어가 나오므로 사전을 직접 고른다.
 */
function pickSkillField(key: string, csvKo: string, locale: AppLocale): string {
  if (resolveDictionaryLocale(locale) !== 'en') return csvKo;
  return EN_DICTIONARY[key] ?? csvKo;
}

export function resolveSkillName(skill: Skill, locale: AppLocale): string {
  return pickSkillField(`skill.${skill.id}.name`, skill.name, locale);
}

export function resolveSkillDescription(skill: Skill, locale: AppLocale): string {
  return pickSkillField(`skill.${skill.id}.desc`, skill.description, locale);
}

export function resolveSkillEffectDescription(skill: Skill, locale: AppLocale): string {
  return pickSkillField(`skill.${skill.id}.effect`, skill.effect.description, locale);
}
