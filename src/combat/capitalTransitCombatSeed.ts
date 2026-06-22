// ============================================================
// 이동중(transit) 전투 시드 — npcFleetRegistry O(1) 조회
// ============================================================

import {
  getNpcCaptain,
  hasNpcCapitalShipId,
  resolveTransitPirateCaptainForSystem,
} from '../npc/npcFleetRegistry';
import {
  resolveCombatEnemyCaptain,
  type MissionCombatCaptainResolveInput,
} from '../missions/resolveMissionCombatCaptain';

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
    : resolveTransitPirateCaptainForSystem(systemId ?? null);
  const shipId = captain?.assignedShipId?.trim() ?? '';
  if (!shipId || !hasNpcCapitalShipId(shipId)) return null;
  return shipId;
}

export type TransitCombatSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
};

/** `resolveCurrentPlayerFlagshipNpcShipId`는 sim 모듈에 유지 — 시드만 registry 경유 */
export function buildTransitCombatSeedSlots(
  systemId: string | null,
  currentFlagshipNpcId: string,
  missionContext?: MissionCombatCaptainResolveInput | null,
): TransitCombatSeedSlot[] {
  const redCaptain = missionContext?.enemyTemplateId
    ? resolveCombatEnemyCaptain({
        enemyTemplateId: missionContext.enemyTemplateId,
        planetId: missionContext.planetId ?? null,
        systemId,
      })
    : resolveTransitPirateCaptainForSystem(systemId);
  const redShipId = redCaptain?.assignedShipId?.trim() ?? null;
  const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
  return [
    { team: 'red', npcShipId: redShipId, captainId: redCaptain?.id ?? null },
    { team: 'blue', npcShipId: blueShipId, captainId: null },
  ];
}

export function getNpcCaptainOrUndefined(captainId: string) {
  return getNpcCaptain(captainId);
}
