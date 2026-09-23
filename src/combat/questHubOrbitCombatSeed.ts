/**
 * hub_orbit 퀘스트 — 레벨 combat 함장 대신 퀘스트 1척 + 플레이어 기함.
 */

import { resolveCombatEnemyCaptain } from '../missions/resolveMissionCombatCaptain';
import {
  isQuestHubOrbitLockAtPlanet,
  type QuestCombatLock,
} from '../missions/questCombatLock';
import { hasNpcCapitalShipId } from '../npc/npcFleetRegistry';
import type { CombatFleetSeedSlot } from './capitalRealtimeCombatGate';

const PLAYER_FLAGSHIP_CAPTAIN_ID = 'Player_pilot';

export function buildQuestHubOrbitSeedSlots(
  lock: QuestCombatLock | null,
  planetId: string,
  systemId: string | null,
  currentFlagshipNpcId: string,
): CombatFleetSeedSlot[] | null {
  if (!isQuestHubOrbitLockAtPlanet(lock, planetId)) return null;

  const captain = resolveCombatEnemyCaptain({
    enemyTemplateId: lock!.templateId,
    planetId: lock!.anchorPlanetId,
    systemId,
  });
  const redShipId = captain?.assignedShipId?.trim() || null;
  const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;

  return [
    {
      team: 'red',
      npcShipId: redShipId && hasNpcCapitalShipId(redShipId) ? redShipId : null,
      captainId: captain?.id ?? null,
      combatInstanceKey: `quest_hub_orbit_${lock!.missionId}_${lock!.objectiveId}`,
    },
    {
      team: 'blue',
      npcShipId: blueShipId,
      captainId: PLAYER_FLAGSHIP_CAPTAIN_ID,
      combatInstanceKey: 'quest_hub_orbit_player_flagship',
    },
  ];
}
