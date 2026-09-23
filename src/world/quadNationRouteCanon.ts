// ============================================================
// 4대 항로 = 4대 국가 — 행성 → F·지역 정본
// 수도 잠금 + 은하 좌표 사분면. planets.csv flavor·점유 hold 와 별축.
// ============================================================

import {
  GALAXY_ROUTE_POLICIES,
  type GalaxyRouteDirection,
  type QuadTradeFactionCode,
  type TradeRegionCode,
} from './galaxyRouteFactionPolicy';
import { resolveSystemPositionForPlanetId } from './resolvePlanetSystemPosition';

/** F1↔W · F2↔S · F3↔E · F4↔N — 어긋나면 정본 위반 */
export const QUAD_TRADE_REGION_BY_FACTION: Record<QuadTradeFactionCode, TradeRegionCode> = {
  F1: 'W',
  F2: 'S',
  F3: 'E',
  F4: 'N',
};

export const LOCKED_CANON_ROUTE_BY_PLANET_ID: Record<string, GalaxyRouteDirection> = {
  eden_city: 'west',
  synth_706_p: 'south',
  core_prime: 'east',
  synth_732_p: 'north',
};

export function resolveCardinalRouteForPosition(pos: { x: number; y: number }): GalaxyRouteDirection {
  const dx = pos.x - 0.5;
  const dy = pos.y - 0.5;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'south' : 'north';
}

export function resolveCanonRouteForPlanetId(planetId: string): GalaxyRouteDirection | null {
  const id = String(planetId ?? '').trim();
  if (!id) return null;
  const locked = LOCKED_CANON_ROUTE_BY_PLANET_ID[id];
  if (locked) return locked;
  const pos = resolveSystemPositionForPlanetId(id);
  if (!pos) return null;
  return resolveCardinalRouteForPosition(pos);
}

export function resolveCanonTradeCodesForPlanetId(planetId: string): {
  tradeFactionCode: QuadTradeFactionCode;
  tradeRegionCode: TradeRegionCode;
  route: GalaxyRouteDirection;
} | null {
  const route = resolveCanonRouteForPlanetId(planetId);
  if (!route) return null;
  const policy = GALAXY_ROUTE_POLICIES[route];
  return {
    tradeFactionCode: policy.tradeFactionCode,
    tradeRegionCode: policy.tradeRegionCode,
    route,
  };
}
