// ============================================================

// 방위위성 요격미사일 — Skia 연출 타이밍·좌표 계획 (메시지/판정과 분리된 시각층)

// inbound bezier 예측 lead + 발사 시 live warhead pure pursuit

// ── 미사일 요격체계 · 2026-06-12 — visualPlan 축 ──

// ============================================================



import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';

import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';

import { ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS } from './arcCoreMessagePolicy';

import type {

  DefenseInterceptMissileSlot,

  DefenseInterceptVisualPlan,

} from './defenseInterceptTypes';

import { resolveArcCoreInboundInterceptPrediction } from './defenseInterceptPredict';

import { resolveArcCoreMessageMissileCanvasPadPx } from './arcCoreMessageMissileGeometry';

import { resolveDefenseSatelliteInterceptMissileCount } from '../balance/planetDefenseSatelliteLevelPolicy';
import { resolveDefenseSatelliteInterceptChanceForObject, resolveDefenseSatelliteLevelForObject } from '../../systems/planetaryDefense/resolveDefenseSatelliteLevelForObject';

import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense/planetDefenseSatelliteService';

import type { PlanetDefenseInterceptRollResult } from '../../systems/planetaryDefense/planetDefenseSatelliteService';

import {

  resolveArcCoreInboundTrajectoryPattern,

  type ArcCoreInboundTrajectoryPattern,

} from './arcCoreInboundTrajectoryPattern';

import {

  buildDefenseInterceptMissileSlotAtFire,

  scheduleDefenseInterceptLaunch,

} from './defenseInterceptEngagement';



export const DEFENSE_INTERCEPT_LAUNCH_WINDOW_MS = 5200;

export const DEFENSE_INTERCEPT_EXPLOSION_MS = 550;



export type { DefenseInterceptMissileSlot, DefenseInterceptVisualPlan } from './defenseInterceptTypes';



/** 활성 위성 수·레벨 정책 — 위성 2기 이상이면 각 1발(최소 2발) */

function resolveInterceptMissileBudget(

  defenseLevel: number,

  activeSatelliteCount: number,

): number {

  const policyMax = resolveDefenseSatelliteInterceptMissileCount(defenseLevel);

  if (activeSatelliteCount >= 2) {

    return Math.min(activeSatelliteCount, Math.max(policyMax, 2));

  }

  return Math.min(activeSatelliteCount, Math.max(1, policyMax));

}



export function buildDefenseInterceptVisualPlan(input: {

  planetId: string;

  strikeId: string;

  roll: PlanetDefenseInterceptRollResult;

  inboundStartMs: number;

  travelMs?: number;

  orbitSize?: number;

  trajectoryPattern?: ArcCoreInboundTrajectoryPattern | null;

}): DefenseInterceptVisualPlan | null {

  const orbitSize = input.orbitSize ?? PLANET_MAIN_ORBIT_SCENE_SIZE;

  const travelMs = input.travelMs ?? ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS;

  const trajectoryPattern = resolveArcCoreInboundTrajectoryPattern({

    orbitSize,

    explicitPattern: input.trajectoryPattern,

  });

  const canvasPad = resolveArcCoreMessageMissileCanvasPadPx(orbitSize);

  const prediction = resolveArcCoreInboundInterceptPrediction(orbitSize, travelMs);

  const weaponId = input.roll.weaponId ?? 'w_intercept_missile_01';

  const orbitClockAtInboundMs = readPlanetOrbitClockMs();



  if (!input.roll.hasActiveSatellites) {

    return {

      strikeId: input.strikeId,

      planetId: input.planetId,

      defenseLevel: input.roll.defenseLevel,

      interceptChancePct: input.roll.interceptChancePct,

      interceptSucceeded: false,

      trajectoryPattern,

      weaponId,

      orbitClockAtInboundMs,

      canvasPad,

      interceptX: prediction.interceptX,

      interceptY: prediction.interceptY,

      interceptAtMs: prediction.interceptAtMs,

      missiles: [],

      hasActiveSatellites: false,

      engagementEligible: false,

    };

  }



  const satellites = listPlanetDefenseSatellites(input.planetId)

    .filter((o) => !o.state.depleted && o.state.hp !== 0);

  const maxMissiles = resolveInterceptMissileBudget(
    Math.max(
      1,
      ...satellites.map((sat) => resolveDefenseSatelliteLevelForObject(sat)),
    ),
    satellites.length,
  );



  const tierRank = { ideal: 0, relaxed: 1, fallback: 2, none: 3 } as const;

  type ScheduleCandidate = {

    sat: (typeof satellites)[number];

    scheduled: ReturnType<typeof scheduleDefenseInterceptLaunch>;

  };

  const scheduleCandidates: ScheduleCandidate[] = [];

  for (let i = 0; i < satellites.length; i += 1) {

    const sat = satellites[i]!;

    const scheduled = scheduleDefenseInterceptLaunch({

      orbitSize,

      travelMs,

      orbitClockAtInboundMs,

      radiusScale: sat.transform.radiusScale,

      phaseBias: sat.transform.phaseBias,

      slotIndex: i,

      staggerMs: 0,

      prediction,

    });

    if (scheduled.scheduled) {

      scheduleCandidates.push({ sat, scheduled });

    }

  }

  scheduleCandidates.sort((a, b) => {

    const tierA = tierRank[a.scheduled.tier];

    const tierB = tierRank[b.scheduled.tier];

    if (tierA !== tierB) return tierA - tierB;

    return a.scheduled.launchDelayMs - b.scheduled.launchDelayMs;

  });



  const staggerMs = maxMissiles <= 1

    ? 0

    : Math.min(

      380,

      Math.floor(DEFENSE_INTERCEPT_LAUNCH_WINDOW_MS / Math.max(1, maxMissiles)),

    );



  const missiles: DefenseInterceptMissileSlot[] = [];

  for (const candidate of scheduleCandidates) {

    if (missiles.length >= maxMissiles) break;

    const { sat, scheduled } = candidate;

    const launchDelayMs = scheduled.launchDelayMs + missiles.length * staggerMs;

    const atFire = buildDefenseInterceptMissileSlotAtFire({

      orbitSize,

      orbitClockAtInboundMs,

      prediction,

      radiusScale: sat.transform.radiusScale,

      phaseBias: sat.transform.phaseBias,

      satelliteId: sat.id,

      slotIndex: missiles.length,

      launchDelayMs,

      inboundStartMs: input.inboundStartMs,

      inboundTravelMs: travelMs,

    });

    if (!atFire) continue;

    const predictedInterceptAtMs = launchDelayMs + atFire.flightMs * atFire.aimPassU;

    const satLevel = resolveDefenseSatelliteLevelForObject(sat);
    const satInterceptPct = resolveDefenseSatelliteInterceptChanceForObject(sat);

    missiles.push({

      slotIndex: missiles.length,

      satelliteId: sat.id,

      launchX: atFire.launchX,

      launchY: atFire.launchY,

      launchDelayMs,

      aimX: atFire.aimX,

      aimY: atFire.aimY,

      exitX: atFire.exitX,

      exitY: atFire.exitY,

      flightMs: atFire.flightMs,

      aimPassU: atFire.aimPassU,

      predictedInterceptAtMs,

      defenseLevel: satLevel,

      interceptChancePct: satInterceptPct,

      willHit: false,

      rollAttempted: false,

    });

  }



  return {

    strikeId: input.strikeId,

    planetId: input.planetId,

    defenseLevel: input.roll.defenseLevel,

    interceptChancePct: input.roll.interceptChancePct,

    interceptSucceeded: false,

    trajectoryPattern,

    weaponId,

    orbitClockAtInboundMs,

    canvasPad,

    interceptX: prediction.interceptX,

    interceptY: prediction.interceptY,

    interceptAtMs: prediction.interceptAtMs,

    missiles,

    hasActiveSatellites: true,

    engagementEligible: missiles.length > 0,

  };

}

