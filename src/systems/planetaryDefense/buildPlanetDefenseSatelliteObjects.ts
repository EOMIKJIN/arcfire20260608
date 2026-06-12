import {
  getPlanetDefenseSatellitePolicy,
  resolveDefenseSatellitePhaseBias,
  resolveDefenseSatelliteRadiusScale,
} from '../../arcCore/balance/planetDefenseSatellitePolicy';
import { resolveDefenseSatelliteInterceptChancePct } from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { withWorldObjectInstanceRuntimeAll } from '../../worldObjects/applyInstanceRuntime';
import { makeWorldObjectId } from '../../worldObjects/ids';
import type { WorldObject } from '../../worldObjects';
import { resolvePlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevel';

/** 행성 방위위성 월드오브젝트 — 프로바이더·`listPlanetWorldObjects` 공통 빌더 */
export function buildPlanetDefenseSatelliteObjects(
  planetId: string,
  systemId: string,
): WorldObject[] {
  const defensePolicy = getPlanetDefenseSatellitePolicy();
  const defenseLevel = resolvePlanetDefenseSatelliteLevel(planetId);
  const interceptPct = resolveDefenseSatelliteInterceptChancePct(defenseLevel);
  const objects: WorldObject[] = Array.from({ length: defensePolicy.minPerPlanet }, (_, i) => ({
    id: makeWorldObjectId(planetId, 'defense_satellite', String(i + 1)),
    kind: 'defense_satellite' as const,
    planetId,
    systemId,
    defenseWeaponId: defensePolicy.defaultWeaponId,
    defenseLevel,
    title: `방위위성 ${i + 1}`,
    description: `Lv.${defenseLevel} · 요격확률 ${interceptPct}% · 시험운용`,
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
  }));
  return withWorldObjectInstanceRuntimeAll(objects);
}
