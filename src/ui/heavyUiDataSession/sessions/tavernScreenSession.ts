import { preflightPlanetHubFacilitySession } from '../preflightPlanetHubFacility';
import { useTavernBoardStore } from '../../../store/tavernBoardStore';
import type { HeavyUiSessionConfig } from '../types';

export type TavernScreenSessionData = {
  planetId: string;
};

export function createTavernScreenSession(planetId: string): HeavyUiSessionConfig<TavernScreenSessionData> {
  return {
    sessionKey: `tavern-screen:${planetId}`,
    preflight: () => preflightPlanetHubFacilitySession('tavern', planetId),
    hydrateSteps: [
      {
        id: 'tavern_board',
        isReady: () => useTavernBoardStore.getState().loaded,
        run: () => useTavernBoardStore.getState().loadLocalBoard(),
      },
    ],
    build: () => ({ planetId }),
  };
}
