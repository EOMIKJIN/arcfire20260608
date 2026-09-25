/**
 * 인게임 대사 세션 팩 — 창이 보이기 전 전 스텝 분할·초상 resolve.
 * 진행 중 split/resolve 금지. persist 없음.
 */
import type { ImageSourcePropType } from 'react-native';
import type { AppLocale } from '../../i18n/types';
import { isKoUi, translate } from '../../i18n';
import { resolveStoryPageLabel, resolveStoryPageText } from '../../i18n/storyText';
import { resolveIngameDialogLineBudget } from '../../ui/overlay/narrativeDialogLayout';
import {
  splitNarrativeDialogSegments,
  type NarrativeDialogSplitOptions,
} from '../../ui/overlay/splitNarrativeDialogSegments';
import type { StorySceneDef } from '../../types';
import { filterIngameDialogPages } from './ingameDialogSceneIndex';
import {
  isOfferDeclineActionType,
  isQuestAcceptActionType,
  resolveIngameDialogDeclineLabel,
  resolveIngameDialogFinalLabel,
} from './resolveIngameDialogFinalLabel';
import { resolveIngameDialogPortraitSource } from './resolveIngameDialogPortraitSource';
import type { IngameDialogTextContext } from './ingameDialogTypes';

export const INGAME_DIALOG_PACK_STEP_CAP = 64;
export const INGAME_DIALOG_PACK_PORTRAIT_CAP = 12;
/** R-2 — 초과 시 창을 열어 무반응을 막는다. prefetch/워머는 계속되어도 됨. */
export const INGAME_DIALOG_READY_TIMEOUT_MS = 400;

export type IngameDialogPackStep = {
  stepIndex: number;
  pageIndex: number;
  segmentIndex: number;
  label: string;
  text: string;
  typewriterKey: string;
  typewriterSpeedMs: number;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  buttonText: string;
  secondaryButtonText?: string;
  isFinalStep: boolean;
  hasMoreDialogue: boolean;
  showAcceptCancelChoice: boolean;
};

export type IngameDialogSessionPack = {
  sceneId: string | null;
  adhocId: string | null;
  locale: AppLocale;
  nicknameHash: string;
  splitWidthKey: string;
  steps: IngameDialogPackStep[];
  uniquePortraitSources: ImageSourcePropType[];
};

export function normalizeStoryBody(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{2,}/g, '\n').trim();
}

export function applyTextContext(
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

export function resolvePackPageText(
  page: { text: string; textEn?: string | null },
  locale: AppLocale,
  nickname: string | null | undefined,
  context: IngameDialogTextContext,
): string {
  const base = resolveStoryPageText(page, locale, nickname);
  return applyTextContext(base, locale, context);
}

export function resolveIngameDialogSplitWidthKey(
  splitOptions: NarrativeDialogSplitOptions | undefined,
): string {
  const w = splitOptions?.windowWidth ?? 0;
  const insets = splitOptions?.widthInsets;
  return [
    w,
    insets?.safeLeft ?? 0,
    insets?.safeRight ?? 0,
    insets?.hostHorizontalPadPx ?? 0,
    splitOptions?.charsPerLine ?? '',
  ].join('|');
}

function portraitIdentity(source: ImageSourcePropType): string {
  if (typeof source === 'number') return `n:${source}`;
  if (source && typeof source === 'object' && 'uri' in source) {
    return `u:${String((source as { uri?: string }).uri ?? '')}`;
  }
  return `j:${JSON.stringify(source)}`;
}

function collectUniquePortraits(steps: readonly IngameDialogPackStep[]): ImageSourcePropType[] {
  const out: ImageSourcePropType[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < steps.length; i += 1) {
    const src = steps[i]?.imageSource;
    if (src == null) continue;
    const id = portraitIdentity(src);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(src);
    if (out.length >= INGAME_DIALOG_PACK_PORTRAIT_CAP) break;
  }
  return out;
}

export function buildCsvIngameDialogSessionPack(input: {
  scene: StorySceneDef;
  locale: AppLocale;
  nickname?: string | null;
  context: IngameDialogTextContext;
  splitOptions?: NarrativeDialogSplitOptions;
  completionActionTypes?: readonly string[];
}): IngameDialogSessionPack {
  const { scene, locale, nickname, context, splitOptions } = input;
  const actionTypes = input.completionActionTypes ?? [];
  const commFallback = translate(locale, 'dialog.comm');
  const nextLabel = translate(locale, 'dialog.next');
  const okLabel = translate(locale, 'dialog.ok');
  const pages = filterIngameDialogPages(scene);
  const maxLines = resolveIngameDialogLineBudget();
  const isQuestAccept = actionTypes.some((t) => isQuestAcceptActionType(t));
  const showAcceptCancelChoiceFinal = actionTypes.some((t) => isOfferDeclineActionType(t));
  const steps: IngameDialogPackStep[] = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if (steps.length >= INGAME_DIALOG_PACK_STEP_CAP) break;
    const page = pages[pageIndex]!;
    const imageSource = resolveIngameDialogPortraitSource(page, context.npcCaptainId);
    const textRaw = normalizeStoryBody(resolvePackPageText(page, locale, nickname, context));
    const chunks = splitNarrativeDialogSegments(textRaw, maxLines, splitOptions);
    const label = applyTextContext(
      resolveStoryPageLabel(page, locale) || commFallback,
      locale,
      context,
    );
    const isLastPage = pageIndex >= pages.length - 1;
    for (let segmentIndex = 0; segmentIndex < chunks.length; segmentIndex += 1) {
      if (steps.length >= INGAME_DIALOG_PACK_STEP_CAP) break;
      const isLastSegment = segmentIndex >= chunks.length - 1;
      const isFinalStep = isLastPage && isLastSegment;
      const hasMoreDialogue = !isFinalStep;
      const showAcceptCancelChoice = isFinalStep && showAcceptCancelChoiceFinal;
      let buttonText = nextLabel;
      let secondaryButtonText: string | undefined;
      if (isFinalStep) {
        if (showAcceptCancelChoice) {
          secondaryButtonText = resolveIngameDialogDeclineLabel({
            isQuestAccept,
            laterLabel: translate(locale, 'dialog.later'),
            cancelLabel: translate(locale, 'dialog.cancel'),
          });
        }
        buttonText = resolveIngameDialogFinalLabel({
          locale,
          showAcceptCancelChoice,
          isQuestAccept,
          page,
          okLabel,
          acceptLabel: translate(locale, 'dialog.accept'),
          questAcceptLabel: translate(locale, 'mission.accept.quest'),
        });
      }
      steps.push({
        stepIndex: steps.length,
        pageIndex,
        segmentIndex,
        label,
        text: chunks[segmentIndex] ?? '',
        typewriterKey: `ingame-dialog-${scene.id}-${pageIndex}-${segmentIndex}`,
        typewriterSpeedMs: scene.typewriterSpeedMs ?? 28,
        imageSource,
        buttonText,
        secondaryButtonText,
        isFinalStep,
        hasMoreDialogue,
        showAcceptCancelChoice,
      });
    }
  }

  return {
    sceneId: scene.id,
    adhocId: null,
    locale,
    nicknameHash: String(nickname ?? ''),
    splitWidthKey: resolveIngameDialogSplitWidthKey(splitOptions),
    steps,
    uniquePortraitSources: collectUniquePortraits(steps),
  };
}

export function buildAdhocIngameDialogSessionPack(input: {
  adhocId: string;
  label: string;
  text: string;
  typewriterSpeedMs?: number;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  buttonText?: string;
  secondaryButtonText?: string;
  showAcceptCancelChoice?: boolean;
  completionActionTypes?: readonly string[];
  locale: AppLocale;
  splitOptions?: NarrativeDialogSplitOptions;
}): IngameDialogSessionPack {
  const { locale, splitOptions } = input;
  const nextLabel = translate(locale, 'dialog.next');
  const okLabel = translate(locale, 'dialog.ok');
  const maxLines = resolveIngameDialogLineBudget();
  const textRaw = normalizeStoryBody(input.text);
  const chunks = splitNarrativeDialogSegments(textRaw, maxLines, splitOptions);
  const isQuestAccept = (input.completionActionTypes ?? []).some((t) => isQuestAcceptActionType(t));
  const showChoice = input.showAcceptCancelChoice === true || isQuestAccept;
  const steps: IngameDialogPackStep[] = [];
  for (let segmentIndex = 0; segmentIndex < chunks.length; segmentIndex += 1) {
    if (steps.length >= INGAME_DIALOG_PACK_STEP_CAP) break;
    const isLastSegment = segmentIndex >= chunks.length - 1;
    const showAcceptCancelChoice = isLastSegment && showChoice;
    steps.push({
      stepIndex: steps.length,
      pageIndex: 0,
      segmentIndex,
      label: input.label,
      text: chunks[segmentIndex] ?? '',
      typewriterKey: `ingame-adhoc-${input.adhocId}-${segmentIndex}`,
      typewriterSpeedMs: input.typewriterSpeedMs ?? 42,
      imageSource: input.imageSource,
      portraitScale: input.portraitScale,
      buttonText: isLastSegment
        ? (input.buttonText
          ?? (isQuestAccept
            ? translate(locale, 'mission.accept.quest')
            : showAcceptCancelChoice ? translate(locale, 'dialog.accept') : okLabel))
        : nextLabel,
      secondaryButtonText: showAcceptCancelChoice
        ? (input.secondaryButtonText ?? resolveIngameDialogDeclineLabel({
          isQuestAccept,
          laterLabel: translate(locale, 'dialog.later'),
          cancelLabel: translate(locale, 'dialog.cancel'),
        }))
        : undefined,
      isFinalStep: isLastSegment,
      hasMoreDialogue: !isLastSegment,
      showAcceptCancelChoice,
    });
  }
  return {
    sceneId: null,
    adhocId: input.adhocId,
    locale,
    nicknameHash: '',
    splitWidthKey: resolveIngameDialogSplitWidthKey(splitOptions),
    steps,
    uniquePortraitSources: collectUniquePortraits(steps),
  };
}

export function buildIntroIngameDialogSessionPack(input: {
  scene: StorySceneDef;
  locale: AppLocale;
  nickname?: string | null;
  splitOptions?: NarrativeDialogSplitOptions;
}): IngameDialogSessionPack {
  const { scene, locale, nickname, splitOptions } = input;
  const maxLines = resolveIngameDialogLineBudget();
  const commFallback = translate(locale, 'dialog.comm');
  const steps: IngameDialogPackStep[] = [];
  for (let pageIndex = 0; pageIndex < scene.pages.length; pageIndex += 1) {
    if (steps.length >= INGAME_DIALOG_PACK_STEP_CAP) break;
    const page = scene.pages[pageIndex]!;
    if (page.viewMode !== 'ingame_dialog') continue;
    const imageSource = resolveIngameDialogPortraitSource(page);
    const portraitScale = Math.max(40, Math.min(140, page.imageScalePct ?? 100)) / 100;
    const textRaw = normalizeStoryBody(resolveStoryPageText(page, locale, nickname));
    const chunks = splitNarrativeDialogSegments(textRaw, maxLines, splitOptions);
    const label = resolveStoryPageLabel(page, locale) || commFallback;
    for (let segmentIndex = 0; segmentIndex < chunks.length; segmentIndex += 1) {
      if (steps.length >= INGAME_DIALOG_PACK_STEP_CAP) break;
      const isLastIngame = pageIndex === lastIntroIngamePageIndex(scene)
        && segmentIndex >= chunks.length - 1;
      steps.push({
        stepIndex: steps.length,
        pageIndex,
        segmentIndex,
        label,
        text: chunks[segmentIndex] ?? '',
        typewriterKey: `intro-dialog-${pageIndex}-${segmentIndex}`,
        typewriterSpeedMs: scene.typewriterSpeedMs ?? 40,
        imageSource,
        portraitScale,
        buttonText: '',
        isFinalStep: isLastIngame,
        hasMoreDialogue: !isLastIngame,
        showAcceptCancelChoice: false,
      });
    }
  }
  return {
    sceneId: scene.id,
    adhocId: null,
    locale,
    nicknameHash: String(nickname ?? ''),
    splitWidthKey: resolveIngameDialogSplitWidthKey(splitOptions),
    steps,
    uniquePortraitSources: collectUniquePortraits(steps),
  };
}

function lastIntroIngamePageIndex(scene: StorySceneDef): number {
  let last = -1;
  for (let i = 0; i < scene.pages.length; i += 1) {
    if (scene.pages[i]?.viewMode === 'ingame_dialog') last = i;
  }
  return last;
}

export function findIntroPackStep(
  pack: IngameDialogSessionPack,
  pageIndex: number,
  segmentIndex: number,
): IngameDialogPackStep | null {
  for (let i = 0; i < pack.steps.length; i += 1) {
    const step = pack.steps[i]!;
    if (step.pageIndex === pageIndex && step.segmentIndex === segmentIndex) return step;
  }
  return null;
}
