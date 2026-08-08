// ============================================================
// 앱(디바이스) 설정 — 언어·배경음악·효과음. 계정 무관(계정 초기화로 purge 안 함).
// AsyncStorage 단일 키 영속 + 부트 1회 hydrate. i18n 런타임이 locale 을 참조.
// UI SFX 재생 엔진: `src/audio` (playUiSfx · settings 볼륨/뮤트 참조). 본 store 는 선호값만 보관.
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLocale } from '../i18n/types';

const STORAGE_KEY = 'arcfire_app_settings_v1';

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

type AppSettingsState = {
  hydrated: boolean;
  locale: AppLocale;
  bgmMuted: boolean;
  bgmVolume: number; // 0..1
  sfxMuted: boolean;
  sfxVolume: number; // 0..1
  setLocale: (locale: AppLocale) => void;
  setBgmMuted: (muted: boolean) => void;
  setBgmVolume: (v: number) => void;
  setSfxMuted: (muted: boolean) => void;
  setSfxVolume: (v: number) => void;
  hydrate: () => Promise<void>;
};

const DEFAULTS = {
  locale: 'ko' as AppLocale,
  bgmMuted: false,
  bgmVolume: 0.7,
  sfxMuted: false,
  sfxVolume: 0.8,
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

function persistFrom(s: AppSettingsState): void {
  const payload = {
    locale: s.locale,
    bgmMuted: s.bgmMuted,
    bgmVolume: s.bgmVolume,
    sfxMuted: s.sfxMuted,
    sfxVolume: s.sfxVolume,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  hydrated: false,
  ...DEFAULTS,

  setLocale: (locale) => {
    // 출시 기준: 완전 번역(ko/en)만 영속. pending locale 신규 저장 금지.
    if (!(FULLY_TRANSLATED_LOCALES as readonly string[]).includes(locale)) return;
    set({ locale });
    persistFrom(get());
  },
  setBgmMuted: (bgmMuted) => {
    set({ bgmMuted });
    persistFrom(get());
  },
  setBgmVolume: (v) => {
    set({ bgmVolume: clamp01(v) });
    persistFrom(get());
  },
  setSfxMuted: (sfxMuted) => {
    set({ sfxMuted });
    persistFrom(get());
  },
  setSfxVolume: (v) => {
    set({ sfxVolume: clamp01(v) });
    persistFrom(get());
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw) as Partial<AppSettingsState>;
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
        if (locale !== rawLocale) persistFrom(get());
      }
    } catch {
      /* 손상 시 기본값 유지 */
    } finally {
      set({ hydrated: true });
    }
  },
}));

// 앱 시작 시 1회 자동 hydrate(모듈 로드 시점)
void useAppSettingsStore.getState().hydrate();
