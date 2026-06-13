// ============================================================

// 방위위성 요격 — 발사 시각 스케줄·기하 교전 가능(완화 단계)

// 시계각 발사 금지 없음 — lead·거리·윈도우만 검사

// ============================================================



import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';

import { resolveDefenseSatelliteOrbitXY } from '../../worldObjects/planetWorldObjectOrbit';

import {

  DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS,

  DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS,

  resolveArcCoreInboundInterceptPrediction,

  resolveDefenseInterceptExitPoint,

  type ArcCoreInboundInterceptPrediction,

} from './defenseInterceptPredict';

import {

  DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX,

  DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,

  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX,

  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN,

} from './defenseInterceptConstants';

import { computeCapitalProjectileTravelMs } from '../../combat/capitalProjectileSpawn';
import { resolveArcCoreInboundWarheadAtMs } from './arcCoreMessageMissileGeometry';

export type DefenseInterceptEngagementBlockReason =
  | 'too_close'
  | 'lead_window';

function resolveLiveWarheadAim(input: {
  inboundStartMs: number;
  inboundTravelMs: number;
  launchDelayMs: number;
  orbitSize: number;
  launchX: number;
  launchY: number;
  slotIndex: number;
  useMissOffset: boolean;
  prediction: ArcCoreInboundInterceptPrediction;
}): { x: number; y: number } {
  const fireWallMs = input.inboundStartMs + input.launchDelayMs;
  const warhead = resolveArcCoreInboundWarheadAtMs(
    fireWallMs,
    input.inboundStartMs,
    input.inboundTravelMs,
    input.orbitSize,
  );
  if (!input.useMissOffset || input.slotIndex === 0) {
    return { x: warhead.x, y: warhead.y };
  }
  const dx = warhead.x - input.launchX;
  const dy = warhead.y - input.launchY;
  const baseAngle = Math.atan2(dy, dx);
  const perp = baseAngle + Math.PI / 2;
  const sign = input.slotIndex % 2 === 0 ? 1 : -1;
  const offset = DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX + input.slotIndex * 12;
  return {
    x: warhead.x + Math.cos(perp) * offset * sign,
    y: warhead.y + Math.sin(perp) * offset * sign,
  };
}

export type DefenseInterceptEngagementTier = 'ideal' | 'relaxed' | 'fallback';



export type DefenseInterceptScheduledLaunch = {

  scheduled: boolean;

  tier: DefenseInterceptEngagementTier | 'none';

  launchDelayMs: number;

  launchX: number;

  launchY: number;

  aimX: number;

  aimY: number;

  exitX: number;

  exitY: number;

  flightMs: number;

  aimPassU: number;

  aimDistancePx: number;

  blockReason?: DefenseInterceptEngagementBlockReason;

};



const SCHEDULE_STEP_MS = 320;



function computeFlightMs(chordPx: number): number {

  return computeCapitalProjectileTravelMs(

    chordPx,

    DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,

    {

      minMs: DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN,

      maxMs: DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX,

    },

  );

}



function resolveAimPoint(

  prediction: ArcCoreInboundInterceptPrediction,

  launchX: number,

  launchY: number,

  slotIndex: number,

  useMissOffset: boolean,

): { x: number; y: number } {

  if (!useMissOffset || slotIndex === 0) {

    return { x: prediction.interceptX, y: prediction.interceptY };

  }

  const dx = prediction.interceptX - launchX;

  const dy = prediction.interceptY - launchY;

  const baseAngle = Math.atan2(dy, dx);

  const perp = baseAngle + Math.PI / 2;

  const sign = slotIndex % 2 === 0 ? 1 : -1;

  const offset = DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX + slotIndex * 12;

  return {

    x: prediction.interceptX + Math.cos(perp) * offset * sign,

    y: prediction.interceptY + Math.sin(perp) * offset * sign,

  };

}



function evaluateFireGeometry(input: {

  orbitSize: number;

  prediction: ArcCoreInboundInterceptPrediction;

  launchX: number;

  launchY: number;

  launchDelayMs: number;

  aimX: number;

  aimY: number;

  tier: DefenseInterceptEngagementTier;

}): { ok: boolean; reason?: DefenseInterceptEngagementBlockReason } {

  const { orbitSize, prediction, launchX, launchY, launchDelayMs, aimX, aimY, tier } = input;

  const aimDistancePx = Math.hypot(aimX - launchX, aimY - launchY);

  const idealLeadMs = prediction.interceptAtMs - launchDelayMs;

  const shotDx = aimX - launchX;



  const minRange =

    tier === 'ideal' ? orbitSize * 0.22

      : tier === 'relaxed' ? orbitSize * 0.17

        : orbitSize * 0.13;



  if (aimDistancePx < minRange) {

    return { ok: false, reason: 'too_close' };

  }



  if (tier === 'ideal' && idealLeadMs < -1400) {

    return { ok: false, reason: 'lead_window' };

  }

  if (tier !== 'ideal' && idealLeadMs < -2400) {

    return { ok: false, reason: 'lead_window' };

  }



  if (tier === 'ideal' && Math.abs(shotDx) < 14 && aimDistancePx < minRange * 1.2) {

    return { ok: false, reason: 'too_close' };

  }



  return { ok: true };

}



/** 실제 발사 시각·좌표 — stagger 이후 궤도 위치 재계산 */

export function buildDefenseInterceptMissileSlotAtFire(input: {

  orbitSize?: number;

  orbitClockAtInboundMs: number;

  prediction: ArcCoreInboundInterceptPrediction;

  radiusScale: number;

  phaseBias: number;

  satelliteId: string;

  slotIndex: number;

  launchDelayMs: number;

  inboundStartMs?: number;

  inboundTravelMs?: number;

  /** false면 intercept 조준, true면 miss offset 조준 */
  useMissOffset?: boolean;

}): {

  launchX: number;

  launchY: number;

  aimX: number;

  aimY: number;

  exitX: number;

  exitY: number;

  flightMs: number;

  aimPassU: number;

} | null {

  const orbitSize = input.orbitSize ?? PLANET_MAIN_ORBIT_SCENE_SIZE;

  const launch = resolveDefenseSatelliteOrbitXY(

    orbitSize,

    input.radiusScale,

    input.phaseBias,

    input.orbitClockAtInboundMs + input.launchDelayMs,

  );

  const useMissOffset = input.useMissOffset ?? input.slotIndex > 0;

  const aim = input.inboundStartMs != null && input.inboundTravelMs != null && input.inboundTravelMs > 0
    ? resolveLiveWarheadAim({
      inboundStartMs: input.inboundStartMs,
      inboundTravelMs: input.inboundTravelMs,
      launchDelayMs: input.launchDelayMs,
      orbitSize,
      launchX: launch.x,
      launchY: launch.y,
      slotIndex: input.slotIndex,
      useMissOffset,
      prediction: input.prediction,
    })
    : resolveAimPoint(
      input.prediction,
      launch.x,
      launch.y,
      input.slotIndex,
      useMissOffset,
    );

  const exit = resolveDefenseInterceptExitPoint(

    launch.x,

    launch.y,

    aim.x,

    aim.y,

    orbitSize,

  );

  const dist = Math.hypot(exit.x - launch.x, exit.y - launch.y) || 1;

  const aimDist = Math.hypot(aim.x - launch.x, aim.y - launch.y);

  if (aimDist < orbitSize * 0.13) return null;

  const aimPassU = Math.min(0.98, Math.max(0.05, aimDist / dist));

  const flightMs = computeFlightMs(dist);

  return {

    launchX: launch.x,

    launchY: launch.y,

    aimX: aim.x,

    aimY: aim.y,

    exitX: exit.x,

    exitY: exit.y,

    flightMs,

    aimPassU,

  };

}



function emptyScheduledLaunch(

  blockReason: DefenseInterceptEngagementBlockReason,

): DefenseInterceptScheduledLaunch {

  return {

    scheduled: false,

    tier: 'none',

    launchDelayMs: 0,

    launchX: 0,

    launchY: 0,

    aimX: 0,

    aimY: 0,

    exitX: 0,

    exitY: 0,

    flightMs: 0,

    aimPassU: 0,

    aimDistancePx: 0,

    blockReason,

  };

}



function buildLaunchFromDelay(input: {

  orbitSize: number;

  orbitClockAtInboundMs: number;

  radiusScale: number;

  phaseBias: number;

  launchDelayMs: number;

  slotIndex: number;

  prediction: ArcCoreInboundInterceptPrediction;

  useMissOffset: boolean;

}): DefenseInterceptScheduledLaunch {

  const launch = resolveDefenseSatelliteOrbitXY(

    input.orbitSize,

    input.radiusScale,

    input.phaseBias,

    input.orbitClockAtInboundMs + input.launchDelayMs,

  );

  const aim = resolveAimPoint(

    input.prediction,

    launch.x,

    launch.y,

    input.slotIndex,

    input.useMissOffset,

  );

  const exit = resolveDefenseInterceptExitPoint(

    launch.x,

    launch.y,

    aim.x,

    aim.y,

    input.orbitSize,

  );

  const dist = Math.hypot(exit.x - launch.x, exit.y - launch.y) || 1;

  const aimDist = Math.hypot(aim.x - launch.x, aim.y - launch.y);

  const aimPassU = Math.min(0.98, Math.max(0.05, aimDist / dist));

  const flightMs = computeFlightMs(dist);

  return {

    scheduled: true,

    tier: 'fallback',

    launchDelayMs: input.launchDelayMs,

    launchX: launch.x,

    launchY: launch.y,

    aimX: aim.x,

    aimY: aim.y,

    exitX: exit.x,

    exitY: exit.y,

    flightMs,

    aimPassU,

    aimDistancePx: aimDist,

  };

}



function candidateDelays(

  prediction: ArcCoreInboundInterceptPrediction,

  slotIndex: number,

  staggerMs: number,

): number[] {

  const distEst = Math.hypot(

    prediction.interceptX - PLANET_MAIN_ORBIT_SCENE_SIZE / 2,

    prediction.interceptY - PLANET_MAIN_ORBIT_SCENE_SIZE / 2,

  );

  const flightEst = computeFlightMs(Math.max(distEst, PLANET_MAIN_ORBIT_SCENE_SIZE * 0.25));

  const ideal = prediction.interceptAtMs - flightEst;

  const base = Math.min(

    DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS,

    Math.max(DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS, ideal) + slotIndex * staggerMs,

  );

  const offsets = [0, 280, -280, 560, -560, 840, 1120, 1400, 1680, 2000, 2400, 3000, 3600, 4200];

  const out: number[] = [];

  const seen = new Set<number>();

  for (const off of offsets) {

    const d = Math.min(

      DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS,

      Math.max(DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS, base + off),

    );

    const key = Math.round(d);

    if (!seen.has(key)) {

      seen.add(key);

      out.push(d);

    }

  }

  for (

    let d = DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS;

    d <= DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS;

    d += SCHEDULE_STEP_MS

  ) {

    const key = Math.round(d);

    if (!seen.has(key)) {

      seen.add(key);

      out.push(d);

    }

  }

  return out;

}



/** 위성 1기 — 윈도우 내 최적 발사 시각 탐색(엄격→완화→폴백) */

export function scheduleDefenseInterceptLaunch(input: {

  orbitSize?: number;

  travelMs: number;

  orbitClockAtInboundMs: number;

  radiusScale: number;

  phaseBias: number;

  slotIndex: number;

  staggerMs: number;

  /** inbound 1회 예측 공유 — 위성별 중복 계산 방지 */

  prediction?: ArcCoreInboundInterceptPrediction;

}): DefenseInterceptScheduledLaunch {

  const orbitSize = input.orbitSize ?? PLANET_MAIN_ORBIT_SCENE_SIZE;

  const prediction = input.prediction

    ?? resolveArcCoreInboundInterceptPrediction(orbitSize, input.travelMs);

  const useMissOffset = input.slotIndex > 0;

  const tiers: DefenseInterceptEngagementTier[] = ['ideal', 'relaxed', 'fallback'];

  const delays = candidateDelays(prediction, input.slotIndex, input.staggerMs);

  let lastReason: DefenseInterceptEngagementBlockReason = 'lead_window';



  for (const tier of tiers) {

    for (const launchDelayMs of delays) {

      const draft = buildLaunchFromDelay({

        orbitSize,

        orbitClockAtInboundMs: input.orbitClockAtInboundMs,

        radiusScale: input.radiusScale,

        phaseBias: input.phaseBias,

        launchDelayMs,

        slotIndex: input.slotIndex,

        prediction,

        useMissOffset,

      });

      const evalResult = evaluateFireGeometry({

        orbitSize,

        prediction,

        launchX: draft.launchX,

        launchY: draft.launchY,

        launchDelayMs,

        aimX: draft.aimX,

        aimY: draft.aimY,

        tier,

      });

      if (evalResult.ok) {

        return { ...draft, tier };

      }

      if (evalResult.reason) {

        lastReason = evalResult.reason;

      }

    }

  }



  return emptyScheduledLaunch(lastReason);

}


