// 세션 작업기억 — topic/question 은 오픈 시 리셋. rollingSummary 는 persist(G4).

import {
  extractArcCoreChatAskedQuestion,
  foldArcCoreChatRollingSummaryText,
} from './arcCoreChatRollingSummary';

const TOPIC_STACK_MAX = 4;
const LAST_QUESTION_MAX = 200;
const FOLLOW_UP_RE = /^(그건|거긴|왜|응|그래|그거)(?:\s|[?？]|$)|^(why|that|yeah|yes)\b/i;

let topicStack: string[] = [];
let lastArcQuestion = '';
let rollingSummary = '';

export function resetArcCoreChatDialogueState(input?: {
  keepSummary?: boolean;
  keepMemory?: boolean;
}): void {
  topicStack = [];
  const keep = Boolean(input?.keepMemory || input?.keepSummary);
  if (!keep) lastArcQuestion = '';
  if (!keep) rollingSummary = '';
}

export function getArcCoreChatTopicStack(): readonly string[] {
  return topicStack;
}

export function getArcCoreChatLastQuestion(): string {
  return lastArcQuestion;
}

export function getArcCoreChatRollingSummary(): string {
  return rollingSummary;
}

export function hydrateArcCoreChatRollingSummary(text: string): void {
  rollingSummary = String(text ?? '').trim().slice(0, 400);
}

export function hydrateArcCoreChatLastQuestion(text: string): void {
  lastArcQuestion = String(text ?? '').trim().slice(0, LAST_QUESTION_MAX);
}

export function isArcCoreChatFollowUp(userText: string): boolean {
  return FOLLOW_UP_RE.test(userText.trim());
}

export function pushArcCoreChatTopic(topicId: string): void {
  const id = topicId.trim();
  if (!id) return;
  const next = topicStack.filter((row) => row !== id);
  next.push(id);
  topicStack = next.slice(-TOPIC_STACK_MAX);
}

export function setArcCoreChatLastQuestion(text: string): void {
  const raw = text.trim();
  lastArcQuestion = raw ? raw.slice(0, LAST_QUESTION_MAX) : '';
}

export function rememberArcCoreChatAskedFromReply(reply: string): void {
  const asked = extractArcCoreChatAskedQuestion(reply);
  if (asked) setArcCoreChatLastQuestion(asked);
}

export function rememberArcCoreChatTopics(topicIds: readonly string[]): void {
  for (let i = 0; i < topicIds.length; i += 1) {
    pushArcCoreChatTopic(topicIds[i]!);
  }
}

export function foldArcCoreChatRollingSummary(userText: string, reply: string): string {
  rollingSummary = foldArcCoreChatRollingSummaryText(rollingSummary, userText, reply);
  return rollingSummary;
}
