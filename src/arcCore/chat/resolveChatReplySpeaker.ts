/**
 * 회신 화자 1명 — 턴당 클라우드 1. 창을 나누지 않는다.
 * 정본: docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md
 */

import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import { hintArcCoreChatTopicId } from './arcCoreChatTableIndex';

const ORIGIN_SELF_RE = /아크코어|근원체|arc\s*core|origin/i;

const ORIGIN_TOPIC_IDS = new Set(['seats']);

export function resolveChatReplySpeaker(input: {
  activeSpeaker: NlMouthId;
  userText: string;
  originHold?: boolean;
  tutorialForce?: boolean;
}): NlMouthId {
  if (input.originHold) return 'arc_core';
  if (input.tutorialForce) return input.activeSpeaker;
  const topicId = hintArcCoreChatTopicId(input.userText);
  if (ORIGIN_TOPIC_IDS.has(topicId)) return 'arc_core';
  if (ORIGIN_SELF_RE.test(input.userText)) return 'arc_core';
  return input.activeSpeaker;
}

export function defaultNlMouthForBackchannelReason(reason: string): NlMouthId {
  if (reason === 'inbound_request' || reason === 'combat_end') return 'arc_core';
  return 'operator';
}

export function shouldHoldOriginMouth(reason: string): boolean {
  return reason === 'inbound_request' || reason === 'combat_end';
}
