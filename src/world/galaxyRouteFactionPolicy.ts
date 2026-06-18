import { StarSystem } from '../types';

export type GalaxyRouteDirection = 'north' | 'south' | 'east' | 'west';

export type GalaxyRoutePolicy = {
  id: GalaxyRouteDirection;
  factionId: string;
  zone: StarSystem['zone'];
  centerPlanetId: string | null;
};

// 향후 밸런싱/세계관 변경 시 이 테이블만 수정하면 된다.
// UI 표시명은 worldmap `worldmap.route.*` i18n 키 사용.
export const GALAXY_ROUTE_POLICIES: Record<GalaxyRouteDirection, GalaxyRoutePolicy> = {
  north: {
    id: 'north',
    factionId: 'federation',
    zone: 'safe',
    centerPlanetId: null,
  },
  south: {
    id: 'south',
    factionId: 'trade_coalition',
    zone: 'pvp',
    centerPlanetId: null,
  },
  east: {
    id: 'east',
    factionId: 'scientists',
    zone: 'neutral',
    centerPlanetId: null,
  },
  west: {
    id: 'west',
    factionId: 'miners_guild',
    zone: 'neutral',
    centerPlanetId: null,
  },
};

