import { preflightPlanetHubFacilitySession } from '../preflightPlanetHubFacility';
import { usePlayerStore } from '../../../store/playerStore';
import type { HeavyUiSessionConfig } from '../types';

export type ShipyardScreenSessionData = {
  planetId: string;
};

export function createShipyardScreenSession(planetId: string): HeavyUiSessionConfig<ShipyardScreenSessionData> {
  return {
    sessionKey: `shipyard-screen:${planetId}`,
    preflight: () => preflightPlanetHubFacilitySession('shipyard', planetId),
    hydrateSteps: [
      {
        id: 'player_local_hydrate',
        isReady: () => usePlayerStore.getState().player != null,
        run: () => usePlayerStore.getState().loadLocalPlayer(),
      },
    ],
    build: () => ({ planetId }),
  };
}
