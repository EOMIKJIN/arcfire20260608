// ============================================================
// 행성 id → Planet — CSV 21행성 + worldStore synth·런타임 autogen 통합 조회
// ============================================================

import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { STAR_SYSTEMS } from '../data/systems';
import type { Planet } from '../types';
import { resolveSystemIdForPlanetIdFromGalaxy } from './resolvePlanetSystemPosition';

function readWorldStoreSystems(): Record<string, import('../types').StarSystem> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../store/worldStore') as typeof import('../store/worldStore');
  return useWorldStore.getState().systems;
}

function findInWorldStoreSystems(planetId: string): Planet | null {
  const systems = readWorldStoreSystems();
  for (const system of Object.values(systems)) {
    const planet = system.planets.find((p) => p.id === planetId);
    if (planet) return planet;
  }
  return null;
}

function findInGalaxySystems(planetId: string): Planet | null {
  for (const system of Object.values(STAR_SYSTEMS)) {
    const planet = system.planets.find((p) => p.id === planetId);
    if (planet) return planet;
  }
  for (const system of Object.values(GALAXY_SYSTEMS)) {
    const planet = system.planets.find((p) => p.id === planetId);
    if (planet) return planet;
  }
  return null;
}

/** synth — worldStore autogen(B→A) 우선. GALAXY 정적 템플릿은 hasTradePort=false 잔재 */
export function resolvePlanetById(planetId: string): Planet | null {
  const id = planetId.trim();
  if (!id) return null;

  if (id.startsWith('synth_')) {
    const runtime = findInWorldStoreSystems(id);
    if (runtime) return runtime;
    return findInGalaxySystems(id);
  }

  const staticPlanet = findInGalaxySystems(id);
  if (staticPlanet) {
    const runtime = findInWorldStoreSystems(id);
    return runtime ?? staticPlanet;
  }

  return findInWorldStoreSystems(id);
}

/** synth 성계 id(synth_002) → 행성 id(synth_002_p) 정규화 */
export function normalizeSynthSystemIdToPlanetId(rawId: string): string | null {
  const id = rawId.trim();
  if (!/^synth_\d{3}$/.test(id)) return null;
  const planetId = `${id}_p`;
  return resolvePlanetById(planetId) ? planetId : null;
}

/**
 * 허브 preflight·출발·worldmap 세션 — planetId 후보를 worldStore 기준으로 확정.
 * currentSystemId 첫 행성 폴백 포함.
 */
export function resolvePlanetHubPreflightId(planetId: string | null | undefined): string | null {
  const raw = planetId?.trim();
  if (raw) {
    if (resolvePlanetById(raw)) return raw;
    const synthPlanetId = normalizeSynthSystemIdToPlanetId(raw);
    if (synthPlanetId) return synthPlanetId;
    const systemId = resolveSystemIdForPlanetIdFromGalaxy(raw);
    if (systemId) {
      const sys = readWorldStoreSystems()[systemId];
      const match = sys?.planets.find((p) => p.id === raw);
      if (match) return match.id;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  const playerSystemId = usePlayerStore.getState().player?.currentSystemId ?? null;
  if (playerSystemId) {
    const sys = readWorldStoreSystems()[playerSystemId];
    const first = sys?.planets[0]?.id ?? null;
    if (first && resolvePlanetById(first)) return first;
  }

  return null;
}

/** 출발·은하맵 — 성계만 유효해도 허용(미개척 synth 포함) */
export function isPlanetHubDepartureContextValid(planetId: string | null | undefined): boolean {
  if (resolvePlanetHubPreflightId(planetId)) return true;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  const systemId = usePlayerStore.getState().player?.currentSystemId;
  if (!systemId) return false;
  return Boolean(readWorldStoreSystems()[systemId]);
}
