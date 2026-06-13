import {
  resolveDefenseSatelliteInstanceSeedLevel,
} from '../../arcCore/balance/planetDefenseSatelliteInstanceLevelPolicy';
import {
  clampPlanetDefenseSatelliteLevel,
  resolveDefenseSatelliteInterceptHitChancePctForRoll,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { parseWorldObjectId } from '../../worldObjects/ids';
import type { WorldObject } from '../../worldObjects';
import { getPlanetDefenseSatelliteInstanceState } from './planetDefenseSatelliteInstanceRuntime';
import { resolvePlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevel';

/** 위성 1기 — 런타임 override → 객체 필드 → CSV 시드 → 행성 공통 레벨 */
export function resolveDefenseSatelliteLevelForObject(sat: WorldObject): number {
  const parsed = parseWorldObjectId(sat.id);
  if (parsed?.kind === 'defense_satellite') {
    const instanceState = getPlanetDefenseSatelliteInstanceState(parsed.planetId, parsed.instanceKey);
    if (typeof instanceState?.defenseLevel === 'number' && Number.isFinite(instanceState.defenseLevel)) {
      return clampPlanetDefenseSatelliteLevel(instanceState.defenseLevel);
    }
    const seed = resolveDefenseSatelliteInstanceSeedLevel(parsed.instanceKey);
    if (seed != null) return seed;
  }
  if (typeof sat.defenseLevel === 'number' && Number.isFinite(sat.defenseLevel)) {
    return clampPlanetDefenseSatelliteLevel(sat.defenseLevel);
  }
  return resolvePlanetDefenseSatelliteLevel(sat.planetId);
}

/** 위성 1기 요격 확률(%) — 해당 위성 레벨 테이블 */
export function resolveDefenseSatelliteInterceptChanceForObject(sat: WorldObject): number {
  return resolveDefenseSatelliteInterceptHitChancePctForRoll(
    resolveDefenseSatelliteLevelForObject(sat),
  );
}
