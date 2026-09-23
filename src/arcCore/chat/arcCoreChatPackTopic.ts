// 팩 주제 — 순수. 「거긴」+새 축은 직전 맥락과 새 도구를 같이 쓴다.

import { isArcCoreChatFollowUp } from './arcCoreChatDialogueState';
import {
  topicIdForInboundWhy,
  toolNameForInboundWhy,
  type ArcCoreInboundTalkWhyId,
} from './arcCoreInboundTalkWhy';
import { hintArcCoreChatTopicId, listHintToolsForTopic } from './arcCoreChatTableIndex';

const WEAK_HINTS = new Set(['other', 'greet', 'smalltalk']);

export type ArcCoreChatPackTopic = {
  topicId: string;
  cardTopicIds: string[];
  toolNames: string[];
};

export function resolveArcCoreChatPackTopic(
  userText: string,
  stack: readonly string[],
): ArcCoreChatPackTopic {
  const hinted = hintArcCoreChatTopicId(userText);
  const last = stack.length > 0 ? stack[stack.length - 1]! : '';
  const followUp = isArcCoreChatFollowUp(userText);

  let topicId = hinted;
  if (followUp && last) {
    topicId = !WEAK_HINTS.has(hinted) && hinted !== last ? hinted : last;
  }

  const cardTopicIds: string[] = [];
  const seenCards = new Set<string>();
  const cardOrder = followUp && last && last !== topicId ? [last, topicId] : [topicId];
  for (let i = 0; i < cardOrder.length; i += 1) {
    const id = cardOrder[i]!;
    if (!id || seenCards.has(id)) continue;
    seenCards.add(id);
    cardTopicIds.push(id);
  }

  const toolNames: string[] = [];
  const seenTools = new Set<string>();
  for (let i = 0; i < cardTopicIds.length && toolNames.length < 4; i += 1) {
    const tools = listHintToolsForTopic(cardTopicIds[i]!);
    for (let t = 0; t < tools.length && toolNames.length < 4; t += 1) {
      const name = tools[t]!;
      if (!name || seenTools.has(name)) continue;
      seenTools.add(name);
      toolNames.push(name);
    }
  }

  return { topicId, cardTopicIds, toolNames };
}

/** inbound 수락 오프너 — handshake 문구가 other로 주제를 덮지 않게 이유 축으로 시드. */
export function resolveInboundOpenerPackTopic(
  whyId: ArcCoreInboundTalkWhyId,
): ArcCoreChatPackTopic {
  const topicId = topicIdForInboundWhy(whyId);
  const tool = toolNameForInboundWhy(whyId);
  return {
    topicId,
    cardTopicIds: topicId ? [topicId] : [],
    toolNames: tool ? [tool] : [],
  };
}

export function mergeArcCoreChatKnowledgeTopics(input: {
  cardTopicIds: readonly string[];
  clueTopic: string | null;
  humanFirst: boolean;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (id: string, front?: boolean) => {
    const topic = id.trim();
    if (!topic || seen.has(topic) || out.length >= 4) return;
    seen.add(topic);
    if (front) out.unshift(topic);
    else out.push(topic);
    if (out.length > 4) out.length = 4;
  };
  if (input.humanFirst) add('smalltalk');
  for (let i = 0; i < input.cardTopicIds.length; i += 1) {
    add(input.cardTopicIds[i]!);
  }
  const clue = input.clueTopic?.trim() ?? '';
  if (clue) add(clue);
  if (!input.humanFirst) add('smalltalk');
  return out;
}
