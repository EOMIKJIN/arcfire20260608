import type { AppLocale } from './types';

/**
 * KO 정본 + 선택 EN.
 * 기본 표시는 한글(`locale === 'ko'`). 그 외(영·준비중 locale)는 EN, 없으면 KO.
 */
export function pickLocalized(locale: AppLocale, ko: string, en?: string | null): string {
  const fallback = String(ko ?? '');
  if (locale === 'ko') return fallback;
  const localized = String(en ?? '').trim();
  return localized || fallback;
}
