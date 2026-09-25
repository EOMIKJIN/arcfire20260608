/**
 * 1차 대사 최종 버튼 라벨 — 초상/세그먼트와 분리 (틱 없음).
 */
import type { AppLocale } from '../../i18n/types';
import { resolveStoryPageActionLabel } from '../../i18n/storyText';
import type { StoryScenePageDef } from '../../types';

export function isQuestAcceptActionType(type: string): boolean {
  return type === 'accept_quest_mission' || type === 'accept_instance_mission';
}

export function isOfferDeclineActionType(type: string): boolean {
  return type === 'accept_main_story_mission' || isQuestAcceptActionType(type);
}

export function resolveIngameDialogDeclineLabel(input: {
  isQuestAccept: boolean;
  laterLabel: string;
  cancelLabel: string;
}): string {
  return input.isQuestAccept ? input.laterLabel : input.cancelLabel;
}

export function resolveIngameDialogFinalLabel(input: {
  locale: AppLocale;
  showAcceptCancelChoice: boolean;
  isQuestAccept: boolean;
  page: Pick<StoryScenePageDef, 'actionLabel' | 'actionLabelEn'> | null | undefined;
  okLabel: string;
  acceptLabel: string;
  questAcceptLabel: string;
}): string {
  if (input.isQuestAccept) return input.questAcceptLabel;
  if (input.showAcceptCancelChoice) return input.acceptLabel;
  const pageAction = input.page ? resolveStoryPageActionLabel(input.page, input.locale) : '';
  return pageAction || input.okLabel;
}
