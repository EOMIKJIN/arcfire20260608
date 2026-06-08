import type { NpcCaptain } from '../types';

export type NpcCaptainRelation = 'ally' | 'hostile' | 'neutral';

/**
 * 주게임시스템 팩션 관계 판단.
 * - instanceTeamOverride=true 이면 인스턴스 전투 규칙이 우선이며, 이 함수 결과는 참고용으로만 사용한다.
 */
export function resolveNpcCaptainRelation(
  a: NpcCaptain,
  b: NpcCaptain,
  instanceTeamOverride = false,
): NpcCaptainRelation {
  if (a.id === b.id) return 'ally';
  if (instanceTeamOverride) return 'neutral';
  const aFaction = a.factionId;
  const bFaction = b.factionId;
  if (!aFaction || !bFaction) return 'neutral';
  if (a.hostileFactionIds.includes(bFaction) || b.hostileFactionIds.includes(aFaction)) {
    return 'hostile';
  }
  if (a.friendlyFactionIds.includes(bFaction) || b.friendlyFactionIds.includes(aFaction)) {
    return 'ally';
  }
  if (aFaction === bFaction) return 'ally';
  return 'neutral';
}

export function shouldNpcCaptainsEnterCombatByFaction(a: NpcCaptain, b: NpcCaptain): boolean {
  return resolveNpcCaptainRelation(a, b, false) === 'hostile';
}
