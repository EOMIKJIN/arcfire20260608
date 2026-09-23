import type { Mission, MissionObjective } from '../types';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { pickLocalized } from './pickLocalized';

export function resolveMissionTitle(mission: Pick<Mission, 'title' | 'titleEn'>, locale: AppLocale): string {
  return pickLocalized(locale, mission.title, mission.titleEn);
}

export function resolveMissionDescription(
  mission: Pick<Mission, 'description' | 'descriptionEn'>,
  locale: AppLocale,
): string {
  return pickLocalized(locale, mission.description, mission.descriptionEn);
}

export function resolveMissionObjectiveDescription(
  objective: Pick<MissionObjective, 'description' | 'descriptionEn'>,
  locale: AppLocale,
): string {
  return pickLocalized(locale, objective.description, objective.descriptionEn);
}

export function resolveMissionTitleNow(mission: Pick<Mission, 'title' | 'titleEn'>): string {
  return resolveMissionTitle(mission, useAppSettingsStore.getState().locale);
}

export function resolveMissionObjectiveDescriptionNow(
  objective: Pick<MissionObjective, 'description' | 'descriptionEn'>,
): string {
  return resolveMissionObjectiveDescription(objective, useAppSettingsStore.getState().locale);
}
