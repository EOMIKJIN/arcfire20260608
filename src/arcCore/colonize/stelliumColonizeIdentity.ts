/**
 * 개척선 정체 — 전 자동화 AI. 일반 전함·함장 테이블에 등록하지 않는다.
 *
 * 시스템 확인: 전투(capital_ship / npc_ai_ships), INFO/궤도(arcNpcTrafficStore),
 * 함장 대화/바 로스터(npc_ai_captains), 조선소·플레이어 함대 어디에도
 * 개척선 실엔티티가 필요 없다. 허브 마크는 가상 포즈만 쓴다.
 */

import type { StelliumColonizePolicy } from './stelliumColonizeTypes';

export const STELLIUM_COLONIZE_VIRTUAL_ID_PREFIX = 'stellium_colonize:';

/** pack 포맷용 더미. npc_ai_captains 에 없음 */
export const STELLIUM_COLONIZE_AI_OPERATOR_ID = 'ai_auto_colonize';

export function isStelliumColonizeVirtualShipId(id: string): boolean {
  return id.startsWith(STELLIUM_COLONIZE_VIRTUAL_ID_PREFIX);
}

export function stelliumColonizeRequiresWarshipRegistry(
  policy: Pick<StelliumColonizePolicy, 'requireShipTable' | 'requireCaptain'>,
): boolean {
  return policy.requireShipTable === true || policy.requireCaptain === true;
}

export function resolveStelliumColonizeIdentity(
  policy: StelliumColonizePolicy,
): {
  aiAutomated: boolean;
  requireShipTable: boolean;
  requireCaptain: boolean;
  registerAsWarship: boolean;
} {
  return {
    aiAutomated: policy.aiAutomated,
    requireShipTable: policy.requireShipTable,
    requireCaptain: policy.requireCaptain,
    registerAsWarship: stelliumColonizeRequiresWarshipRegistry(policy),
  };
}
