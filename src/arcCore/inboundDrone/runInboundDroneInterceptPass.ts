// ============================================================
// 방위위성 방어구 — 위성 레벨별 구역·체류·명중률 (planet_defense_satellite_level_policy.csv)
// ============================================================

import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense';
import {
  resolveDefenseSatelliteCombatStatsForObject,
} from '../../systems/planetaryDefense/resolveDefenseSatelliteCombatStats';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import {
  resolveDefenseSatelliteOrbitXY,
} from '../../worldObjects/planetWorldObjectOrbit';
import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import { resolveArcCoreSpyTacticalBundleAtPlanet } from '../spy/resolveArcCoreSpyTacticalBundleAtPlanet';
import { resolvePlanetCounterIntelBonuses } from '../../game/resolvePlanetCounterIntelBonuses';
import { resolveInboundDroneScreenXY } from './inboundDroneKinematics';
import { leakFractionFromInterceptHitPct } from './resolveInboundDroneStrikeLeak';
import type { WorldObject } from '../../worldObjects';

const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;

function resolveDroneSceneXY(
  drone: ArcInboundDrone,
  orbitClockMs: number,
): { x: number; y: number } | null {
  const rel = resolveInboundDroneScreenXY(drone, orbitClockMs);
  if (!rel) return null;
  return { x: ORBIT_CENTER + rel.x, y: ORBIT_CENTER + rel.y };
}

type ActiveInterceptZone = {
  requiredDwellSec: number;
  hitPct: number;
};

/** 겹치는 구역 중 체류 요구가 가장 짧은(=가장 강한) 위성 기준 */
function resolveStrongestInterceptZone(
  droneScene: { x: number; y: number },
  satellites: WorldObject[],
  orbitClockMs: number,
): ActiveInterceptZone | null {
  let best: ActiveInterceptZone | null = null;
  for (const sat of satellites) {
    const stats = resolveDefenseSatelliteCombatStatsForObject(sat);
    const zoneRadiusPx = stats.defenseZoneDiameterPx / 2;
    const satPos = resolveDefenseSatelliteOrbitXY(
      PLANET_MAIN_ORBIT_SCENE_SIZE,
      sat.transform.radiusScale,
      sat.transform.phaseBias,
      orbitClockMs,
    );
    const dx = droneScene.x - satPos.x;
    const dy = droneScene.y - satPos.y;
    if (dx * dx + dy * dy > zoneRadiusPx * zoneRadiusPx) continue;
    const candidate: ActiveInterceptZone = {
      requiredDwellSec: stats.interceptDwellSec,
      hitPct: stats.interceptHitPct,
    };
    if (
      !best
      || candidate.requiredDwellSec < best.requiredDwellSec
      || (
        candidate.requiredDwellSec === best.requiredDwellSec
        && candidate.hitPct > best.hitPct
      )
    ) {
      best = candidate;
    }
  }
  return best;
}

/**
 * inbound 드론 — 레벨별 방어구 체류 누적 → 명중 판정 후 파괴.
 */
export function runInboundDroneInterceptPass(
  planetId: string,
  drones: ArcInboundDrone[],
  wallDeltaSec: number,
): void {
  if (wallDeltaSec <= 0) return;
  const satellites = listPlanetDefenseSatellites(planetId);
  if (satellites.length === 0) return;

  const counterIntel = resolvePlanetCounterIntelBonuses(planetId);
  const spyBundle = resolveArcCoreSpyTacticalBundleAtPlanet(
    planetId,
    useArcNpcTrafficStore.getState().ships,
  );
  const orbitClockMs = readPlanetOrbitClockMs();

  for (const drone of drones) {
    if (drone.phase !== 'inbound') continue;
    const droneScene = resolveDroneSceneXY(drone, orbitClockMs);
    if (!droneScene) continue;

    const zone = resolveStrongestInterceptZone(droneScene, satellites, orbitClockMs);
    if (!zone) {
      drone.defenseZoneDwellSec = 0;
      continue;
    }

    const effectiveHitPct = Math.max(
      5,
      Math.min(
        99,
        zone.hitPct
          + counterIntel.droneInterceptBonusPct
          - spyBundle.droneGuidanceAccuracyPenaltyPct,
      ),
    );

    const leak = leakFractionFromInterceptHitPct(effectiveHitPct);
    drone.strikeLeakMul = Math.min(drone.strikeLeakMul ?? 1, leak);

    drone.defenseZoneDwellSec = (drone.defenseZoneDwellSec ?? 0) + wallDeltaSec;
    if (drone.defenseZoneDwellSec < zone.requiredDwellSec) continue;

    const roll = Math.random() * 100;
    if (roll < effectiveHitPct) {
      drone.phase = 'destroyed';
    }
    drone.defenseZoneDwellSec = 0;
  }
}
