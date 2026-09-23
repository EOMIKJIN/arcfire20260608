import { StarSystem } from '../types';
import {
  MEGA_FACTION_BLUE_NATION,
  MEGA_FACTION_NORTH_NATION,
  MEGA_FACTION_RED_NATION,
  MEGA_FACTION_SOUTH_NATION,
} from './megaFactionNationPolicy';

export type GalaxyRouteDirection = 'north' | 'south' | 'east' | 'west';

/** 교역 4분면 — `planet_trade_route_profile.csv` · 마지노선 F2/F4와 동일 */
export type QuadTradeFactionCode = 'F1' | 'F2' | 'F3' | 'F4';
export type TradeRegionCode = 'W' | 'E' | 'S' | 'N';

export type GalaxyRoutePolicy = {
  id: GalaxyRouteDirection;
  /**
   * 사분면 국가 id (§6-5).
   * `planets.csv` flavor(`federation`/`scientists` 등)와 다름 — 국가 정본으로 쓰지 말 것.
   */
  factionId: string;
  tradeFactionCode: QuadTradeFactionCode;
  tradeRegionCode: TradeRegionCode;
  displayNameKo: string;
  displayNameEn: string;
  zone: StarSystem['zone'];
  centerPlanetId: string | null;
};

/**
 * 4대 팩션 항로 정본 (2026-08-15).
 * 국호는 `megaFactionNationPolicy` — 점유 접두(블루/레드)와 별축.
 */
export const GALAXY_ROUTE_POLICIES: Record<GalaxyRouteDirection, GalaxyRoutePolicy> = {
  west: {
    id: 'west',
    factionId: MEGA_FACTION_BLUE_NATION.megaFactionId,
    tradeFactionCode: 'F1',
    tradeRegionCode: 'W',
    displayNameKo: MEGA_FACTION_BLUE_NATION.displayNameKo,
    displayNameEn: MEGA_FACTION_BLUE_NATION.displayNameEn,
    zone: 'neutral',
    centerPlanetId: 'eden_city',
  },
  south: {
    id: 'south',
    factionId: MEGA_FACTION_SOUTH_NATION.megaFactionId,
    tradeFactionCode: 'F2',
    tradeRegionCode: 'S',
    displayNameKo: MEGA_FACTION_SOUTH_NATION.displayNameKo,
    displayNameEn: MEGA_FACTION_SOUTH_NATION.displayNameEn,
    zone: 'pvp',
    /** 확장 남단 관문(미발견-706, y≈2.78). 코어 21 제외 — 대표님 2026-09-13 */
    centerPlanetId: 'synth_706_p',
  },
  east: {
    id: 'east',
    factionId: MEGA_FACTION_RED_NATION.megaFactionId,
    tradeFactionCode: 'F3',
    tradeRegionCode: 'E',
    displayNameKo: MEGA_FACTION_RED_NATION.displayNameKo,
    displayNameEn: MEGA_FACTION_RED_NATION.displayNameEn,
    zone: 'neutral',
    centerPlanetId: 'core_prime',
  },
  north: {
    id: 'north',
    factionId: MEGA_FACTION_NORTH_NATION.megaFactionId,
    tradeFactionCode: 'F4',
    tradeRegionCode: 'N',
    displayNameKo: MEGA_FACTION_NORTH_NATION.displayNameKo,
    displayNameEn: MEGA_FACTION_NORTH_NATION.displayNameEn,
    zone: 'safe',
    /** 확장 북단 관문(미발견-732, y≈−1.86). 코어 21 제외 — 대표님 2026-09-13 */
    centerPlanetId: 'synth_732_p',
  },
};
