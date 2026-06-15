// ============================================================
// 방위위성 방어구 — 드론이 구역(지름) 안에 interceptDwellSec 체류 시 파괴
// ============================================================

import { getArcCoreInboundDronePolicy } from '../balance/arcCoreInboundDronePolicy';
import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import {
  resolveDefenseSatelliteOrbitXY,
} from '../../worldObjects/planetWorldObjectOrbit';
import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { resolveInboundDroneScreenXY } from './inboundDroneKinematics';

const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;

function resolveDroneSceneXY(drone: ArcInboundDrone): { x: number; y: number } | null {
  const rel = resolveInboundDroneScreenXY(drone);
  if (!rel) return null;
  return { x: ORBIT_CENTER + rel.x, y: ORBIT_CENTER + rel.y };
}

function isDroneInDefenseZone(
  droneScene: { x: number; y: number },
  zoneRadiusPx: number,
  satellites: ReturnType<typeof listPlanetDefenseSatellites>,
  orbitClockMs: number,
): boolean {
  const rangeSq = zoneRadiusPx * zoneRadiusPx;
  for (const sat of satellites) {
    const satPos = resolveDefenseSatelliteOrbitXY(
      PLANET_MAIN_ORBIT_SCENE_SIZE,
      sat.transform.radiusScale,
      sat.transform.phaseBias,
      orbitClockMs,
    );
    const dx = droneScene.x - satPos.x;
    const dy = droneScene.y - satPos.y;
    if (dx * dx + dy * dy <= rangeSq) return true;
  }
  return false;
}

/**
 * inbound 드론 — 방어위성 방어구 체류 누적 후 파괴.
 */
export function runInboundDroneInterceptPass(
  planetId: string,
  drones: ArcInboundDrone[],
  wallDeltaSec: number,
): void {
  if (wallDeltaSec <= 0) return;
  const policy = getArcCoreInboundDronePolicy();
  const satellites = listPlanetDefenseSatellites(planetId);
  if (satellites.length === 0) return;

  const zoneRadiusPx = policy.defenseZoneDiameterPx / 2;
  const orbitClockMs = readPlanetOrbitClockMs();

  for (const drone of drones) {
    if (drone.phase !== 'inbound') continue;
    const droneScene = resolveDroneSceneXY(drone);
    if (!droneScene) continue;

    const inZone = isDroneInDefenseZone(droneScene, zoneRadiusPx, satellites, orbitClockMs);
    if (inZone) {
      drone.defenseZoneDwellSec = (drone.defenseZoneDwellSec ?? 0) + wallDeltaSec;
      if (drone.defenseZoneDwellSec >= policy.interceptDwellSec) {
        drone.phase = 'destroyed';
        drone.defenseZoneDwellSec = 0;
      }
    } else {
      drone.defenseZoneDwellSec = 0;
    }
  }
}
