import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { usePlayerStore } from '../../store/playerStore';
import type { HeavyUiPreflightCode, HeavyUiPreflightResult } from './types';

export function preflightPlanetHubSession(planetId: string | null | undefined): HeavyUiPreflightResult {
  const id = planetId?.trim();
  if (!id) return { ok: false, code: 'missing_planet_id' };
  if (!findPlanetById(id)) return { ok: false, code: 'unknown_planet' };
  if (!usePlayerStore.getState().player) return { ok: false, code: 'player_not_loaded' };
  return { ok: true };
}

export function preflightPlanetHubSessionOrThrow(planetId: string): void {
  const result = preflightPlanetHubSession(planetId);
  if (!result.ok) {
    const err = new Error(result.code) as Error & { code: HeavyUiPreflightCode };
    err.code = result.code;
    throw err;
  }
}
