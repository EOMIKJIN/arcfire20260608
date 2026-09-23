// 구어 길이 — 평소 2~3문장, 세계 축만 최대 6. 채우려고 늘리지 않는다.

import {
  isArcCoreChatSystemAxis,
  isArcCoreChatWorldSeeking,
} from './arcCoreChatCasualTalk';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';

export const ARC_CORE_CHAT_SPOKEN_EVERYDAY_MAX = 3;
export const ARC_CORE_CHAT_SPOKEN_NEEDED_MAX = 6;
export const ARC_CORE_CHAT_SPOKEN_INBOUND_MAX = 2;

const SENTENCE_SPLIT_RE = /(?<=[.!?。？！])\s+|(?<=[.!?。？！])(?=[^\s.!?。？！])|\n+/;

export function spokenLineBudgetForTurn(
  turn: Pick<ArcCoreChatTurn, 'inboundWhy' | 'intent' | 'topicId' | 'userText' | 'drive'>,
): number {
  if (turn.inboundWhy) return ARC_CORE_CHAT_SPOKEN_INBOUND_MAX;
  if (turn.drive.mode === 'hold') return ARC_CORE_CHAT_SPOKEN_EVERYDAY_MAX;
  if (isArcCoreChatSystemAxis({ intent: turn.intent, topicId: turn.topicId })) {
    return ARC_CORE_CHAT_SPOKEN_NEEDED_MAX;
  }
  if (isArcCoreChatWorldSeeking(turn.userText)) return ARC_CORE_CHAT_SPOKEN_NEEDED_MAX;
  if (turn.drive.mode === 'clue' || turn.drive.mode === 'lead') {
    return ARC_CORE_CHAT_SPOKEN_NEEDED_MAX;
  }
  return ARC_CORE_CHAT_SPOKEN_EVERYDAY_MAX;
}

export function clipArcCoreChatSpokenLength(text: string, maxSentences: number): string {
  const raw = String(text ?? '').trim();
  if (!raw) return '';
  const cap = Math.max(1, Math.min(ARC_CORE_CHAT_SPOKEN_NEEDED_MAX, Math.floor(maxSentences)));
  const parts = raw.split(SENTENCE_SPLIT_RE).map((row) => row.trim()).filter(Boolean);
  if (parts.length <= 1) return raw;
  if (parts.length <= cap) return raw;
  const kept = parts.slice(0, cap);
  const endsWithStop = /[.!?。？！]$/.test(kept[kept.length - 1] ?? '');
  return endsWithStop ? kept.join(' ') : `${kept.join(' ')}.`;
}

export function finalizeArcCoreChatSpokenReply(text: string, turn: ArcCoreChatTurn): string {
  return clipArcCoreChatSpokenLength(text, spokenLineBudgetForTurn(turn));
}
