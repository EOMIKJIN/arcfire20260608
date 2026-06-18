import type { ItemDef } from '../types';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';

type ItemEnFields = Pick<ItemDef, 'name' | 'description'> &
  Partial<Pick<ItemDef, 'nameEn' | 'descriptionEn' | 'featureDescription' | 'featureDescriptionEn'>>;

function pickEn(locale: AppLocale, ko: string, en?: string | null): string {
  return locale !== 'ko' && en?.trim() ? en.trim() : ko;
}

export function resolveItemName(item: ItemEnFields, locale: AppLocale): string {
  return pickEn(locale, item.name, item.nameEn);
}

export function resolveItemDescription(item: ItemEnFields, locale: AppLocale): string {
  return pickEn(locale, item.description, item.descriptionEn);
}

export function resolveItemFeatureDescription(item: ItemEnFields, locale: AppLocale): string {
  const feature = item.featureDescription?.trim() || item.description;
  const featureEn = item.featureDescriptionEn?.trim() || item.descriptionEn;
  return pickEn(locale, feature, featureEn);
}

export function resolveItemNameNow(item: ItemEnFields): string {
  return resolveItemName(item, useAppSettingsStore.getState().locale);
}

export function resolveItemDescriptionNow(item: ItemEnFields): string {
  return resolveItemDescription(item, useAppSettingsStore.getState().locale);
}

export function resolveItemFeatureDescriptionNow(item: ItemEnFields): string {
  return resolveItemFeatureDescription(item, useAppSettingsStore.getState().locale);
}
