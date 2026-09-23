// inbound 오프너 턴 — 순수. 스토어/클라우드 없음.

import {
  clueTopicForInboundWhy,
  topicIdForInboundWhy,
  type ArcCoreInboundTalkWhySnap,
} from './arcCoreInboundTalkWhy';
import {
  buildArcCoreChatTurn,
  type ArcCoreChatFactSnapshot,
  type ArcCoreChatTurn,
} from './arcCoreChatTurn';

export const ARC_CORE_INBOUND_OPEN_USER_FLAG = 'accepted_talk';

export function buildInboundOpenerTurn(
  why: ArcCoreInboundTalkWhySnap,
  facts: ArcCoreChatFactSnapshot,
): ArcCoreChatTurn {
  const base = buildArcCoreChatTurn(ARC_CORE_INBOUND_OPEN_USER_FLAG, [], facts, 'arc_core');
  return {
    ...base,
    inboundWhy: why.id,
    topicId: topicIdForInboundWhy(why.id),
    drive: {
      purposeId: 'invite_axis',
      mode: 'lead',
      reactTopic: null,
      clueTopic: clueTopicForInboundWhy(why.id),
      nextAsk: '',
    },
  };
}
