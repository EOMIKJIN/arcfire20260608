// ============================================================
// 스토리/대사 텍스트 로케일 해석 — 페이지의 ko 정본 + 병렬 EN(textEn/labelEn).
//   EN 미번역(빈 값) 시 한국어 폴백. [닉네임]/[Pilot] 토큰 치환.
//   사용처: intro.tsx · 행성 허브 NPC 대화 · 내레이션 오버레이.
// ============================================================
import type { StoryScenePageDef } from '../types';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';

const NICK_TOKEN = /\[닉네임\]|\[Pilot\]/g;

function fallbackPilot(locale: AppLocale): string {
  return locale === 'ko' ? '파일럿' : 'Pilot';
}

/** 페이지 본문(locale + 닉네임 치환). */
export function resolveStoryPageText(
  page: Pick<StoryScenePageDef, 'text' | 'textEn'>,
  locale: AppLocale,
  nickname?: string | null,
): string {
  const raw = locale !== 'ko' && page.textEn ? page.textEn : page.text;
  return (raw ?? '').replace(NICK_TOKEN, (nickname ?? '').trim() || fallbackPilot(locale));
}

/** 페이지 라벨(화자/제목). */
export function resolveStoryPageLabel(
  page: Pick<StoryScenePageDef, 'label' | 'labelEn'>,
  locale: AppLocale,
): string {
  return (locale !== 'ko' && page.labelEn ? page.labelEn : page.label) ?? '';
}

/** 현재 앱 locale 기준 비반응 조회(컴포넌트 밖/일회성). */
export function resolveStoryPageNow(
  page: StoryScenePageDef,
  nickname?: string | null,
): { label: string; text: string } {
  const locale = useAppSettingsStore.getState().locale;
  return {
    label: resolveStoryPageLabel(page, locale),
    text: resolveStoryPageText(page, locale, nickname),
  };
}
