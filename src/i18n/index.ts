// ============================================================
// i18n 런타임 — 경량 t() 해석기(라이브러리 없음).
//   완전 번역 사전: ko · en 만 (그 외 locale 은 EN 사전으로 해석)
//   {param} 보간. 현재 locale 은 appSettingsStore 에서 참조.
// ============================================================
import { useCallback } from 'react';
import type { AppLocale, I18nDictionary, I18nParams } from './types';
import { KO_DICTIONARY } from './locales/ko';
import { EN_DICTIONARY } from './locales/en';
import { useAppSettingsStore } from '../store/appSettingsStore';

const DICTIONARIES: Record<'ko' | 'en', I18nDictionary> = {
  ko: KO_DICTIONARY,
  en: EN_DICTIONARY,
};

/**
 * 사전 조회용 locale — 완전 번역(ko/en)만 직접 사용.
 * ja/zh/es/de 등 준비중 locale 은 EN UI로 해석(한글 폴백 위장 제거).
 */
export function resolveDictionaryLocale(locale: AppLocale): 'ko' | 'en' {
  // 완전 번역은 ko/en. 준비중 locale 은 EN 사전(한글 폴백 위장 제거).
  return locale === 'ko' ? 'ko' : 'en';
}

/** UI/콘텐츠가 한국어 사전·CSV 원문을 쓸지 — pending locale 은 false(EN). */
export function isKoUi(locale: AppLocale): boolean {
  return resolveDictionaryLocale(locale) === 'ko';
}

function interpolate(template: string, params?: I18nParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}

/** locale 명시 해석 — 사전 없으면 반대 완전번역 → key */
export function translate(locale: AppLocale, key: string, params?: I18nParams): string {
  const dictLocale = resolveDictionaryLocale(locale);
  const primary = DICTIONARIES[dictLocale];
  const secondary = dictLocale === 'ko' ? EN_DICTIONARY : KO_DICTIONARY;
  const raw = primary[key] ?? secondary[key] ?? key;
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
  return resolveDictionaryLocale(locale ?? getLocale()) === 'en' ? 'en-US' : 'ko-KR';
}

/** React 훅 — locale 변경 시 리렌더되는 t. */
export function useT(): (key: string, params?: I18nParams) => string {
  const locale = useAppSettingsStore((s) => s.locale);
  return useCallback((key: string, params?: I18nParams) => translate(locale, key, params), [locale]);
}

export type { AppLocale } from './types';
