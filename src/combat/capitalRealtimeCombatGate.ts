/**
 * 메인스테이지 궤도 전투 on/off 판정 — 경량(PlanetEdenRaidTestLayer 미로드).
 */

import { resolvePlanetHostileShipCount } from '../arcCore/balance/balanceTableRegistry';
import { NPC_CAPTAINS_FROM_CSV, NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated';
import { captainMatchesPlanetOrbitTable } from '../npc/captainOrbitTableMatch';

export const CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID = '__transit__';

export type CombatFleetSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
};

export function resolveCombatFleetSlotsFromCaptains(
  planetId: string,
  systemId: string | null,
): CombatFleetSeedSlot[] {
  const shipById = new Map(NPC_CAPITAL_SHIPS_FROM_CSV.map((s) => [s.id, s]));
  const rows: CombatFleetSeedSlot[] = [];
  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    const planetMatch = systemId
      ? captainMatchesPlanetOrbitTable(captain, planetId, systemId)
      : captain.basePlanetId === planetId || captain.activityPlanetIds.includes(planetId);
    if (!planetMatch || captain.operationalState !== 'combat') continue;
    const assignedShipId = captain.assignedShipId || '';
    rows.push({
      team:
        captain.combatTeam === 'blue'
          ? 'blue'
          : captain.combatTeam === 'orange'
            ? 'orange'
            : 'red',
      npcShipId: shipById.has(assignedShipId) ? assignedShipId : null,
      captainId: captain.id,
    });
  }
  const cap = resolvePlanetHostileShipCount(planetId);
  if (cap == null) return rows;
  let redCount = 0;
  return rows.filter((slot) => {
    if (slot.team !== 'red') return true;
    if (redCount >= cap) return false;
    redCount += 1;
    return true;
  });
}

export function hasCapitalRealtimeCombatSlotsForPlanet(
  planetId: string,
  systemId: string | null = null,
): boolean {
  return resolveCombatFleetSlotsFromCaptains(planetId, systemId).length > 0;
}

/** @deprecated `hasCapitalRealtimeCombatSlotsForPlanet`와 동일 */
export function isCapitalRealtimeCombatOrbitPlanet(
  planetId: string,
  systemId: string | null = null,
): boolean {
  return hasCapitalRealtimeCombatSlotsForPlanet(planetId, systemId);
}
