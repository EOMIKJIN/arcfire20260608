import type { PlayerProfessionCsvRow } from '../data/generated';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { isKoUi } from './index';

type ProfessionEnFields = Pick<
  PlayerProfessionCsvRow,
  'nameKo' | 'nameEn' | 'labelKo' | 'labelEn' | 'summaryKo' | 'summaryEn' | 'personalityKo' | 'personalityEn'
>;

function pickEn(locale: AppLocale, ko: string, en?: string | null): string {
  return !isKoUi(locale) && en?.trim() ? en.trim() : ko;
}

export function resolveProfessionName(profession: ProfessionEnFields, locale: AppLocale): string {
  return pickEn(locale, profession.nameKo, profession.nameEn);
}

export function resolveProfessionLabel(profession: ProfessionEnFields, locale: AppLocale): string {
  return pickEn(locale, profession.labelKo, profession.labelEn);
}

export function resolveProfessionSummary(profession: ProfessionEnFields, locale: AppLocale): string {
  return pickEn(locale, profession.summaryKo, profession.summaryEn);
}

export function resolveProfessionPersonality(profession: ProfessionEnFields, locale: AppLocale): string {
  return pickEn(locale, profession.personalityKo, profession.personalityEn);
}

export function resolveProfessionNow(
  profession: PlayerProfessionCsvRow,
): { name: string; label: string; summary: string; personality: string } {
  const locale = useAppSettingsStore.getState().locale;
  return {
    name: resolveProfessionName(profession, locale),
    label: resolveProfessionLabel(profession, locale),
    summary: resolveProfessionSummary(profession, locale),
    personality: resolveProfessionPersonality(profession, locale),
  };
}
