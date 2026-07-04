// ============================================================
// RED 점령 행성 — ArcCore 개발 eligible 집합 (≤10)
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlanetOccupationSeeds';
import { isRedOccupiedPlanet } from '../../clanWar/planetTerritoryPlayerAccess';

const RED_SEED_PLANET_IDS: readonly string[] = PlanetOccupationSeeds_FROM_BALANCE_CSV
  .filter((row) => String(row.initialOwner ?? '').trim().toUpperCase() === 'RED')
  .map((row) => row.planetId);

/** tick 버퍼 — 매 60s 최대 10행성, 재할당 최소화 */
const eligibleScratch: string[] = [];

export function listArcCoreRedOccupiedPlanetIds(): readonly string[] {
  eligibleScratch.length = 0;
  for (let i = 0; i < RED_SEED_PLANET_IDS.length; i += 1) {
    const planetId = RED_SEED_PLANET_IDS[i]!;
    if (isRedOccupiedPlanet(planetId)) eligibleScratch.push(planetId);
  }
  return eligibleScratch;
}

export function isArcCoreRedDevEligiblePlanet(planetId: string): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  for (let i = 0; i < RED_SEED_PLANET_IDS.length; i += 1) {
    if (RED_SEED_PLANET_IDS[i] === id) return isRedOccupiedPlanet(id);
  }
  return false;
}
