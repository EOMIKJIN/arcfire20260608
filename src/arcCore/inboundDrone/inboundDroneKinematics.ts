// ============================================================
// 아크코어 드론 — edge → 행성 외곽 radial kinematics (JS·worklet 공용)
// ============================================================

import { getArcCoreInboundDronePolicy } from '../balance/arcCoreInboundDronePolicy';
import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';

export const INBOUND_DRONE_PACK_STRIDE = 5;
export const INBOUND_DRONE_Y_MUL = 0.66;

export type InboundDroneScreen = { x: number; y: number; opacity: number };

function finiteOr(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

/** orbitClockMs 앵커 — 스폰 시 저장값 우선, 없으면 elapsed 역산 */
export function resolveInboundDroneStartOrbitMs(
  drone: ArcInboundDrone,
  orbitMsNow = readPlanetOrbitClockMs(),
): number {
  const stored = drone.inboundStartOrbitMs;
  if (typeof stored === 'number' && Number.isFinite(stored)) return stored;
  const elapsed = finiteOr(drone.inboundElapsedSec, 0);
  return orbitMsNow - elapsed * 1000;
}

/** 0..1 — impacted는 1, inbound는 wall/저장 elapsed 우선 */
export function resolveInboundDroneProgressAtOrbitMs(
  drone: ArcInboundDrone,
  orbitMs: number,
): number {
  if (drone.phase === 'impacted') return 1;
  const dur = Math.max(0.001, finiteOr(drone.inboundDurationSec, 0.001));
  const storedElapsed = finiteOr(drone.inboundElapsedSec, 0);
  if (storedElapsed > 0 || drone.inboundStartWallSec != null) {
    return Math.min(1, storedElapsed / dur);
  }
  const startMs = resolveInboundDroneStartOrbitMs(drone, orbitMs);
  const elapsed = Math.max(0, (orbitMs - startMs) * 0.001);
  return Math.min(1, elapsed / dur);
}

/** orbit 시계 기준 elapsed(초) — SubCore·요격·FX 공용 */
export function resolveInboundDroneElapsedSecAtOrbitMs(
  drone: ArcInboundDrone,
  orbitMs: number,
): number {
  const dur = Math.max(0.001, finiteOr(drone.inboundDurationSec, 0.001));
  return resolveInboundDroneProgressAtOrbitMs(drone, orbitMs) * dur;
}

/** JS — 요격 거리 판정용 (center 오프셋 전, orbit 시계 정본) */
export function resolveInboundDroneScreenXY(
  drone: ArcInboundDrone,
  orbitMs = readPlanetOrbitClockMs(),
): { x: number; y: number } | null {
  if (drone.phase !== 'inbound' && drone.phase !== 'destroyed') return null;
  const policy = getArcCoreInboundDronePolicy();
  const progress = resolveInboundDroneProgressAtOrbitMs(drone, orbitMs);
  const edgeR = policy.edgeSpawnRadiusPx;
  const impactR = policy.impactRadiusPx;
  const r = impactR + (edgeR - impactR) * (1 - progress);
  const ang = finiteOr(drone.approachAngleRad, 0);
  return {
    x: Math.cos(ang) * r,
    y: Math.sin(ang) * r * INBOUND_DRONE_Y_MUL,
  };
}

export function computeInboundDroneScreenPacked(
  index: number,
  m: number,
  t0: number,
  flat: ArrayLike<number>,
  droneCount: number,
  center: number,
  edgeR: number,
  impactR: number,
): InboundDroneScreen | null {
  'worklet';
  if (index >= droneCount) return null;
  const b = index * INBOUND_DRONE_PACK_STRIDE;
  if (b + INBOUND_DRONE_PACK_STRIDE - 1 >= flat.length) return null;
  const phaseCode = flat[b]!;
  if (phaseCode !== 0) return null;
  const elapsed0 = finiteOr(flat[b + 1]!, 0);
  const dur = Math.max(0.001, finiteOr(flat[b + 2]!, 0.001));
  const ang = finiteOr(flat[b + 3]!, 0);
  const dt = (m - t0) * 0.001;
  const elapsed = elapsed0 + dt;
  const progress = Math.min(1, Math.max(0, elapsed / dur));
  const r = impactR + (edgeR - impactR) * (1 - progress);
  const tx = Math.cos(ang) * r;
  const ty = Math.sin(ang) * r * INBOUND_DRONE_Y_MUL;
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return null;
  return { x: center + tx, y: center + ty, opacity: 0.92 };
}

export function packInboundDronesToFloat32(
  drones: ArcInboundDrone[],
  edgeR: number,
  impactR: number,
): number[] {
  const out = new Array<number>(drones.length * INBOUND_DRONE_PACK_STRIDE).fill(0);
  for (let i = 0; i < drones.length; i++) {
    const d = drones[i]!;
    const b = i * INBOUND_DRONE_PACK_STRIDE;
    out[b] = d.phase === 'inbound' ? 0 : 1;
    out[b + 1] = Number.isFinite(d.inboundElapsedSec) ? d.inboundElapsedSec : 0;
    out[b + 2] = Math.max(0.001, Number.isFinite(d.inboundDurationSec) ? d.inboundDurationSec : 0.001);
    out[b + 3] = Number.isFinite(d.approachAngleRad) ? d.approachAngleRad : 0;
    out[b + 4] = 0;
  }
  void edgeR;
  void impactR;
  return out;
}
