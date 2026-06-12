// ============================================================
// 방위위성 요격미사일 — Skia 연출 타이밍·좌표 계획 (메시지/판정과 분리된 시각층)
// 예측 lead 사격 → 직진(화면 밖 exit) · 판정 롤은 교차 시점(1안)
// ============================================================

import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS } from './arcCoreMessagePolicy';
import type {
  DefenseInterceptMissileSlot,
  DefenseInterceptVisualPlan,
} from './defenseInterceptTypes';
import {
  resolveArcCoreInboundInterceptPrediction,
} from './defenseInterceptPredict';
import {
  buildArcCoreMessageMissileBezier,
  quadBezierPoint,
  resolveArcCoreMessageClosestApproach,
  resolveArcCoreMessageMissileCanvasPadPx,
} from './arcCoreMessageMissileGeometry';
import {
  resolveDefenseSatelliteInterceptMissileCount,
} from '../balance/planetDefenseSatelliteLevelPolicy';
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

function estimateDefenseInterceptHitRelativeMs(
  plan: DefenseInterceptVisualPlan,
): number {
  const primary = plan.missiles[0];
  if (!primary) return plan.interceptAtMs;
  return primary.launchDelayMs + primary.flightMs * primary.aimPassU;
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
  const center = { x: orbitSize / 2, y: orbitSize / 2 };
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const closest = resolveArcCoreMessageClosestApproach(bezier, center);
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

  const maxMissiles = resolveDefenseSatelliteInterceptMissileCount(input.roll.defenseLevel);
  const satellites = listPlanetDefenseSatellites(input.planetId)
    .filter((o) => !o.state.depleted && o.state.hp !== 0);

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
      trajectoryPattern,
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
      trajectoryPattern,
      prediction,
      radiusScale: sat.transform.radiusScale,
      phaseBias: sat.transform.phaseBias,
      satelliteId: sat.id,
      slotIndex: missiles.length,
      launchDelayMs,
    });
    if (!atFire) continue;
    const predictedInterceptAtMs = launchDelayMs + atFire.flightMs * atFire.aimPassU;
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
      willHit: false,
    });
  }

  const draft: DefenseInterceptVisualPlan = {
    strikeId: input.strikeId,
    planetId: input.planetId,
    defenseLevel: input.roll.defenseLevel,
    interceptChancePct: input.roll.interceptChancePct,
    interceptSucceeded: false,
    trajectoryPattern,
    weaponId,
    orbitClockAtInboundMs,
    canvasPad,
    interceptX: closest.point.x,
    interceptY: closest.point.y,
    interceptAtMs: prediction.interceptAtMs,
    missiles,
    hasActiveSatellites: true,
    engagementEligible: missiles.length > 0,
  };
  draft.interceptAtMs = estimateDefenseInterceptHitRelativeMs(draft);
  return draft;
}

export function toDefenseInterceptCanvasPoint(
  x: number,
  y: number,
  canvasPad: number,
): { x: number; y: number } {
  return { x: x + canvasPad, y: y + canvasPad };
}

export function resolveInboundMissileUAtMs(
  inboundStartMs: number,
  travelMs: number,
  atMs: number,
  orbitSize?: number,
): number {
  const orbit = orbitSize ?? PLANET_MAIN_ORBIT_SCENE_SIZE;
  const bezier = buildArcCoreMessageMissileBezier(orbit);
  const center = { x: orbit / 2, y: orbit / 2 };
  const closest = resolveArcCoreMessageClosestApproach(bezier, center);
  const tSince = Math.max(0, atMs - inboundStartMs);
  const prog = Math.min(1, tSince / Math.max(1, travelMs));
  return closest.u * prog + (1 - prog) * 0.05;
}

export function resolveInboundMissilePointAtU(
  u: number,
  orbitSize?: number,
): { x: number; y: number } {
  const orbit = orbitSize ?? PLANET_MAIN_ORBIT_SCENE_SIZE;
  const bezier = buildArcCoreMessageMissileBezier(orbit);
  return quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
}
