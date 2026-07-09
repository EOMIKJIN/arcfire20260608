// ============================================================
// 플레이어 영토 접근 — RED 점령지 체류·개발 금지 (ArcCore 전용)
// ============================================================

import { resolvePlanetHoldForOwnershipCheck, resolveTerritorialSideForHold } from './planetOwnershipModel';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';

export type PlayerRedTerritoryBlockReason = 'red_territory';

export function resolveTerritorialSideForPlanet(planetId: string): MapFactionSide {
  const id = planetId?.trim();
  if (!id) return 'neutral';
  const foundation = useClanWarFoundationStore.getState();
  const hold = resolvePlanetHoldForOwnershipCheck(id, foundation.planetHolds[id]);
  return resolveTerritorialSideForHold(hold, foundation.clans);
}

export function isRedOccupiedPlanet(planetId: string): boolean {
  return resolveTerritorialSideForPlanet(planetId) === 'red';
}

/** 플레이어 착륙·허브 체류 차단 — null이면 허용 */
export function resolvePlayerPlanetStayBlock(planetId: string): PlayerRedTerritoryBlockReason | null {
  const id = planetId?.trim();
  if (!id) return null;
  return isRedOccupiedPlanet(id) ? 'red_territory' : null;
}
