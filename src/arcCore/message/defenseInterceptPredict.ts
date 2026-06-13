// ============================================================
// 방위위성 요격 — ArcCore inbound 근접(최근접) 예측·발사 시각
// 즉시 추적 사격 금지: 행성 근접 지점을 선행 계산 후 lead time 발사
// ── 미사일 요격체계 · 안정버전 2026-06-12 — predict 축 ──
// ============================================================

import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { computeCapitalProjectileTravelMs } from '../../combat/capitalProjectileSpawn';
import {
  buildArcCoreMessageMissileBezier,
  resolveArcCoreMessageClosestApproach,
  resolveArcCoreMessageMissileCanvasPadPx,
} from './arcCoreMessageMissileGeometry';
import {
  DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX,
  DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,
  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX,
  DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN,
} from './defenseInterceptConstants';

/** inbound 직후 즉시 사격 방지 — 예측 lead가 이보다 짧으면 이 지연 */
export const DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS = 600;
/** lead 계산 불가·지연 시 상한 */
export const DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS = 5200;

export type ArcCoreInboundInterceptPrediction = {
  uIntercept: number;
  interceptX: number;
  interceptY: number;
  /** inbound 시작 기준 ArcCore가 근접점 통과 시각 */
  interceptAtMs: number;
  distanceToPlanetPx: number;
};

export type DefenseInterceptLaunchSolution = {
  launchDelayMs: number;
  aimX: number;
  aimY: number;
  exitX: number;
  exitY: number;
  /** 발사→화면 밖 exit까지 */
  flightMs: number;
  /** inbound 기준 예측 교차 시각 */
  predictedInterceptAtMs: number;
};

function computeInterceptFlightMs(chordPx: number): number {
  return computeCapitalProjectileTravelMs(
    chordPx,
    DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS,
    {
      minMs: DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN,
      maxMs: DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX,
    },
  );
}

/** ArcCore 장거리 미사일 — 행성 중심 최근접(요격 기준점) */
export function resolveArcCoreInboundInterceptPrediction(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
  inboundTravelMs: number,
): ArcCoreInboundInterceptPrediction {
  const center = { x: orbitSize / 2, y: orbitSize / 2 };
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const closest = resolveArcCoreMessageClosestApproach(bezier, center);
  return {
    uIntercept: closest.u,
    interceptX: closest.point.x,
    interceptY: closest.point.y,
    interceptAtMs: Math.max(0, inboundTravelMs * closest.u),
    distanceToPlanetPx: closest.distancePx,
  };
}

function resolveMissAimOffset(
  interceptX: number,
  interceptY: number,
  launchX: number,
  launchY: number,
  slotIndex: number,
): { x: number; y: number } {
  const dx = interceptX - launchX;
  const dy = interceptY - launchY;
  const baseAngle = Math.atan2(dy, dx);
  const perp = baseAngle + Math.PI / 2;
  const sign = slotIndex % 2 === 0 ? 1 : -1;
  const offset = DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX + slotIndex * 12;
  return {
    x: interceptX + Math.cos(perp) * offset * sign,
    y: interceptY + Math.sin(perp) * offset * sign,
  };
}

/** 발사점→aim→화면 밖 exit — 요격탄은 관성 직진(베지어 p2=exit, lock) */
export function resolveDefenseInterceptExitPoint(
  launchX: number,
  launchY: number,
  aimX: number,
  aimY: number,
  orbitSize: number,
): { x: number; y: number } {
  const pad = resolveArcCoreMessageMissileCanvasPadPx(orbitSize);
  const canvasMax = orbitSize + pad * 2;
  const dx = aimX - launchX;
  const dy = aimY - launchY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const margin = canvasMax * 0.35;
  let t = margin;
  for (let i = 0; i < 8; i += 1) {
    const ex = aimX + ux * t;
    const ey = aimY + uy * t;
    const off =
      ex < -pad || ex > orbitSize + pad || ey < -pad || ey > orbitSize + pad;
    if (off) return { x: ex, y: ey };
    t *= 1.6;
  }
  return { x: aimX + ux * t, y: aimY + uy * t };
}

/**
 * 위성 1기 — lead time 발사 시각·조준·exit (단일 위성 빠른 경로).
 * 다위성·tier 스캔은 scheduleDefenseInterceptLaunch 사용.
 */
export function resolveDefenseInterceptLaunchSolution(input: {
  launchX: number;
  launchY: number;
  slotIndex: number;
  willHit: boolean;
  prediction: ArcCoreInboundInterceptPrediction;
  orbitSize: number;
  staggerMs: number;
}): DefenseInterceptLaunchSolution {
  const { launchX, launchY, slotIndex, willHit, prediction, orbitSize, staggerMs } = input;
  const aimBase = willHit
    ? { x: prediction.interceptX, y: prediction.interceptY }
    : resolveMissAimOffset(
      prediction.interceptX,
      prediction.interceptY,
      launchX,
      launchY,
      slotIndex,
    );
  const distToAim = Math.hypot(aimBase.x - launchX, aimBase.y - launchY);
  const flightToAimMs = computeInterceptFlightMs(distToAim);
  const idealLaunchDelay = prediction.interceptAtMs - flightToAimMs;
  const launchDelayMs = Math.min(
    DEFENSE_INTERCEPT_MAX_LAUNCH_DELAY_MS,
    Math.max(DEFENSE_INTERCEPT_MIN_ENGAGE_DELAY_MS, idealLaunchDelay) + slotIndex * staggerMs,
  );
  const exit = resolveDefenseInterceptExitPoint(
    launchX,
    launchY,
    aimBase.x,
    aimBase.y,
    orbitSize,
  );
  const distToExit = Math.hypot(exit.x - launchX, exit.y - launchY);
  const flightMs = computeInterceptFlightMs(distToExit);
  return {
    launchDelayMs,
    aimX: aimBase.x,
    aimY: aimBase.y,
    exitX: exit.x,
    exitY: exit.y,
    flightMs,
    predictedInterceptAtMs: prediction.interceptAtMs,
  };
}
