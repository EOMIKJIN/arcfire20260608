/**
 * 대화 2게이트 분류 — 순수 규칙. RN/스토어/오버레이 import 금지.
 * 정본: docs/CONVERSATION_TWO_GATE_DESIGN.md
 */

export const CONVERSATION_GATE_COMM = 1 as const;
export const CONVERSATION_GATE_MESSENGER = 2 as const;

export type ConversationGate = typeof CONVERSATION_GATE_COMM | typeof CONVERSATION_GATE_MESSENGER;

/** 명단 행·연락 주체 */
export type ConversationContactKind = 'directory' | 'npc_script' | 'nl_mouth';

export type NlMouthId = 'arc_core' | 'operator';

export type ConversationContactReason =
  | 'hub_manual'
  | 'inbound_request'
  | 'operator_life'
  | 'combat_end'
  | 'session_start'
  | 'boot_chat_first';

const NL_MOUTH_ROW_KINDS = new Set<string>(['arc_core', 'operator', 'nl_mouth']);

export function isNlMouthRowKind(rowKind: string): boolean {
  return NL_MOUTH_ROW_KINDS.has(rowKind);
}

export function resolveConversationContactKind(rowKind: string): ConversationContactKind {
  if (rowKind === 'directory' || rowKind === 'roster') return 'directory';
  if (isNlMouthRowKind(rowKind)) return 'nl_mouth';
  return 'npc_script';
}

/** NL 입만 1차 이후 메신저를 연다. NPC 스크립트는 통신에서 끝. */
export function conversationOpensMessenger(kind: ConversationContactKind): boolean {
  return kind === 'nl_mouth';
}

/** 선제 연락만 수락/취소. 허브에서 행을 고른 뒤는 [확인]으로 연결. */
export function nlMouthCommRequiresAccept(reason: ConversationContactReason): boolean {
  return reason === 'inbound_request' || reason === 'operator_life';
}

/**
 * 타이틀 boot-chat-first 만 1차를 생략한다(타이틀 ≠ 인게임 통신).
 * combat_end 는 이미 오퍼레이터 1차가 있으므로 여기 넣지 않는다.
 */
export function nlMouthSkipsGate1(reason: ConversationContactReason): boolean {
  return reason === 'session_start' || reason === 'boot_chat_first' || reason === 'hub_manual';
}
