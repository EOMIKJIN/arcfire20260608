import { StarSystem } from '../types';

export type GalaxyRouteDirection = 'north' | 'south' | 'east' | 'west';

export type GalaxyRoutePolicy = {
  id: GalaxyRouteDirection;
  displayName: string;
  factionId: string;
  zone: StarSystem['zone'];
  centerPlanetId: string | null;
  note: string;
};

// 향후 밸런싱/세계관 변경 시 이 테이블만 수정하면 된다.
export const GALAXY_ROUTE_POLICIES: Record<GalaxyRouteDirection, GalaxyRoutePolicy> = {
  north: {
    id: 'north',
    displayName: '북부항로',
    factionId: 'federation',
    zone: 'safe',
    centerPlanetId: null,
    note: '극한 환경과 강한 군사력의 축. 아크코어 거점권.',
  },
  south: {
    id: 'south',
    displayName: '남부항로',
    factionId: 'trade_coalition',
    zone: 'pvp',
    centerPlanetId: null,
    note: '무역/외교 중심 항로. 아르카디아 인접권 포함.',
  },
  east: {
    id: 'east',
    displayName: '동부항로',
    factionId: 'scientists',
    zone: 'neutral',
    centerPlanetId: null,
    note: '기술/문명 고도화 권역.',
  },
  west: {
    id: 'west',
    displayName: '서부항로',
    factionId: 'miners_guild',
    zone: 'neutral',
    centerPlanetId: null,
    note: '자원/산업 중심 권역.',
  },
};

export const GALAXY_CENTRAL_REGION = {
  displayName: '중앙영역',
  factionId: 'neutral',
  note: '아르카디아 + 기존 성계 + 미개척 권역',
} as const;

