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
import { useArcNpcTrafficStore, type ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { useArcCoreSpyExpelledStore } from '../../store/arcCoreSpyExpelledStore';
import {
  resolveArcCoreSpyTacticalBundleAtPlanet,
  type ArcCoreSpyTacticalBundle,
} from '../spy/resolveArcCoreSpyTacticalBundleAtPlanet';
import { getCaptainPresenceWorldIndex } from '../captainPresence/buildCaptainPresenceWorldIndex';
import { resolvePlanetCounterIntelBonuses } from '../../game/resolvePlanetCounterIntelBonuses';
import { resolveInboundDroneScreenXY } from './inboundDroneKinematics';
import { leakFractionFromInterceptHitPct } from './resolveInboundDroneStrikeLeak';
import type { WorldObject } from '../../worldObjects';

const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;

/**
 * 스파이 번들 — inbound 동안 매 프레임 재계산하던 것을 입력이 바뀔 때만 다시 만든다(결과 동일).
 * 입력: 행성 · 함선 스냅샷 참조 · 함장 위치 인덱스 참조(epoch·날짜·총사령관·개방 집합 반영) · 색출 store 상태 참조.
 * 정책·스파이 태그·함장 배정은 정적 캐시라 키에서 뺀다.
 */
let spyBundleMemo: {
  planetId: string;
  ships: readonly ArcNpcTrafficShip[];
  index: object;
  expelled: object;
  bundle: ArcCoreSpyTacticalBundle;
} | null = null;

function resolveSpyBundleMemoized(planetId: string): ArcCoreSpyTacticalBundle {
  const ships = useArcNpcTrafficStore.getState().ships;
  const index = getCaptainPresenceWorldIndex(ships);
  const expelled = useArcCoreSpyExpelledStore.getState();
  const m = spyBundleMemo;
  if (m && m.planetId === planetId && m.ships === ships && m.index === index && m.expelled === expelled) {
    return m.bundle;
  }
  const bundle = resolveArcCoreSpyTacticalBundleAtPlanet(planetId, ships);
  spyBundleMemo = { planetId, ships, index, expelled, bundle };
  return bundle;
}

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

function syncDroneEndOrbitSnapshot(drone: ArcInboundDrone, orbitClockMs: number): void {
  drone.inboundEndOrbitMs = orbitClockMs;
  const start = drone.inboundStartOrbitMs;
  if (typeof start === 'number' && Number.isFinite(start)) {
    drone.inboundElapsedSec = Math.min(
      drone.inboundDurationSec,
      Math.max(0, (orbitClockMs - start) * 0.001),
    );
  }
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
  let hasInbound = false;
  for (let i = 0; i < drones.length; i += 1) {
    if (drones[i]!.phase === 'inbound') {
      hasInbound = true;
      break;
    }
  }
  if (!hasInbound) return;
  const satellites = listPlanetDefenseSatellites(planetId);
  if (satellites.length === 0) return;

  const counterIntel = resolvePlanetCounterIntelBonuses(planetId);
  const spyBundle = resolveSpyBundleMemoized(planetId);
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
      syncDroneEndOrbitSnapshot(drone, orbitClockMs);
    }
    drone.defenseZoneDwellSec = 0;
  }
}
