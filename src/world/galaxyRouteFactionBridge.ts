// ============================================================
// 동서남북 항로 · 교역 F1–F4 · 점유 시드 — 기존 테이블 연결
// ============================================================

import { getPlanetTradeRouteProfile } from '../arcCore/economy/tradeRouteRegistry';
import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../data/balance/generated';
import {
  GALAXY_ROUTE_POLICIES,
  type GalaxyRouteDirection,
  type GalaxyRoutePolicy,
} from './galaxyRouteFactionPolicy';

export type TradeRegionCode = 'W' | 'E' | 'S' | 'N';

const TRADE_REGION_TO_GALAXY_ROUTE: Record<TradeRegionCode, GalaxyRouteDirection> = {
  W: 'west',
  E: 'east',
  S: 'south',
  N: 'north',
};

/** `tables/balance/planet_trade_route_profile.csv` → `GALAXY_ROUTE_POLICIES` */
export function resolveGalaxyRouteDirectionForPlanet(planetId: string): GalaxyRouteDirection | null {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return null;
  const code = profile.tradeRegionCode as TradeRegionCode;
  return TRADE_REGION_TO_GALAXY_ROUTE[code] ?? null;
}

export function resolveGalaxyRoutePolicyForPlanet(planetId: string): GalaxyRoutePolicy | null {
  const dir = resolveGalaxyRouteDirectionForPlanet(planetId);
  return dir ? GALAXY_ROUTE_POLICIES[dir] : null;
}

export function resolveOccupationSeedForPlanet(planetId: string) {
  return PlanetOccupationSeeds_FROM_BALANCE_CSV.find((row) => row.planetId === planetId) ?? null;
}

/** docs/_000_ARCFIRE_PLANET_COMPENDIUM §5 — eden_city = 블루 상업 수도 (occupation BLUE) */
export const BLUE_COMMERCIAL_CAPITAL_PLANET_ID = 'eden_city';

/** planet_occupation_seeds — core_prime = 레드팀 수도 (occupation RED) */
export const RED_FACTION_CAPITAL_PLANET_ID = 'core_prime';

export const MEGA_FACTION_CAPITAL_PLANET_IDS = {
  blue: BLUE_COMMERCIAL_CAPITAL_PLANET_ID,
  red: RED_FACTION_CAPITAL_PLANET_ID,
} as const;

export function isBlueCommercialCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === BLUE_COMMERCIAL_CAPITAL_PLANET_ID;
}

export function isRedFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === RED_FACTION_CAPITAL_PLANET_ID;
}

export function isMegaFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return isBlueCommercialCapitalPlanet(planetId) || isRedFactionCapitalPlanet(planetId);
}

export function resolveMegaFactionCapitalSide(
  planetId: string | null | undefined,
): 'blue' | 'red' | null {
  if (isBlueCommercialCapitalPlanet(planetId)) return 'blue';
  if (isRedFactionCapitalPlanet(planetId)) return 'red';
  return null;
}

/** 은하 좌표 → 동서남북 (worldStore·월드맵과 동일) */
export function resolveCardinalKeyForPosition(pos: { x: number; y: number }): GalaxyRouteDirection {
  const dx = pos.x - 0.5;
  const dy = pos.y - 0.5;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'south' : 'north';
}
