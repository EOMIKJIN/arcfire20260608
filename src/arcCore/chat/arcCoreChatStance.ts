// 아크코어 이번 턴 태도 — 유저 intent와 다름. administer는 B LIVE 전까지 고르지 않음.

import type { ArcCoreChatFactSnapshot, ArcCoreChatTurn } from './arcCoreChatTurn';
import type { ArcCoreChatIntent } from './arcCoreChatIntent';

export const ARC_CORE_CHAT_STANCES = [
  'observe',
  'warn',
  'refuse',
  'inquire',
  'administer',
] as const;

export type ArcCoreChatStance = (typeof ARC_CORE_CHAT_STANCES)[number];

const ACTIVE_STANCES = new Set<ArcCoreChatStance>(['observe', 'warn', 'refuse', 'inquire']);

export function isActiveArcCoreChatStance(raw: string): raw is Exclude<ArcCoreChatStance, 'administer'> {
  return ACTIVE_STANCES.has(raw as ArcCoreChatStance);
}

export function sanitizeArcCoreChatStance(raw: unknown): Exclude<ArcCoreChatStance, 'administer'> {
  const id = String(raw ?? '').trim();
  if (id === 'administer') return 'observe';
  if (isActiveArcCoreChatStance(id)) return id;
  return 'observe';
}

export function resolveArcCoreChatStance(input: {
  intent: ArcCoreChatIntent;
  topicId: string;
  facts: ArcCoreChatFactSnapshot;
}): Exclude<ArcCoreChatStance, 'administer'> {
  const topic = input.topicId.trim();
  if (input.intent === 'refuse' || topic === 'refuse') return 'refuse';
  if ((input.intent === 'spy' || topic === 'spy') && input.facts.spyAlertPending) {
    return 'warn';
  }
  return 'observe';
}

export function resolveArcCoreChatStanceFromTurn(
  turn: Pick<ArcCoreChatTurn, 'intent' | 'facts'> & { topicId?: string },
): Exclude<ArcCoreChatStance, 'administer'> {
  return resolveArcCoreChatStance({
    intent: turn.intent,
    topicId: turn.topicId ?? '',
    facts: turn.facts,
  });
}
