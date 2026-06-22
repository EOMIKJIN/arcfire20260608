import { resolveLaboratoryRdSpeedReductionPct } from '../../../arcCore/balance/facilityLaboratoryLevelPolicy';
import { resolveFacilityLevelByType } from '../../../game/planetDevelopment/planetFacilityLevelResolver';
import { readPlanetCoreStatRdSnapshot } from '../../../game/planetDevelopment/planetCoreStatRdRuntime';
import { createPlanetDevelopmentHydrateSteps } from '../hydrateRecipes';
import { preflightPlanetHubFacilitySession } from '../preflightPlanetHubFacility';
import type { HeavyUiSessionConfig } from '../types';

export type SkilltreeScreenSessionData = {
  planetId: string;
  labLevel: number;
  rdSpeedReductionPct: number;
  nextTechnologyRdHours: number | null;
};

export function createSkilltreeScreenSession(planetId: string): HeavyUiSessionConfig<SkilltreeScreenSessionData> {
  return {
    sessionKey: `skilltree-screen:${planetId}`,
    preflight: () => preflightPlanetHubFacilitySession('research_lab', planetId),
    hydrateSteps: createPlanetDevelopmentHydrateSteps(),
    build: () => {
      const labLevel = resolveFacilityLevelByType(planetId, 'laboratory');
      const rd = readPlanetCoreStatRdSnapshot(planetId);
      return {
        planetId,
        labLevel,
        rdSpeedReductionPct: labLevel > 0 ? resolveLaboratoryRdSpeedReductionPct(labLevel) : 0,
        nextTechnologyRdHours: rd.nextTechnologyRdHours ?? null,
      };
    },
  };
}
