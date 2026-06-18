import type { Skill } from '../types';
import type { I18nParams } from './types';

type TFn = (key: string, params?: I18nParams) => string;

function pick(key: string, fallback: string, t: TFn): string {
  const val = t(key);
  return val !== key ? val : fallback;
}

export function resolveSkillName(skill: Skill, t: TFn): string {
  return pick(`skill.${skill.id}.name`, skill.name, t);
}

export function resolveSkillDescription(skill: Skill, t: TFn): string {
  return pick(`skill.${skill.id}.desc`, skill.description, t);
}

export function resolveSkillEffectDescription(skill: Skill, t: TFn): string {
  return pick(`skill.${skill.id}.effect`, skill.effect.description, t);
}
