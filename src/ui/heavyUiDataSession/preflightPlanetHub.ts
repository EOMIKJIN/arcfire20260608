import {
  isPlanetHubDepartureContextValid,
  resolvePlanetById,
  resolvePlanetHubPreflightId,
} from '../../world/resolvePlanetById';
import { usePlayerStore } from '../../store/playerStore';
import type { HeavyUiPreflightCode, HeavyUiPreflightResult } from './types';

export function preflightPlanetHubSession(planetId: string | null | undefined): HeavyUiPreflightResult {
  if (!usePlayerStore.getState().player) return { ok: false, code: 'player_not_loaded' };

  const resolvedId = resolvePlanetHubPreflightId(planetId);
  if (!resolvedId) return { ok: false, code: 'missing_planet_id' };
  if (!resolvePlanetById(resolvedId)) return { ok: false, code: 'unknown_planet' };
  return { ok: true };
}

/** 출발(은하계 지도) — 행성 CSV 미등록 synth·성계 앵커만 있어도 통과 */
export function preflightPlanetHubDepartureSession(planetId: string | null | undefined): HeavyUiPreflightResult {
  if (!usePlayerStore.getState().player) return { ok: false, code: 'player_not_loaded' };
  if (!isPlanetHubDepartureContextValid(planetId)) {
    return { ok: false, code: 'missing_planet_id' };
  }
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
