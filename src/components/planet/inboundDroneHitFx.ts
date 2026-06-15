// ============================================================
// 아크코어 드론 — 행성 외곽 충돌/요격 히트 FX (orbit 씬 좌표)
// ============================================================

import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { INBOUND_DRONE_Y_MUL } from './planetOrbitInboundDroneConstants';

import {
  INBOUND_DRONE_FLAME_FX_MS,
  INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS,
} from './planetSkiaHitFxContract';

export { INBOUND_DRONE_FLAME_FX_MS, INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS };
export const INBOUND_DRONE_HIT_FX_MAX = 16;
/** orbit 보간 기준 — 행성 외곽 도달 */
export const INBOUND_DRONE_VISUAL_IMPACT_PROGRESS = 0.995;

export type InboundDroneHitFxVariant = 'impact' | 'intercept';

export type InboundDroneHitFx = {
  id: string;
  x: number;
  y: number;
  startOrbitMs: number;
  variant: InboundDroneHitFxVariant;
};

export function resolveInboundDroneHitXY(
  drone: ArcInboundDrone,
  center: number,
  edgeR: number,
  impactR: number,
): { x: number; y: number } {
  const ang = Number.isFinite(drone.approachAngleRad) ? drone.approachAngleRad : 0;
  const dur = Math.max(0.001, Number.isFinite(drone.inboundDurationSec) ? drone.inboundDurationSec : 0.001);
  const elapsed = Math.max(0, Number.isFinite(drone.inboundElapsedSec) ? drone.inboundElapsedSec : 0);
  const progress =
    drone.phase === 'impacted' ? 1 : Math.min(1, Math.max(0, elapsed / dur));
  const r = impactR + (edgeR - impactR) * (1 - progress);
  return {
    x: center + Math.cos(ang) * r,
    y: center + Math.sin(ang) * r * INBOUND_DRONE_Y_MUL,
  };
}

export function pushInboundDroneHitFx(
  list: InboundDroneHitFx[],
  fx: InboundDroneHitFx,
): void {
  list.push(fx);
  if (list.length <= INBOUND_DRONE_HIT_FX_MAX) return;
  list.splice(0, list.length - INBOUND_DRONE_HIT_FX_MAX);
}

export function compactInboundDroneHitFxInPlace(list: InboundDroneHitFx[], orbitMs: number): void {
  let w = 0;
  for (let r = 0; r < list.length; r += 1) {
    const fx = list[r];
    if (!fx) continue;
    const age = orbitMs - fx.startOrbitMs;
    if (age < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || age > INBOUND_DRONE_FLAME_FX_MS) continue;
    list[w++] = fx;
  }
  list.length = w;
}
