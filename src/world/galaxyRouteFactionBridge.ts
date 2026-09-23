// ============================================================
// 동서남북 항로 · 교역 F1–F4 · 점유 수도 — 기존 테이블 연결
// ============================================================

import { getPlanetTradeRouteProfile } from '../arcCore/economy/tradeRouteRegistry';
import {
  type GalaxyRouteDirection,
  type QuadTradeFactionCode,
  type TradeRegionCode,
} from './galaxyRouteFactionPolicy';

export type { TradeRegionCode };

const TRADE_FACTION_TO_GALAXY_ROUTE: Record<QuadTradeFactionCode, GalaxyRouteDirection> = {
  F1: 'west',
  F2: 'south',
  F3: 'east',
  F4: 'north',
};

/** docs/_000_ARCFIRE_PLANET_COMPENDIUM §5 — eden_city = 블루 상업 수도 (occupation BLUE) */
export const BLUE_COMMERCIAL_CAPITAL_PLANET_ID = 'eden_city';

/** planet_occupation_seeds — core_prime = 레드팀 수도 (occupation RED) */
export const RED_FACTION_CAPITAL_PLANET_ID = 'core_prime';

/** F2 머큐리움 — 확장 남단(코어 21 밖) */
export const SOUTH_FACTION_CAPITAL_PLANET_ID = 'synth_706_p';

/** F4 아우렐리움 — 확장 북단(코어 21 밖) */
export const NORTH_FACTION_CAPITAL_PLANET_ID = 'synth_732_p';

const CAPITAL_ROUTE_BY_PLANET_ID: Record<string, GalaxyRouteDirection> = {
  [BLUE_COMMERCIAL_CAPITAL_PLANET_ID]: 'west',
  [SOUTH_FACTION_CAPITAL_PLANET_ID]: 'south',
  [RED_FACTION_CAPITAL_PLANET_ID]: 'east',
  [NORTH_FACTION_CAPITAL_PLANET_ID]: 'north',
};

/** 교역 프로필 F 코드 → 항로 (지역 키 이중 해석 없음). 4대 수도 id 는 프로필 없어도 항로 고정 */
export function resolveGalaxyRouteDirectionForPlanet(planetId: string): GalaxyRouteDirection | null {
  const id = String(planetId ?? '').trim();
  if (!id) return null;
  const locked = CAPITAL_ROUTE_BY_PLANET_ID[id];
  if (locked) return locked;
  const profile = getPlanetTradeRouteProfile(id);
  if (!profile) return null;
  const code = profile.tradeFactionCode as QuadTradeFactionCode;
  return TRADE_FACTION_TO_GALAXY_ROUTE[code] ?? null;
}

export function isBlueCommercialCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === BLUE_COMMERCIAL_CAPITAL_PLANET_ID;
}

export function isRedFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === RED_FACTION_CAPITAL_PLANET_ID;
}

export function isSouthFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === SOUTH_FACTION_CAPITAL_PLANET_ID;
}

export function isNorthFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return String(planetId ?? '').trim() === NORTH_FACTION_CAPITAL_PLANET_ID;
}

export function isMegaFactionCapitalPlanet(planetId: string | null | undefined): boolean {
  return (
    isBlueCommercialCapitalPlanet(planetId)
    || isRedFactionCapitalPlanet(planetId)
    || isSouthFactionCapitalPlanet(planetId)
    || isNorthFactionCapitalPlanet(planetId)
  );
}

/** 전쟁축(블루/레드) 수도만. 남·북은 점유 hold 접두가 아님 */
export function resolveMegaFactionCapitalSide(
  planetId: string | null | undefined,
): 'blue' | 'red' | null {
  if (isBlueCommercialCapitalPlanet(planetId)) return 'blue';
  if (isRedFactionCapitalPlanet(planetId)) return 'red';
  return null;
}
