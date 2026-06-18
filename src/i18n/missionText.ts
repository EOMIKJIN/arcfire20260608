import type { Mission, MissionObjective } from '../types';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';

function pickEn(locale: AppLocale, ko: string, en?: string | null): string {
  return locale !== 'ko' && en?.trim() ? en.trim() : ko;
}

export function resolveMissionTitle(mission: Pick<Mission, 'title' | 'titleEn'>, locale: AppLocale): string {
  return pickEn(locale, mission.title, mission.titleEn);
}

export function resolveMissionDescription(
  mission: Pick<Mission, 'description' | 'descriptionEn'>,
  locale: AppLocale,
): string {
  return pickEn(locale, mission.description, mission.descriptionEn);
}

export function resolveMissionObjectiveDescription(
  objective: Pick<MissionObjective, 'description' | 'descriptionEn'>,
  locale: AppLocale,
): string {
  return pickEn(locale, objective.description, objective.descriptionEn);
}

export function resolveMissionTitleNow(mission: Pick<Mission, 'title' | 'titleEn'>): string {
  return resolveMissionTitle(mission, useAppSettingsStore.getState().locale);
}

export function resolveMissionObjectiveDescriptionNow(
  objective: Pick<MissionObjective, 'description' | 'descriptionEn'>,
): string {
  return resolveMissionObjectiveDescription(objective, useAppSettingsStore.getState().locale);
}
