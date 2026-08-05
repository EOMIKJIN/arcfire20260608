import type { Skill } from '../types';
import type { I18nParams } from './types';
import { getLocale, resolveDictionaryLocale } from './index';
import { EN_DICTIONARY } from './locales/en';
import { KO_DICTIONARY } from './locales/ko';
import type { AppLocale } from './types';

type TFn = (key: string, params?: I18nParams) => string;

/** skill.* — 사전 locale만(ko↔en). pending→EN. EN 키 없으면 CSV(대개 KO) 폴백. */
function pickSkillField(key: string, csvFallback: string, locale: AppLocale): string {
  const dict = resolveDictionaryLocale(locale) === 'en' ? EN_DICTIONARY : KO_DICTIONARY;
  const val = dict[key];
  return val ?? csvFallback;
}

export function resolveSkillName(skill: Skill, t: TFn): string {
  return pickSkillField(`skill.${skill.id}.name`, skill.name, getLocale());
}

export function resolveSkillDescription(skill: Skill, t: TFn): string {
  return pickSkillField(`skill.${skill.id}.desc`, skill.description, getLocale());
}

export function resolveSkillEffectDescription(skill: Skill, t: TFn): string {
  return pickSkillField(`skill.${skill.id}.effect`, skill.effect.description, getLocale());
}
