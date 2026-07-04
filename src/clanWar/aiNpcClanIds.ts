import type { NpcCaptain } from '../types';
import { getAiClanRegistryForLeaderCaptain, resolveCaptainAiClanId } from './aiClanRegistry';

/** AI 클랜장(실유저 연동 전) — `Player.uid`와 구분되는 가상 리더 키 */
export const AI_NPC_CAPTAIN_LEADER_UID_PREFIX = 'npc_captain:' as const;

export function npcCaptainLeaderUid(captainId: string): string {
  return `${AI_NPC_CAPTAIN_LEADER_UID_PREFIX}${captainId}`;
}

/** 레거시 per-captain id → 레지스트리 stable id (저장 데이터 마이그레이션용) */
const LEGACY_AI_CLAN_ID_BY_CAPTAIN: Record<string, string> = {
  npc_cpt_ai_clan_safe_01: 'ai_clan_safe_convoy',
  npc_cpt_ai_clan_neutral_01: 'ai_clan_neutral_circuit',
  npc_cpt_ai_clan_pvp_01: 'ai_clan_crimson_raiders',
};

export function normalizeAiClanId(clanId: string): string {
  const trimmed = clanId.trim();
  if (!trimmed.startsWith('ai_clan_npc_cpt_')) return trimmed;
  const captainSuffix = trimmed.slice('ai_clan_'.length);
  return LEGACY_AI_CLAN_ID_BY_CAPTAIN[captainSuffix] ?? trimmed;
}

export function aiClanIdForNpcCaptain(captainId: string): string {
  const hub = getAiClanRegistryForLeaderCaptain(captainId);
  if (hub) return hub.id;
  return LEGACY_AI_CLAN_ID_BY_CAPTAIN[captainId] ?? `ai_clan_${captainId}`;
}

export function aiClanIdForCaptainRecord(captain: Pick<NpcCaptain, 'aiClanId' | 'id' | 'isAiClanLeader'>): string {
  const fromRecord = resolveCaptainAiClanId(captain);
  if (fromRecord) return fromRecord;
  return aiClanIdForNpcCaptain(captain.id);
}
