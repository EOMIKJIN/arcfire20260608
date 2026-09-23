// 백채널 회신 입구 — 턴 조립 + Provider. 명령버스·AABS·경제 import 금지.

import {
  completeArcCoreChatReply,
  type ArcCoreChatReplyProviderId,
} from './arcCoreChatReplyProvider';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import { buildArcCoreChatTurn, type ArcCoreChatTurnRecent } from './arcCoreChatTurn';
import { readArcCoreChatFacts } from './arcCoreChatTurnFacts';
import { stellaLifeAllowsLead } from './stellaLifeCognition';
import { snapshotStellaLifeMemory } from './stellaLifeMemory';

export type ArcCoreBackchannelReply = {
  text: string;
  providerId: ArcCoreChatReplyProviderId;
  fallbackUsed: boolean;
};

export async function buildArcCoreBackchannelReply(
  userText: string,
  recent: readonly ArcCoreChatTurnRecent[] = [],
  speakerId?: NlMouthId,
): Promise<ArcCoreBackchannelReply> {
  const facts = readArcCoreChatFacts(recent);
  const allowLead = speakerId !== 'operator' || stellaLifeAllowsLead(snapshotStellaLifeMemory());
  const turn = buildArcCoreChatTurn(userText, recent, facts, speakerId, allowLead);
  const result = await completeArcCoreChatReply(turn);
  return { text: result.text, providerId: result.providerId, fallbackUsed: result.fallbackUsed };
}
