import {
  getPlanetDefenseSatellitePolicy,
  resolveDefenseSatellitePhaseBias,
  resolveDefenseSatelliteRadiusScale,
} from '../../arcCore/balance/planetDefenseSatellitePolicy';
import {
  getPlanetDefenseSatelliteLevelRow,
  resolveDefenseSatelliteActiveCountForLevel,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { withWorldObjectInstanceRuntimeAll } from '../../worldObjects/applyInstanceRuntime';
import { makeWorldObjectId } from '../../worldObjects/ids';
import type { WorldObject } from '../../worldObjects';
import { isPlanetDefenseSatelliteInstalled } from './planetDefenseSatelliteLevel';
import { resolvePlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevel';
import { resolveDefenseSatelliteLevelForObject } from './resolveDefenseSatelliteLevelForObject';

/** 행성 방위위성 월드오브젝트 — 설치·레벨에 따라 0/1/2기 */
export function buildPlanetDefenseSatelliteObjects(
  planetId: string,
  systemId: string,
): WorldObject[] {
  if (!isPlanetDefenseSatelliteInstalled(planetId)) return [];

  const defensePolicy = getPlanetDefenseSatellitePolicy();
  const planetLevel = resolvePlanetDefenseSatelliteLevel(planetId);
  const satelliteCount = Math.min(
    resolveDefenseSatelliteActiveCountForLevel(planetLevel),
    defensePolicy.maxPerPlanet,
  );
  if (satelliteCount <= 0) return [];

  const levelRow = getPlanetDefenseSatelliteLevelRow(planetLevel);
  const hpMax = levelRow?.hpMax ?? 100;

  const objects: WorldObject[] = Array.from({ length: satelliteCount }, (_, i) => {
    const instanceKey = String(i + 1);
    return {
      id: makeWorldObjectId(planetId, 'defense_satellite', instanceKey),
      kind: 'defense_satellite' as const,
      planetId,
      systemId,
      defenseWeaponId: defensePolicy.defaultWeaponId,
      defenseLevel: planetLevel,
      title: `방위위성 ${i + 1}`,
      description: '',
      transform: {
        orbitSlotIndex: 900 + i,
        radiusScale: resolveDefenseSatelliteRadiusScale(i),
        phaseBias: resolveDefenseSatellitePhaseBias(planetId, i),
      },
      interactions: [
        { kind: 'scan', enabled: true },
        { kind: 'none', enabled: false, reasonIfDisabled: '행성개발 메뉴에서 관리' },
      ],
      state: {
        depleted: false,
        hp: hpMax,
        cooldownUntilMs: null,
      },
      tags: ['world_object', 'defense_satellite', 'planetary_defense'],
    };
  });
  return withWorldObjectInstanceRuntimeAll(objects).map((sat) => {
    const level = resolveDefenseSatelliteLevelForObject(sat);
    return {
      ...sat,
      defenseLevel: level,
      description: `Lv.${level}`,
    };
  });
}
