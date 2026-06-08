/** AI 클랜장(실유저 연동 전) — `Player.uid`와 구분되는 가상 리더 키 */
export const AI_NPC_CAPTAIN_LEADER_UID_PREFIX = 'npc_captain:' as const;

export function npcCaptainLeaderUid(captainId: string): string {
  return `${AI_NPC_CAPTAIN_LEADER_UID_PREFIX}${captainId}`;
}

export function aiClanIdForNpcCaptain(captainId: string): string {
  return `ai_clan_${captainId}`;
}
