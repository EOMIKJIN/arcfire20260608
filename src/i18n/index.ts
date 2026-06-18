// ============================================================
// i18n 런타임 — 경량 t() 해석기(라이브러리 없음).
//   사전: locales/ko·en (그 외 locale 은 ko→en→key 폴백)
//   {param} 보간. 현재 locale 은 appSettingsStore 에서 참조.
// 문자열 마이그레이션(하드코딩 → t())은 화면 단위 점진 진행(기획 #4, 후속).
// ============================================================
import { useCallback } from 'react';
import type { AppLocale, I18nDictionary, I18nParams } from './types';
import { KO_DICTIONARY } from './locales/ko';
import { EN_DICTIONARY } from './locales/en';
import { useAppSettingsStore } from '../store/appSettingsStore';

const DICTIONARIES: Partial<Record<AppLocale, I18nDictionary>> = {
  ko: KO_DICTIONARY,
  en: EN_DICTIONARY,
};

function interpolate(template: string, params?: I18nParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}

/** locale 명시 해석 — 사전 없으면 ko → en → key 순 폴백 */
export function translate(locale: AppLocale, key: string, params?: I18nParams): string {
  const dict = DICTIONARIES[locale];
  const raw =
    (dict && dict[key]) ??
    KO_DICTIONARY[key] ??
    EN_DICTIONARY[key] ??
    key;
  return interpolate(raw, params);
}

/** 비반응 조회(현재 locale) — 컴포넌트 밖/일회성. */
export function t(key: string, params?: I18nParams): string {
  return translate(useAppSettingsStore.getState().locale, key, params);
}

/** 현재 locale(비반응). Intl/Date 등 포맷용. */
export function getLocale(): AppLocale {
  return useAppSettingsStore.getState().locale;
}

/** Intl/Date toLocaleString 용 BCP-47 태그. */
export function intlTag(locale?: AppLocale): string {
  return (locale ?? getLocale()) === 'en' ? 'en-US' : 'ko-KR';
}

/** React 훅 — locale 변경 시 리렌더되는 t. */
export function useT(): (key: string, params?: I18nParams) => string {
  const locale = useAppSettingsStore((s) => s.locale);
  return useCallback((key: string, params?: I18nParams) => translate(locale, key, params), [locale]);
}

export type { AppLocale } from './types';
