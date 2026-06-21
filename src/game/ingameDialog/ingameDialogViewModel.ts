// ============================================================
// 인게임 대화 — 화면 ViewModel (텍스트·초상·버튼)
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import type { AppLocale } from '../../i18n/types';
import { resolveStoryPageLabel, resolveStoryPageText } from '../../i18n/storyText';
import { resolveIngameDialogPortraitSource } from './resolveIngameDialogPortraitSource';
import {
  NARRATIVE_DIALOG_LAYOUT,
  resolveIngameDialogLineBudget,
} from '../../ui/overlay/narrativeDialogLayout';
import {
  narrativeDialogSegmentCount,
  splitNarrativeDialogSegments,
  getActiveNarrativeDialogSplitOptions,
  type NarrativeDialogSplitOptions,
} from '../../ui/overlay/splitNarrativeDialogSegments';
import type { StorySceneDef } from '../../types';
import { filterIngameDialogPages } from './ingameDialogSceneIndex';
import type { IngameDialogSession, IngameDialogTextContext } from './ingameDialogTypes';

export type IngameDialogViewModel = {
  label: string;
  text: string;
  typewriterKey: string;
  typewriterSpeedMs: number;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  maxLines: number;
  buttonText: string;
  nextDisabled: boolean;
  isFinalStep: boolean;
  /** 현재 세그먼트·페이지 이후 대사가 더 있음 */
  hasMoreDialogue: boolean;
};

function normalizeStoryBody(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
}

function applyTextContext(
  text: string,
  locale: AppLocale,
  context: IngameDialogTextContext,
): string {
  const title =
    locale !== 'ko' && context.missionTitleEn
      ? context.missionTitleEn
      : context.missionTitle ?? '';
  return text.replace(/\[미션제목\]/g, title);
}

function resolvePageText(
  page: { text: string; textEn?: string | null },
  locale: AppLocale,
  nickname: string | null | undefined,
  context: IngameDialogTextContext,
): string {
  const base = resolveStoryPageText(page, locale, nickname);
  return applyTextContext(base, locale, context);
}

export function resolveIngameDialogSegmentCount(
  session: Extract<IngameDialogSession, { kind: 'csv_scene' }>,
  scene: StorySceneDef,
  locale: AppLocale,
  nickname?: string | null,
  splitOptions?: NarrativeDialogSplitOptions,
): number {
  const pages = filterIngameDialogPages(scene);
  const page = pages[session.pageIndex];
  if (!page) return 1;
  const textRaw = normalizeStoryBody(
    resolvePageText(page, locale, nickname, session.context),
  );
  return Math.max(
    1,
    narrativeDialogSegmentCount(textRaw, splitOptions ?? getActiveNarrativeDialogSplitOptions()),
  );
}

export function buildIngameDialogViewModel(input: {
  session: IngameDialogSession;
  scene: StorySceneDef | null;
  locale: AppLocale;
  nickname?: string | null;
  splitOptions?: NarrativeDialogSplitOptions;
}): IngameDialogViewModel | null {
  const { session, scene, locale, nickname, splitOptions } = input;
  const commFallback = locale === 'ko' ? '[ 통신 ]' : '[ COMM ]';
  const nextLabel = locale === 'ko' ? '[ 다음 ]' : '[ Next ]';
  const okLabel = locale === 'ko' ? '[ 확인 ]' : '[ OK ]';

  if (session.kind === 'adhoc') {
    const p = session.payload;
    return {
      label: p.label,
      text: p.text,
      typewriterKey: `ingame-adhoc-${session.adhocId}`,
      typewriterSpeedMs: p.typewriterSpeedMs ?? 42,
      imageSource: p.imageSource,
      portraitScale: p.portraitScale,
      maxLines: NARRATIVE_DIALOG_LAYOUT.maxLinesDefault,
      buttonText: p.buttonText ?? okLabel,
      nextDisabled: !session.pageComplete,
      isFinalStep: true,
      hasMoreDialogue: false,
    };
  }

  if (!scene) return null;
  const pages = filterIngameDialogPages(scene);
  const page = pages[session.pageIndex];
  if (!page) return null;

  const imageSource = resolveIngameDialogPortraitSource(page);

  const textRaw = normalizeStoryBody(
    resolvePageText(page, locale, nickname, session.context),
  );
  const splitOpts = splitOptions ?? getActiveNarrativeDialogSplitOptions();
  const maxLines = resolveIngameDialogLineBudget();
  const chunks = splitNarrativeDialogSegments(textRaw, maxLines, splitOpts);
  const segmentText = chunks[session.segmentIndex] ?? chunks[chunks.length - 1] ?? '';
  const isLastPage = session.pageIndex >= pages.length - 1;
  const isLastSegment = session.segmentIndex >= chunks.length - 1;
  const isFinalStep = isLastPage && isLastSegment && chunks.length > 0;
  const hasMoreDialogue = !isFinalStep;

  return {
    label: resolveStoryPageLabel(page, locale) || commFallback,
    text: segmentText,
    typewriterKey: `ingame-dialog-${session.sceneId}-${session.pageIndex}-${session.segmentIndex}`,
    typewriterSpeedMs: scene.typewriterSpeedMs ?? 28,
    imageSource,
    maxLines,
    buttonText: hasMoreDialogue ? nextLabel : okLabel,
    nextDisabled: !session.pageComplete,
    isFinalStep,
    hasMoreDialogue,
  };
}
