// ============================================================
// 방위위성 요격미사일 — plan 슬롯 → 시뮬 인스턴스 (발사 시각 재검증)
// ============================================================

import { buildDefenseInterceptMissileSlotAtFire } from './defenseInterceptEngagement';
import type { ArcCoreInboundInterceptPrediction } from './defenseInterceptPredict';
import type { DefenseInterceptGuidedMissile } from './defenseInterceptGuidedMissile';
import type { DefenseInterceptMissileSlot, DefenseInterceptVisualPlan } from './defenseInterceptTypes';
import { listPlanetDefenseSatellites } from '../../systems/planetaryDefense/planetDefenseSatelliteService';

function spawnInterceptMissileFromSlot(
  slot: DefenseInterceptMissileSlot,
  weaponId: string,
  inboundStartMs: number,
): DefenseInterceptGuidedMissile | null {
  const launchAtMs = inboundStartMs + slot.launchDelayMs;
  const dx = slot.exitX - slot.launchX;
  const dy = slot.exitY - slot.launchY;
  const dist = Math.hypot(dx, dy) || 1;
  const aimDist = Math.hypot(slot.aimX - slot.launchX, slot.aimY - slot.launchY);
  const aimPassU = Math.min(0.98, Math.max(0.05, aimDist / dist));
  return {
    id: slot.slotIndex,
    slotIndex: slot.slotIndex,
    startMs: launchAtMs,
    travelMs: slot.flightMs,
    p0: { x: slot.launchX, y: slot.launchY },
    exitX: slot.exitX,
    exitY: slot.exitY,
    aimX: slot.aimX,
    aimY: slot.aimY,
    tangentRad: Math.atan2(dy, dx),
    hitApplied: false,
    willHit: slot.willHit,
    missileWeaponId: weaponId,
    hitX: 0,
    hitY: 0,
    hitAtMs: 0,
    aimPassU,
    aimCrossedReported: false,
  };
}

export function createDefenseInterceptGuidedMissiles(
  plan: DefenseInterceptVisualPlan,
  inboundStartMs: number,
  _travelMs: number,
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
    const atFire = buildDefenseInterceptMissileSlotAtFire({
      orbitSize,
      orbitClockAtInboundMs: plan.orbitClockAtInboundMs,
      trajectoryPattern: plan.trajectoryPattern,
      prediction,
      radiusScale: sat.transform.radiusScale,
      phaseBias: sat.transform.phaseBias,
      satelliteId: slot.satelliteId,
      slotIndex: slot.slotIndex,
      launchDelayMs: slot.launchDelayMs,
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
    };
    const m = spawnInterceptMissileFromSlot(fireSlot, weaponId, inboundStartMs);
    if (m) out.push(m);
  }
  return out;
}
