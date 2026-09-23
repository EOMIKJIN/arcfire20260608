import { preflightPlanetHubFacilitySession } from '../preflightPlanetHubFacility';
import { useBarBoardStore } from '../../../store/barBoardStore';
import type { HeavyUiSessionConfig } from '../types';

export type BarScreenSessionData = {
  planetId: string;
};

export function createBarScreenSession(planetId: string): HeavyUiSessionConfig<BarScreenSessionData> {
  return {
    sessionKey: `bar-screen:${planetId}`,
    preflight: () => preflightPlanetHubFacilitySession('bar', planetId),
    hydrateSteps: [
      {
        id: 'bar_board',
        isReady: () => useBarBoardStore.getState().loaded,
        run: () => useBarBoardStore.getState().loadLocalBoard(),
      },
    ],
    build: () => ({ planetId }),
  };
}
