import { runTradeRouteMarketPass } from '../../../arcCore/economy/runTradeRouteMarketPass';
import { forceResyncPlanetTradePortCatalog } from '../../../arcCore/balance/tradePortCatalogPolicy';
import { isPlanetCatalogWarmed } from '../../../arcCore/memory/residentSetRegistry';
import { isPlanetHubTradePortEnabled } from '../../../game/planetDevelopment/planetHubFacilityGates';
import { createPlanetCoreBootstrapStep } from '../hydrateRecipes';
import { preflightPlanetHubFacilitySession } from '../preflightPlanetHubFacility';
import type { HeavyUiSessionConfig } from '../types';

export type TradeScreenSessionData = {
  planetId: string;
};

export function createTradeScreenSession(planetId: string): HeavyUiSessionConfig<TradeScreenSessionData> {
  return {
    sessionKey: `trade-screen:${planetId}`,
    preflight: () => preflightPlanetHubFacilitySession('trade', planetId),
    hydrateSteps: [
      createPlanetCoreBootstrapStep(),
      {
        id: 'trade_port_catalog_resync',
        run: async () => {
          try {
            if (!isPlanetCatalogWarmed(planetId)) {
              forceResyncPlanetTradePortCatalog(planetId);
            }
          } catch (err) {
            if (__DEV__) {
              console.warn('[TradeScreen] catalog resync failed', planetId, err);
            }
          }
        },
      },
      {
        id: 'trade_route_market_pass',
        run: async () => {
          runTradeRouteMarketPass(false);
        },
      },
    ],
    build: () => ({ planetId }),
  };
}

export function isTradeScreenFacilityEnabled(planetId: string): boolean {
  return isPlanetHubTradePortEnabled(planetId);
}
