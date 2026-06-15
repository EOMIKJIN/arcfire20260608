// ============================================================
// 방위위성 → 아크코어 드론 요격 (JS 시뮬 — Skia 분리)
// ============================================================

import { getArcCoreInboundDronePolicy } from '../balance/arcCoreInboundDronePolicy';
import {
  getPlanetDefenseSatelliteLevelRow,
  resolveDefenseSatelliteInterceptChancePct,
} from '../balance/planetDefenseSatelliteLevelPolicy';
import { getPlanetDefenseSatellitePolicy } from '../balance/planetDefenseSatellitePolicy';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../data/generated/csvWeapons';
import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense';
import { resolveDefenseSatelliteLevelForObject } from '../../systems/planetaryDefense/resolveDefenseSatelliteLevelForObject';
import {
  clampDefenseSatelliteRadiusScale,
  WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS,
} from '../../worldObjects/planetWorldObjectOrbit';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { resolveInboundDroneScreenXY } from './inboundDroneKinematics';

const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
const ORBIT_Y_MUL = 0.66;

export type SatelliteCooldownMap = Map<string, number>;

function resolveInterceptWeaponDamage(): number {
  const weaponId = getPlanetDefenseSatellitePolicy().defaultWeaponId;
  const weapon = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId];
  const dmg = weapon?.damage;
  return typeof dmg === 'number' && Number.isFinite(dmg) ? Math.max(1, dmg) : 8;
}

function resolveSatelliteXY(
  satelliteIndex: number,
  phaseBias: number,
  radiusScale: number,
  nowMs: number,
): { x: number; y: number } {
  const orbitRadiusPx = ORBIT_CENTER * clampDefenseSatelliteRadiusScale(radiusScale);
  const cycleMs = WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS;
  const phase = ((nowMs % cycleMs) / cycleMs + phaseBias) % 1;
  const angle = phase * Math.PI * 2;
  return {
    x: Math.cos(angle) * orbitRadiusPx,
    y: Math.sin(angle) * orbitRadiusPx * ORBIT_Y_MUL,
  };
}

/**
 * inbound 드론에 대해 방위위성 요격 1틱.
 * @param elapsedWallSec — 서브코어 누적 벽시계(쿨다운 키)
 */
export function runInboundDroneInterceptPass(
  planetId: string,
  drones: ArcInboundDrone[],
  elapsedWallSec: number,
  cooldowns: SatelliteCooldownMap,
  nowMs: number = Date.now(),
): void {
  const policy = getArcCoreInboundDronePolicy();
  const satellites = listPlanetDefenseSatellites(planetId);
  if (satellites.length === 0) return;

  const weaponDamage = resolveInterceptWeaponDamage();
  const rangeSq = policy.interceptRangePx * policy.interceptRangePx;

  for (const drone of drones) {
    if (drone.phase !== 'inbound') continue;
    const dronePos = resolveInboundDroneScreenXY(drone);
    if (!dronePos) continue;

    for (let si = 0; si < satellites.length; si += 1) {
      const sat = satellites[si]!;
      const satPos = resolveSatelliteXY(si, sat.transform.phaseBias, sat.transform.radiusScale, nowMs);
      const dx = dronePos.x - satPos.x;
      const dy = dronePos.y - satPos.y;
      if (dx * dx + dy * dy > rangeSq) continue;

      const cdKey = `${sat.id}:${drone.id}`;
      const readyAt = cooldowns.get(cdKey) ?? 0;
      if (elapsedWallSec < readyAt) continue;

      cooldowns.set(cdKey, elapsedWallSec + policy.interceptCooldownSec);

      const level = resolveDefenseSatelliteLevelForObject(sat);
      const chancePct = resolveDefenseSatelliteInterceptChancePct(level);
      if (Math.random() * 100 >= chancePct) continue;

      const salvo = getPlanetDefenseSatelliteLevelRow(level)?.interceptMissileCount ?? 1;
      drone.hp = Math.max(0, drone.hp - salvo * weaponDamage);
      if (drone.hp <= 0) {
        drone.phase = 'destroyed';
      }
      break;
    }
  }
}
