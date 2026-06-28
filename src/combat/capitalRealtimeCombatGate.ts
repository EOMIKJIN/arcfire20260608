/**
 * 메인스테이지 궤도 전투 on/off 판정 — 경량(PlanetEdenRaidTestLayer 미로드).
 */

import { resolvePlanetHostileShipCount } from '../arcCore/balance/balanceTableRegistry';
import { NPC_CAPTAINS_FROM_CSV, NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated';
import { resolvePlanetGovernorHostileCombatCaptainId } from '../game/planetGovernor/planetGovernorRegistry';
import { captainMatchesPlanetOrbitTable } from '../npc/captainOrbitTableMatch';
import { getCaptainPrimaryPresence } from '../arcCore/captainPresence/buildCaptainPresenceWorldIndex';
import { getNpcCaptain } from '../npc/npcFleetRegistry';

export const CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID = '__transit__';

export type CombatFleetSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
  /** 전투 인스턴스 구분(웨이브 등) — CSV 함장 id 중복 spawn 시 world presence 제외 */
  combatInstanceKey?: string | null;
};

function resolveCombatTeamFromCaptain(
  combatTeam: string | null | undefined,
): CombatFleetSeedSlot['team'] {
  if (combatTeam === 'blue') return 'blue';
  if (combatTeam === 'orange') return 'orange';
  return 'red';
}

function buildCombatSlotFromCaptainId(captainId: string): CombatFleetSeedSlot | null {
  const captain = getNpcCaptain(captainId);
  if (!captain) return null;
  const assignedShipId = String(captain.assignedShipId ?? '').trim();
  const shipById = new Map(NPC_CAPITAL_SHIPS_FROM_CSV.map((s) => [s.id, s]));
  return {
    team: resolveCombatTeamFromCaptain(captain.combatTeam),
    npcShipId: assignedShipId && shipById.has(assignedShipId) ? assignedShipId : null,
    captainId: captain.id,
  };
}

function appendGovernorHostileCombatSlot(
  planetId: string,
  rows: CombatFleetSeedSlot[],
): CombatFleetSeedSlot[] {
  const governorCaptainId = resolvePlanetGovernorHostileCombatCaptainId(planetId);
  if (!governorCaptainId) return rows;
  if (rows.some((slot) => slot.captainId === governorCaptainId)) return rows;
  const govSlot = buildCombatSlotFromCaptainId(governorCaptainId);
  if (!govSlot) return rows;
  return [govSlot, ...rows];
}

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
    const primary = getCaptainPrimaryPresence(captain.id);
    if (
      primary
      && primary.activity === 'combat_orbit_posture'
      && primary.planetId
      && primary.planetId !== planetId
    ) {
      continue;
    }
    const assignedShipId = captain.assignedShipId || '';
    rows.push({
      team: resolveCombatTeamFromCaptain(captain.combatTeam),
      npcShipId: shipById.has(assignedShipId) ? assignedShipId : null,
      captainId: captain.id,
    });
  }
  const withGovernor = appendGovernorHostileCombatSlot(planetId, rows);
  const cap = resolvePlanetHostileShipCount(planetId);
  if (cap == null) return withGovernor;
  let redCount = 0;
  return withGovernor.filter((slot) => {
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
