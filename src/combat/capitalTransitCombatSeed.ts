// ============================================================
// 이동중(transit) 전투 시드 — 목적지 전용적 1척 + 플레이어 기함
// ============================================================

import { getNpcCaptain, hasNpcCapitalShipId } from '../npc/npcFleetRegistry';
import { resolveTransitHostileCaptainForSystem } from '../npc/transitHostileCaptainResolve';
import {
  resolveCombatEnemyCaptain,
  type MissionCombatCaptainResolveInput,
} from '../missions/resolveMissionCombatCaptain';
import { buildTransitCombatInstanceKey } from '../arcCore/captainPresence/buildCombatInstanceKey';
import {
  buildMissionCombatSeedMeta,
  isCaptainAvailableForMissionCombatAtPlanet,
} from '../arcCore/captainPresence/resolveMissionCaptainPresence';
import { useTransitCombatSessionStore } from '../game/transitCombat/transitCombatSession';

function resolveBoundTransitMissionContext(
  systemId: string | null,
): MissionCombatCaptainResolveInput | null {
  const session = useTransitCombatSessionStore.getState().session;
  const templateId = session?.missionEnemyTemplateId?.trim() ?? '';
  if (!templateId) return null;
  return {
    enemyTemplateId: templateId,
    planetId: session?.missionPlanetId ?? null,
    systemId,
  };
}

export function resolveTransitPirateShipIdFromTables(
  systemId?: string | null,
  missionContext?: MissionCombatCaptainResolveInput | null,
): string | null {
  const captain = missionContext?.enemyTemplateId
    ? resolveCombatEnemyCaptain({
        enemyTemplateId: missionContext.enemyTemplateId,
        planetId: missionContext.planetId ?? null,
        systemId: systemId ?? null,
      })
    : resolveTransitHostileCaptainForSystem(systemId ?? null);
  const shipId = captain?.assignedShipId?.trim() ?? '';
  if (!shipId || !hasNpcCapitalShipId(shipId)) return null;
  return shipId;
}

export type TransitCombatSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
  combatInstanceKey?: string | null;
};

/** `resolveCurrentPlayerFlagshipNpcShipId`는 sim 모듈에 유지 — 시드만 registry 경유 */
export function buildTransitCombatSeedSlots(
  systemId: string | null,
  currentFlagshipNpcId: string,
  missionContext?: MissionCombatCaptainResolveInput | null,
): TransitCombatSeedSlot[] {
  const boundMission = missionContext?.enemyTemplateId
    ? missionContext
    : resolveBoundTransitMissionContext(systemId);
  const redCaptain = boundMission?.enemyTemplateId
    ? resolveCombatEnemyCaptain({
        enemyTemplateId: boundMission.enemyTemplateId,
        planetId: boundMission.planetId ?? null,
        systemId,
      })
    : resolveTransitHostileCaptainForSystem(systemId);

  const missionMeta = boundMission?.enemyTemplateId
    ? buildMissionCombatSeedMeta(
        boundMission.enemyTemplateId,
        boundMission.planetId ?? null,
        redCaptain,
      )
    : null;

  const redAvailable = boundMission?.enemyTemplateId
    ? Boolean(
        redCaptain
        && isCaptainAvailableForMissionCombatAtPlanet(redCaptain, boundMission.planetId ?? null),
      )
    : Boolean(redCaptain);
  const redShipId =
    redAvailable && redCaptain?.assignedShipId?.trim()
      ? redCaptain.assignedShipId.trim()
      : null;
  const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
  const redInstanceKey =
    missionMeta?.combatInstanceKey ??
    buildTransitCombatInstanceKey(systemId, redCaptain?.id ?? null);

  return [
    {
      team: 'red',
      npcShipId: redShipId,
      captainId: redAvailable ? redCaptain?.id ?? null : null,
      combatInstanceKey: redInstanceKey,
    },
    { team: 'blue', npcShipId: blueShipId, captainId: null, combatInstanceKey: 'transit_player_flagship' },
  ];
}

export function getNpcCaptainOrUndefined(captainId: string) {
  return getNpcCaptain(captainId);
}
