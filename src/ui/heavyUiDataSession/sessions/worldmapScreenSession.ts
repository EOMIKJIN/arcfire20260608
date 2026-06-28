import { buildCsvStaticIndexesFull } from '../../../game/buildCsvStaticIndexes';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import { createClanWarFoundationStep } from '../hydrateRecipes';
import { resolvePlanetHubPreflightId } from '../../../world/resolvePlanetById';
import { preflightPlanetHubDepartureSession } from '../preflightPlanetHub';
import type { HeavyUiSessionConfig } from '../types';

export type WorldmapScreenSessionData = {
  ready: true;
};

export function createWorldmapScreenSession(planetId: string): HeavyUiSessionConfig<WorldmapScreenSessionData> {
  const anchorPlanetId = resolvePlanetHubPreflightId(planetId) ?? planetId;
  return {
    sessionKey: `worldmap-screen:${anchorPlanetId}`,
    preflight: () => preflightPlanetHubDepartureSession(anchorPlanetId),
    hydrateSteps: [
      createClanWarFoundationStep(),
      {
        id: 'csv_static_indexes',
        run: async () => {
          buildCsvStaticIndexesFull();
        },
      },
    ],
    build: () => ({ ready: true }),
    minLoadingMs: 520,
  };
}

export function readWorldmapSessionRevision(): string {
  const holds = useClanWarFoundationStore.getState().planetHolds;
  return `${Object.keys(holds).length}:${useClanWarFoundationStore.getState().hydrated}`;
}
