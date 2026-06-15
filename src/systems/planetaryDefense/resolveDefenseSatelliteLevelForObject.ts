import {
  clampPlanetDefenseSatelliteLevel,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { isPlanetDefenseSatelliteInstalled } from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import { parseWorldObjectId } from '../../worldObjects/ids';
import type { WorldObject } from '../../worldObjects';
import { getPlanetDefenseSatelliteInstanceState } from './planetDefenseSatelliteInstanceRuntime';
import { resolvePlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevel';

/** 위성 1기 — 인스턴스 override → 객체 필드 → 행성 공통 레벨 (CSV 시드 미사용) */
export function resolveDefenseSatelliteLevelForObject(sat: WorldObject): number {
  const parsed = parseWorldObjectId(sat.id);
  if (parsed?.kind === 'defense_satellite') {
    if (!isPlanetDefenseSatelliteInstalled(parsed.planetId)) return 1;
    const instanceState = getPlanetDefenseSatelliteInstanceState(parsed.planetId, parsed.instanceKey);
    if (typeof instanceState?.defenseLevel === 'number' && Number.isFinite(instanceState.defenseLevel)) {
      return clampPlanetDefenseSatelliteLevel(instanceState.defenseLevel);
    }
  }
  if (typeof sat.defenseLevel === 'number' && Number.isFinite(sat.defenseLevel)) {
    return clampPlanetDefenseSatelliteLevel(sat.defenseLevel);
  }
  return resolvePlanetDefenseSatelliteLevel(sat.planetId);
}
