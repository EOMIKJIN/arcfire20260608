// ============================================================
// 앱(디바이스) 설정 — 언어·배경음악·효과음. 계정 무관(계정 초기화로 purge 안 함).
// AsyncStorage 단일 키 영속 + 부트 1회 hydrate. i18n 런타임이 locale 을 참조.
// UI SFX 재생 엔진: `src/audio` (playUiSfx · settings 볼륨/뮤트 참조). 본 store 는 선호값만 보관.
// persist 는 사용자 액션만 · 디바운스(슬라이더) + applySettings 1회 기록(취소 복원).
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLocale } from '../i18n/types';

const STORAGE_KEY = 'arcfire_app_settings_v1';
const PERSIST_DEBOUNCE_MS = 400;

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'es', 'de'];

/** 언어 표시명(설정 UI) */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  es: 'Español',
  de: 'Deutsch',
};

/** 현재 완전 번역 사전이 존재하는 locale(그 외는 폴백) */
export const FULLY_TRANSLATED_LOCALES: readonly AppLocale[] = ['ko', 'en'];

type AppSettingsPersistSlice = {
  locale: AppLocale;
  bgmMuted: boolean;
  bgmVolume: number;
  sfxMuted: boolean;
  sfxVolume: number;
};

export type AppSettingsPatch = Partial<AppSettingsPersistSlice>;

type AppSettingsState = AppSettingsPersistSlice & {
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
  setBgmMuted: (muted: boolean) => void;
  setBgmVolume: (v: number) => void;
  setSfxMuted: (muted: boolean) => void;
  setSfxVolume: (v: number) => void;
  applySettings: (patch: AppSettingsPatch) => void;
  hydrate: () => Promise<void>;
};

const DEFAULTS: AppSettingsPersistSlice = {
  locale: 'ko',
  bgmMuted: false,
  bgmVolume: 0.7,
  sfxMuted: false,
  sfxVolume: 0.8,
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

function persistFrom(s: AppSettingsPersistSlice): void {
  const payload = {
    locale: s.locale,
    bgmMuted: s.bgmMuted,
    bgmVolume: s.bgmVolume,
    sfxMuted: s.sfxMuted,
    sfxVolume: s.sfxVolume,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistNow(): void {
  if (persistTimer != null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  persistFrom(useAppSettingsStore.getState());
}

function schedulePersist(): void {
  if (persistTimer != null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistFrom(useAppSettingsStore.getState());
  }, PERSIST_DEBOUNCE_MS);
}

function normalizePersistedLocale(locale: AppLocale): AppLocale | null {
  if (!(FULLY_TRANSLATED_LOCALES as readonly string[]).includes(locale)) return null;
  return locale;
}

export const useAppSettingsStore = create<AppSettingsState>((set) => {
  const applyPatch = (patch: AppSettingsPatch, persist: 'schedule' | 'now'): void => {
    const next: AppSettingsPatch = {};
    if (patch.locale !== undefined) {
      const locale = normalizePersistedLocale(patch.locale);
      if (locale) next.locale = locale;
    }
    if (patch.bgmMuted !== undefined) next.bgmMuted = patch.bgmMuted;
    if (patch.bgmVolume !== undefined) next.bgmVolume = clamp01(patch.bgmVolume);
    if (patch.sfxMuted !== undefined) next.sfxMuted = patch.sfxMuted;
    if (patch.sfxVolume !== undefined) next.sfxVolume = clamp01(patch.sfxVolume);
    if (next.locale === undefined
      && next.bgmMuted === undefined
      && next.bgmVolume === undefined
      && next.sfxMuted === undefined
      && next.sfxVolume === undefined) {
      return;
    }
    set(next);
    if (persist === 'now') persistNow();
    else schedulePersist();
  };

  return {
    hydrated: false,
    ...DEFAULTS,

    setLocale: (locale) => applyPatch({ locale }, 'schedule'),
    setBgmMuted: (bgmMuted) => applyPatch({ bgmMuted }, 'schedule'),
    setBgmVolume: (v) => applyPatch({ bgmVolume: v }, 'schedule'),
    setSfxMuted: (sfxMuted) => applyPatch({ sfxMuted }, 'schedule'),
    setSfxVolume: (v) => applyPatch({ sfxVolume: v }, 'schedule'),
    applySettings: (patch) => applyPatch(patch, 'now'),

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const o = JSON.parse(raw) as Partial<AppSettingsPersistSlice>;
          const rawLocale =
            o.locale && SUPPORTED_LOCALES.includes(o.locale) ? o.locale : DEFAULTS.locale;
          // 레거시 ja/zh/es/de 저장값 → EN(사전·UI 정합). ko만 한국어 유지.
          const locale: AppLocale = (FULLY_TRANSLATED_LOCALES as readonly string[]).includes(rawLocale)
            ? rawLocale
            : 'en';
          set({
            locale,
            bgmMuted: typeof o.bgmMuted === 'boolean' ? o.bgmMuted : DEFAULTS.bgmMuted,
            bgmVolume: typeof o.bgmVolume === 'number' ? clamp01(o.bgmVolume) : DEFAULTS.bgmVolume,
            sfxMuted: typeof o.sfxMuted === 'boolean' ? o.sfxMuted : DEFAULTS.sfxMuted,
            sfxVolume: typeof o.sfxVolume === 'number' ? clamp01(o.sfxVolume) : DEFAULTS.sfxVolume,
          });
          // pending→en 정규화 시 디스크도 갱신(재부팅 후 재이주 방지)
          if (locale !== rawLocale) persistNow();
        }
      } catch {
        /* 손상 시 기본값 유지 */
      } finally {
        set({ hydrated: true });
      }
    },
  };
});

// 앱 시작 시 1회 자동 hydrate(모듈 로드 시점)
void useAppSettingsStore.getState().hydrate();
