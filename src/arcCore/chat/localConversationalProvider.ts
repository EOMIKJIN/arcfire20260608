// 로컬 인간 대화 회신 — 의도 1축 · 팩 관측. 월드 write 없음.

import { t } from '../../i18n';
import { clampArcCoreChatText } from '../../store/arcCoreChatStore';
import type { ArcCoreAgentPack } from './arcCoreAgentPack';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';
import type { ArcCoreChatReplyProvider, ArcCoreChatReplyResult } from './arcCoreChatReplyProvider';
import { resolveLocalConversationalReplySpec } from './localConversationalReplySpec';
import { viewFromAgentPack } from './localConversationalPackView';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';

const REPLY_PREFIX = 'arcCoreChat.reply.';
const CLUE_PREFIX = 'arcCoreChat.drive.clue.';

/** 오퍼레이터 F5 — 근원체 키를 덮지 않고 대응 키로만 옮긴다. */
export function remapOperatorLocalI18nKey(key: string, persona: NlMouthId): string {
  if (persona !== 'operator' || !key) return key;
  if (key.startsWith('arcCoreChat.operator.')) return key;
  if (key.startsWith(REPLY_PREFIX)) {
    return `arcCoreChat.operator.reply.${key.slice(REPLY_PREFIX.length)}`;
  }
  if (key.startsWith(CLUE_PREFIX)) {
    return `arcCoreChat.operator.drive.clue.${key.slice(CLUE_PREFIX.length)}`;
  }
  return key;
}

export { resolveLocalConversationalReplySpec } from './localConversationalReplySpec';
export type { LocalConversationalReplySpec } from './localConversationalReplySpec';

export function composeLocalConversationalReply(
  turn: ArcCoreChatTurn,
  pack?: ArcCoreAgentPack,
): string {
  const view = pack ? viewFromAgentPack(pack, turn.userText) : undefined;
  const spec = resolveLocalConversationalReplySpec(turn, view);
  const persona = turn.policy.persona;
  if (spec.rawText) {
    const clueKey = spec.clueKey ? remapOperatorLocalI18nKey(spec.clueKey, persona) : '';
    const clue = clueKey ? t(clueKey) : '';
    const clueOk = clue && clue !== clueKey;
    return clueOk ? `${spec.rawText} ${clue}` : spec.rawText;
  }
  const key = remapOperatorLocalI18nKey(spec.key, persona);
  const primary = t(key, spec.params);
  if (!spec.clueKey) {
    const life = persona === 'operator' ? pack?.lifeLine?.trim() ?? '' : '';
    return life && !primary.includes(life) ? `${primary} ${life}` : primary;
  }
  const clueKey = remapOperatorLocalI18nKey(spec.clueKey, persona);
  const clue = t(clueKey);
  if (!clue || clue === clueKey) {
    const life = persona === 'operator' ? pack?.lifeLine?.trim() ?? '' : '';
    return life && !primary.includes(life) ? `${primary} ${life}` : primary;
  }
  return `${primary} ${clue}`;
}

export const localConversationalProvider: ArcCoreChatReplyProvider = {
  id: 'local',
  complete(turn, pack) {
    const text = clampArcCoreChatText(composeLocalConversationalReply(turn, pack));
    const result: ArcCoreChatReplyResult = {
      text,
      providerId: 'local',
      fallbackUsed: false,
    };
    return Promise.resolve(result);
  },
};
