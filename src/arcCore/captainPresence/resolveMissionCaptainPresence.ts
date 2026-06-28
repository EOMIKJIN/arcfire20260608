// ============================================================
// 미션·전투 함장 — primary presence 가용성 + instance key
// ============================================================

import type { NpcCaptain } from '../../types';
import {
  getCaptainPrimaryPresence,
  type getCaptainPresenceWorldIndex,
} from './buildCaptainPresenceWorldIndex';
import { buildMissionCombatInstanceKey } from './buildCombatInstanceKey';

const BLOCKING_ACTIVITIES = new Set([
  'governor_post',
  'orbit_arc_transport',
  'orbit_table_patrol',
  'tavern_host',
]);

/**
 * 함장 primary가 다른 행성/궤도에 묶여 있으면 미션 전투 시드에서 제외.
 * @returns null = 사용 가능
 */
export function resolveMissionCaptainPrimaryBlockReason(
  captainId: string,
  planetId: string | null | undefined,
  arcShips: Parameters<typeof getCaptainPresenceWorldIndex>[0] = [],
): string | null {
  const primary = getCaptainPrimaryPresence(captainId, arcShips);
  if (!primary) return null;
  if (!BLOCKING_ACTIVITIES.has(primary.activity)) return null;
  const pid = String(planetId ?? '').trim();
  if (pid && primary.planetId === pid) return null;
  return `primary_${primary.activity}@${primary.planetId ?? primary.systemId ?? 'unknown'}`;
}

export function isCaptainAvailableForMissionCombatAtPlanet(
  captain: NpcCaptain | undefined,
  planetId: string | null | undefined,
  arcShips: Parameters<typeof getCaptainPresenceWorldIndex>[0] = [],
): captain is NpcCaptain {
  if (!captain) return false;
  return resolveMissionCaptainPrimaryBlockReason(captain.id, planetId, arcShips) === null;
}

export function buildMissionCombatSeedMeta(
  enemyTemplateId: string,
  planetId: string | null | undefined,
  captain: NpcCaptain | undefined,
): { combatInstanceKey: string; blockedReason: string | null } {
  const blockedReason = captain
    ? resolveMissionCaptainPrimaryBlockReason(captain.id, planetId)
    : 'no_captain';
  return {
    combatInstanceKey: buildMissionCombatInstanceKey(
      enemyTemplateId,
      planetId,
      captain?.id ?? null,
    ),
    blockedReason: captain && blockedReason === null ? null : blockedReason,
  };
}
