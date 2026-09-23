// ============================================================
// 인게임 대화 — 화면 ViewModel (텍스트·초상·버튼)
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import type { AppLocale } from '../../i18n/types';
import { isKoUi, translate } from '../../i18n';
import { resolveStoryPageLabel, resolveStoryPageText } from '../../i18n/storyText';
import { resolveIngameDialogFinalLabel } from './resolveIngameDialogFinalLabel';
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
  /** 메인 퀘스트 수락 단계 — `[ 취소 ]` (없으면 단일 버튼) */
  secondaryButtonText?: string;
  nextDisabled: boolean;
  isFinalStep: boolean;
  /** 현재 세그먼트·페이지 이후 대사가 더 있음 */
  hasMoreDialogue: boolean;
  /** 최종 단계에서 [수락]/[취소] 선택 UI */
  showAcceptCancelChoice: boolean;
};

function normalizeStoryBody(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{2,}/g, '\n').trim();
}

function applyTextContext(
  text: string,
  locale: AppLocale,
  context: IngameDialogTextContext,
): string {
  const title =
    !isKoUi(locale) && context.missionTitleEn
      ? context.missionTitleEn
      : context.missionTitle ?? '';
  const npcName =
    !isKoUi(locale) && context.npcNameEn
      ? context.npcNameEn
      : context.npcName ?? '';
  const lastPlanetRaw =
    !isKoUi(locale) && context.orbitCommLastPlanetNameEn
      ? context.orbitCommLastPlanetNameEn
      : context.orbitCommLastPlanetName ?? '';
  const lastPlanet = lastPlanetRaw.trim() || (isKoUi(locale) ? '이전 궤도' : 'the last dock');
  const visitCount =
    context.orbitCommVisitCount != null ? String(context.orbitCommVisitCount) : '';
  return text
    .replace(/\[미션제목\]/g, title)
    .replace(/\[담당자\]/g, npcName)
    .replace(/\{orbitCommLastPlanetName\}/g, lastPlanet)
    .replace(/\{orbitCommLastPlanetNameEn\}/g, context.orbitCommLastPlanetNameEn ?? lastPlanet)
    .replace(/\{orbitCommVisitCount\}/g, visitCount);
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

export function resolveAdHocIngameDialogSegmentCount(
  text: string,
  splitOptions?: NarrativeDialogSplitOptions,
): number {
  return Math.max(
    1,
    narrativeDialogSegmentCount(
      normalizeStoryBody(text),
      splitOptions ?? getActiveNarrativeDialogSplitOptions(),
    ),
  );
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
  const commFallback = translate(locale, 'dialog.comm');
  const nextLabel = translate(locale, 'dialog.next');
  const okLabel = translate(locale, 'dialog.ok');

  if (session.kind === 'adhoc') {
    const p = session.payload;
    const textRaw = normalizeStoryBody(p.text);
    const splitOpts = splitOptions ?? getActiveNarrativeDialogSplitOptions();
    const maxLines = resolveIngameDialogLineBudget();
    const chunks = splitNarrativeDialogSegments(textRaw, maxLines, splitOpts);
    const segmentText = chunks[session.segmentIndex] ?? chunks[chunks.length - 1] ?? '';
    const isLastSegment = session.segmentIndex >= chunks.length - 1;
    const showAcceptCancelChoice = isLastSegment && p.showAcceptCancelChoice === true;
    return {
      label: p.label,
      text: segmentText,
      typewriterKey: `ingame-adhoc-${session.adhocId}-${session.segmentIndex}`,
      typewriterSpeedMs: p.typewriterSpeedMs ?? 42,
      imageSource: p.imageSource,
      portraitScale: p.portraitScale,
      maxLines,
      buttonText: isLastSegment
        ? (p.buttonText
          ?? (showAcceptCancelChoice ? translate(locale, 'dialog.accept') : okLabel))
        : nextLabel,
      secondaryButtonText: showAcceptCancelChoice
        ? (p.secondaryButtonText ?? translate(locale, 'dialog.cancel'))
        : undefined,
      nextDisabled: !session.pageComplete,
      isFinalStep: isLastSegment,
      hasMoreDialogue: !isLastSegment,
      showAcceptCancelChoice,
    };
  }

  if (!scene) return null;
  const pages = filterIngameDialogPages(scene);
  const page = pages[session.pageIndex];
  if (!page) return null;

  const imageSource = resolveIngameDialogPortraitSource(page, session.context.npcCaptainId);

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

  const actions = session.completionActions ?? [];
  const showAcceptCancelChoice =
    isFinalStep && actions.some((a) => a.type === 'accept_main_story_mission');

  const isQuestAccept = actions.some(
    (a) => a.type === 'accept_quest_mission' || a.type === 'accept_instance_mission',
  );
  let finalLabel = okLabel;
  let secondaryButtonText: string | undefined;
  if (isFinalStep) {
    if (showAcceptCancelChoice) {
      secondaryButtonText = translate(locale, 'dialog.cancel');
    }
    finalLabel = resolveIngameDialogFinalLabel({
      locale,
      showAcceptCancelChoice,
      isQuestAccept,
      page,
      okLabel,
      acceptLabel: translate(locale, 'dialog.accept'),
      questAcceptLabel: translate(locale, 'mission.accept.quest'),
    });
  }

  return {
    label: applyTextContext(resolveStoryPageLabel(page, locale) || commFallback, locale, session.context),
    text: segmentText,
    typewriterKey: `ingame-dialog-${session.sceneId}-${session.pageIndex}-${session.segmentIndex}`,
    typewriterSpeedMs: scene.typewriterSpeedMs ?? 28,
    imageSource,
    maxLines,
    buttonText: hasMoreDialogue ? nextLabel : finalLabel,
    secondaryButtonText,
    nextDisabled: !session.pageComplete,
    isFinalStep,
    hasMoreDialogue,
    showAcceptCancelChoice,
  };
}
