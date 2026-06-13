// ============================================================

// 방위위성 요격미사일 — plan 슬롯 → guided sim (발사 시각·0.09 px/ms)

// trackInbound: 명중 롤 성공 후에만 inbound pursuit — 빗나감은 발사 직선 유지

// ============================================================



import { buildDefenseInterceptMissileSlotAtFire } from './defenseInterceptEngagement';
import { rollDefenseSatelliteInterceptSuccessForSlot } from '../balance/planetDefenseSatelliteLevelPolicy';

import type { DefenseInterceptGuidedMissile } from './defenseInterceptTypes';

import type { ArcCoreInboundInterceptPrediction } from './defenseInterceptPredict';

import type { DefenseInterceptMissileSlot, DefenseInterceptVisualPlan } from './defenseInterceptTypes';

import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense/planetDefenseSatelliteService';



function spawnInterceptMissileFromSlot(
  slot: DefenseInterceptMissileSlot,
  weaponId: string,
  inboundStartMs: number,
  willHit: boolean,
): DefenseInterceptGuidedMissile | null {

  const launchAtMs = inboundStartMs + slot.launchDelayMs;

  const dx = slot.exitX - slot.launchX;

  const dy = slot.exitY - slot.launchY;

  const dist = Math.hypot(dx, dy) || 1;
  const launchSpeedPxPerMs = dist / Math.max(1, slot.flightMs);

  const p0 = { x: slot.launchX, y: slot.launchY };

  const aimDist = Math.hypot(slot.aimX - slot.launchX, slot.aimY - slot.launchY);
  const aimPassU = Math.min(0.98, Math.max(0.05, aimDist / dist));

  return {

    id: slot.slotIndex,

    slotIndex: slot.slotIndex,

    satelliteId: slot.satelliteId,

    startMs: launchAtMs,

    travelMs: slot.flightMs,

    p0,

    bezier: null,

    exitX: slot.exitX,

    exitY: slot.exitY,

    aimX: slot.aimX,

    aimY: slot.aimY,

    tangentRad: Math.atan2(dy, dx),

    hitApplied: false,

    willHit,

    trackInbound: willHit,

    missileWeaponId: weaponId,

    hitX: 0,

    hitY: 0,

    hitAtMs: 0,

    passThroughAtMs: 0,

    impactAtMs: 0,

    aimPassU,

    aimCrossedReported: false,

    coastFromMs: 0,

    coastX: 0,

    coastY: 0,

    coastTangentRad: Math.atan2(dy, dx),

    proximityRollAttempted: false,

    pursuitIntegratedToMs: 0,

    pursuitHx: 0,

    pursuitHy: 0,

    launchSpeedPxPerMs,

    pursuitLastTan: Math.atan2(dy, dx),

    trailHistory: [],

  };

}



export function createDefenseInterceptGuidedMissiles(

  plan: DefenseInterceptVisualPlan,

  inboundStartMs: number,

  travelMs: number,

  orbitSize: number,

): DefenseInterceptGuidedMissile[] {

  const weaponId = plan.weaponId ?? 'w_intercept_missile_01';

  const satById = new Map(

    listPlanetDefenseSatellites(plan.planetId).map((s) => [s.id, s] as const),

  );

  const prediction: ArcCoreInboundInterceptPrediction = {

    interceptX: plan.interceptX,

    interceptY: plan.interceptY,

    interceptAtMs: plan.interceptAtMs,

    uIntercept: 0,

    distanceToPlanetPx: 0,

  };

  const out: DefenseInterceptGuidedMissile[] = [];

  for (const slot of plan.missiles) {

    const sat = satById.get(slot.satelliteId);

    if (!sat) continue;

    const interceptChancePct = slot.interceptChancePct;
    const willHit = rollDefenseSatelliteInterceptSuccessForSlot(
      plan.strikeId,
      plan.planetId,
      slot.satelliteId,
      slot.slotIndex,
      interceptChancePct,
    );

    const atFire = buildDefenseInterceptMissileSlotAtFire({

      orbitSize,

      orbitClockAtInboundMs: plan.orbitClockAtInboundMs,

      prediction,

      radiusScale: sat.transform.radiusScale,

      phaseBias: sat.transform.phaseBias,

      satelliteId: slot.satelliteId,

      slotIndex: slot.slotIndex,

      launchDelayMs: slot.launchDelayMs,

      inboundStartMs,

      inboundTravelMs: travelMs,

      useMissOffset: !willHit,

    });

    if (!atFire) continue;

    const fireSlot: DefenseInterceptMissileSlot = {

      ...slot,

      launchX: atFire.launchX,

      launchY: atFire.launchY,

      aimX: atFire.aimX,

      aimY: atFire.aimY,

      exitX: atFire.exitX,

      exitY: atFire.exitY,

      flightMs: atFire.flightMs,

      aimPassU: atFire.aimPassU,

      willHit,

      rollAttempted: true,

    };

    const m = spawnInterceptMissileFromSlot(fireSlot, weaponId, inboundStartMs, willHit);

    if (m) out.push(m);

  }

  return out;

}



export type { DefenseInterceptGuidedMissile } from './defenseInterceptTypes';

