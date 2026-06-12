import type { PlanetWorldObjectProvider } from '../../worldObjects/providers/types';
import { buildPlanetDefenseSatelliteObjects } from './buildPlanetDefenseSatelliteObjects';

/**
 * 행성별 방위위성 — `planetId` 단위 인스턴스·상태는 빌더 + 월드오브젝트 런타임이 담당.
 * 추후 행성별 개수·CSV 인스턴스는 본 프로바이더·빌더만 확장.
 */
export const defenseSatelliteWorldObjectProvider: PlanetWorldObjectProvider = {
  id: 'planetary_defense_satellite_v1',
  kinds: ['defense_satellite'],
  list(ctx) {
    return buildPlanetDefenseSatelliteObjects(ctx.planetId, ctx.systemId);
  },
};
