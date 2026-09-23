// inbound 수락 오프너 — 클라우드 질문 1회, 실패 시 로컬 질문 폴백.
// 전송 경로와 별도. 월드 write·시설 확인창·가짜 유저 줄 없음.

import { useArcCoreShadowIdentityStore } from '../../store/arcCoreShadowIdentityStore';
import { buildArcCoreAgentPack } from './arcCoreAgentPack';
import { resetArcCoreChatCloudSkip } from './arcCoreChatCloudSkip';
import { readArcCoreChatFacts } from './arcCoreChatTurnFacts';
import { tryCompleteCloudArcCoreChatReply } from './cloudConversationalProvider';
import { buildInboundOpenerTurn } from './arcCoreInboundOpenerTurn';
import {
  isArcCoreSpokenQuestion,
  type ArcCoreInboundTalkWhySnap,
} from './arcCoreInboundTalkWhy';
import { finalizeArcCoreChatSpokenReply } from './arcCoreChatSpokenLength';
import { quarantineArcCoreChatReply } from './quarantineArcCoreChatReply';

export { ARC_CORE_INBOUND_OPEN_USER_FLAG, buildInboundOpenerTurn } from './arcCoreInboundOpenerTurn';

export async function resolveArcCoreInboundOpenerSpeech(
  why: ArcCoreInboundTalkWhySnap,
): Promise<string> {
  const fallback = why.text.trim();
  try {
    resetArcCoreChatCloudSkip();
    const facts = readArcCoreChatFacts([]);
    const turn = buildInboundOpenerTurn(why, facts);
    const revealShadow = useArcCoreShadowIdentityStore.getState().revealedAtMs != null;
    const pack = buildArcCoreAgentPack(turn, revealShadow);
    const cloud = await tryCompleteCloudArcCoreChatReply(pack);
    if (cloud.status !== 'ok') return fallback;
    const raw = String(cloud.reply.text ?? '').trim();
    let text = quarantineArcCoreChatReply(raw, pack);
    if (!text) {
      const soft = raw.slice(0, pack.policy.maxChars);
      if (soft && !/^\s*(\{|\[|```)/.test(soft)) text = soft;
    }
    if (text && isArcCoreSpokenQuestion(text)) {
      return finalizeArcCoreChatSpokenReply(text, turn).slice(0, 240);
    }
  } catch {
    /* 로컬 질문 폴백 */
  }
  return fallback;
}
