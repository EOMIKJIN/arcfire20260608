import type { NlMouthId } from '../../game/conversation/conversationGateContract';

export type ArcCoreBackchannelReason =
  | 'manual'
  | 'session_start'
  | 'inbound_request'
  | 'operator_life'
  | 'combat_end'
  | 'quest_accept'
  | 'quest_clear'
  | 'quest_objective'
  | 'story_scene_end'
  /** A1 1차 종료 후 스텔라 NL 첫 유대 — 튜토리얼 예외(combat_end와 같은 1→2 체인) */
  | 'first_scan';

export type PresentArcCoreBackchannelInput = {
  reason: ArcCoreBackchannelReason;
  openerText?: string;
  triggerId?: string;
  /** hydrate/부트 대기 없이 패널부터 */
  immediate?: boolean;
  dismissOnBackdrop?: boolean;
  forceFreshSession?: boolean;
  speakerId?: NlMouthId;
};

export function arcCoreBackchannelTriggerKey(
  reason: ArcCoreBackchannelReason,
  triggerId?: string,
): { key: string; id: string } | null {
  if (reason === 'manual') return null;
  const id = (triggerId ?? '').trim();
  if (!id) return null;
  return { key: reason, id };
}
