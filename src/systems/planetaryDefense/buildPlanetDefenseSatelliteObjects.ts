import {
  getPlanetDefenseSatellitePolicy,
  resolveDefenseSatellitePhaseBias,
  resolveDefenseSatelliteRadiusScale,
} from '../../arcCore/balance/planetDefenseSatellitePolicy';
import { resolveDefenseSatelliteInterceptChancePct } from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { resolveDefenseSatelliteInstanceSeedLevel } from '../../arcCore/balance/planetDefenseSatelliteInstanceLevelPolicy';
import { withWorldObjectInstanceRuntimeAll } from '../../worldObjects/applyInstanceRuntime';
import { makeWorldObjectId } from '../../worldObjects/ids';
import type { WorldObject } from '../../worldObjects';
import { resolvePlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevel';
import { resolveDefenseSatelliteLevelForObject } from './resolveDefenseSatelliteLevelForObject';

/** 행성 방위위성 월드오브젝트 — 프로바이더·`listPlanetWorldObjects` 공통 빌더 */
export function buildPlanetDefenseSatelliteObjects(
  planetId: string,
  systemId: string,
): WorldObject[] {
  const defensePolicy = getPlanetDefenseSatellitePolicy();
  const planetFallbackLevel = resolvePlanetDefenseSatelliteLevel(planetId);
  const objects: WorldObject[] = Array.from({ length: defensePolicy.minPerPlanet }, (_, i) => {
    const instanceKey = String(i + 1);
    const seedLevel = resolveDefenseSatelliteInstanceSeedLevel(instanceKey) ?? planetFallbackLevel;
    return {
      id: makeWorldObjectId(planetId, 'defense_satellite', instanceKey),
      kind: 'defense_satellite' as const,
      planetId,
      systemId,
      defenseWeaponId: defensePolicy.defaultWeaponId,
      defenseLevel: seedLevel,
      title: `방위위성 ${i + 1}`,
      description: '',
      transform: {
        orbitSlotIndex: 900 + i,
        radiusScale: resolveDefenseSatelliteRadiusScale(i),
        phaseBias: resolveDefenseSatellitePhaseBias(planetId, i),
      },
      interactions: [
        { kind: 'scan', enabled: true },
        { kind: 'none', enabled: false, reasonIfDisabled: '업그레이드 UI는 추후 구현' },
      ],
      state: {
        depleted: false,
        hp: 100,
        cooldownUntilMs: null,
      },
      tags: ['world_object', 'defense_satellite', 'planetary_defense'],
    };
  });
  return withWorldObjectInstanceRuntimeAll(objects).map((sat) => {
    const level = resolveDefenseSatelliteLevelForObject(sat);
    const interceptPct = resolveDefenseSatelliteInterceptChancePct(level);
    return {
      ...sat,
      defenseLevel: level,
      description: `Lv.${level} · 요격확률 ${interceptPct}% · 시험운용`,
    };
  });
}
