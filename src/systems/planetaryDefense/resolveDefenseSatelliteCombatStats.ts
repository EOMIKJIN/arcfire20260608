import {
  getPlanetDefenseSatelliteLevelRow,
  type PlanetDefenseSatelliteLevelRow,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import type { WorldObject } from '../../worldObjects';
import { resolveDefenseSatelliteLevelForObject } from './resolveDefenseSatelliteLevelForObject';

export type DefenseSatelliteCombatStats = Pick<
  PlanetDefenseSatelliteLevelRow,
  'defenseZoneDiameterPx' | 'interceptDwellSec' | 'interceptHitPct' | 'hpMax'
>;

const FALLBACK: DefenseSatelliteCombatStats = {
  defenseZoneDiameterPx: 120,
  interceptDwellSec: 3,
  interceptHitPct: 55,
  hpMax: 100,
};

export function resolveDefenseSatelliteCombatStatsForLevel(level: number): DefenseSatelliteCombatStats {
  const row = getPlanetDefenseSatelliteLevelRow(level);
  if (!row) return FALLBACK;
  return {
    defenseZoneDiameterPx: row.defenseZoneDiameterPx,
    interceptDwellSec: row.interceptDwellSec,
    interceptHitPct: row.interceptHitPct,
    hpMax: row.hpMax,
  };
}

export function resolveDefenseSatelliteCombatStatsForObject(
  sat: WorldObject,
): DefenseSatelliteCombatStats {
  return resolveDefenseSatelliteCombatStatsForLevel(resolveDefenseSatelliteLevelForObject(sat));
}

export function resolveDefenseSatelliteZoneRadiusPxForObject(sat: WorldObject): number {
  return resolveDefenseSatelliteCombatStatsForObject(sat).defenseZoneDiameterPx / 2;
}
