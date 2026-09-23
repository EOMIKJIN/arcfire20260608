// 로컬 입이 팩을 읽기 위한 순수 뷰. 스토어/i18n 없음.

import type { ArcCoreAgentPack, ArcCoreAgentPackCard } from './arcCoreAgentPack';
import { isArcCoreChatFollowUp } from './arcCoreChatDialogueState';
import { hintArcCoreChatTopicId } from './arcCoreChatTableIndex';
import type { ArcCoreChatToolResult } from './arcCoreChatReadTools';

export type LocalConversationalPackView = {
  topicId: string;
  lastArcQuestion: string;
  followUp: boolean;
  knowledgeCards: readonly ArcCoreAgentPackCard[];
  toolResults: readonly ArcCoreChatToolResult[];
  steerLine: string;
};

export function viewFromAgentPack(
  pack: ArcCoreAgentPack,
  userText: string,
): LocalConversationalPackView {
  const last = pack.topicStack.length > 0 ? pack.topicStack[pack.topicStack.length - 1]! : '';
  return {
    topicId: last || hintArcCoreChatTopicId(userText),
    lastArcQuestion: pack.lastArcQuestion,
    followUp: isArcCoreChatFollowUp(userText),
    knowledgeCards: pack.knowledgeCards,
    toolResults: pack.toolResults,
    steerLine: pack.gm?.steerLine?.trim() ?? '',
  };
}

export function readArcCoreChatToolData(
  view: LocalConversationalPackView | undefined,
  name: string,
): Record<string, string | number | boolean | null> | null {
  if (!view) return null;
  for (let i = 0; i < view.toolResults.length; i += 1) {
    const row = view.toolResults[i];
    if (row?.name === name) return row.data;
  }
  return null;
}

export function readArcCoreChatToolNumber(
  view: LocalConversationalPackView | undefined,
  name: string,
  field: string,
): number | null {
  const data = readArcCoreChatToolData(view, name);
  if (!data) return null;
  const raw = data[field];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

export function readArcCoreChatToolFlag(
  view: LocalConversationalPackView | undefined,
  name: string,
  field: string,
): boolean {
  const data = readArcCoreChatToolData(view, name);
  return data?.[field] === true;
}

export function readArcCoreChatToolText(
  view: LocalConversationalPackView | undefined,
  name: string,
  field: string,
): string {
  const data = readArcCoreChatToolData(view, name);
  const raw = data?.[field];
  return typeof raw === 'string' ? raw.trim() : '';
}

export function firstKnowledgeCardText(
  view: LocalConversationalPackView | undefined,
  topicId: string,
): string {
  if (!view) return '';
  for (let i = 0; i < view.knowledgeCards.length; i += 1) {
    const card = view.knowledgeCards[i];
    if (card?.topicId === topicId && card.text.trim()) return card.text.trim();
  }
  return '';
}

export function firstStellaFieldNoteText(
  view: LocalConversationalPackView | undefined,
): string {
  if (!view) return '';
  for (let i = 0; i < view.knowledgeCards.length; i += 1) {
    const card = view.knowledgeCards[i];
    const id = card?.id ?? '';
    if (
      card?.text.trim()
      && (id.startsWith('sqd_') || id.startsWith('sqa_') || id.startsWith('scn_'))
    ) {
      return card.text.trim();
    }
  }
  return '';
}

export function knowledgeCardTextById(
  view: LocalConversationalPackView | undefined,
  knowledgeId: string,
): string {
  if (!view || !knowledgeId) return '';
  for (let i = 0; i < view.knowledgeCards.length; i += 1) {
    const card = view.knowledgeCards[i];
    if (card?.id === knowledgeId && card.text.trim()) return card.text.trim();
  }
  return '';
}
