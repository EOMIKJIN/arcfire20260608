import { createPlanetDevelopmentHydrateSteps } from '../hydrateRecipes';
import { preflightPlanetHubSession } from '../preflightPlanetHub';
import type { HeavyUiSessionConfig } from '../types';

export function createPlanetDevDetailSession<TData>(
  planetId: string,
  moduleId: string,
  build: () => TData,
): HeavyUiSessionConfig<TData> {
  return {
    sessionKey: `planet-dev-detail:${planetId}:${moduleId}`,
    preflight: () => preflightPlanetHubSession(planetId),
    hydrateSteps: createPlanetDevelopmentHydrateSteps(),
    build,
  };
}
