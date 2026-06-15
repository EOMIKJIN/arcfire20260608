// ============================================================
// 행성 허브 — 아크코어 드론 inbound worklet (Reanimated)
// ============================================================

import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import {
  INBOUND_DRONE_PACK_STRIDE,
  INBOUND_DRONE_Y_MUL,
} from './planetOrbitInboundDroneConstants';

export { INBOUND_DRONE_PACK_STRIDE, INBOUND_DRONE_Y_MUL };

export type InboundDroneScreen = { x: number; y: number; opacity: number };

function finiteOr(v: number, fallback: number): number {
  'worklet';
  return Number.isFinite(v) ? v : fallback;
}

/** b+1 = spawn 시 orbitClockMs 앵커 — 4Hz 스냅샷·sync 리셋 없이 프레임 보간 */
export function computeInboundDroneScreenPacked(
  index: number,
  orbitMs: number,
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
  const startOrbitMs = finiteOr(flat[b + 1]!, orbitMs);
  const dur = Math.max(0.001, finiteOr(flat[b + 2]!, 0.001));
  const ang = finiteOr(flat[b + 3]!, 0);
  const elapsed = Math.max(0, (orbitMs - startOrbitMs) * 0.001);
  const progress = Math.min(1, Math.max(0, elapsed / dur));
  const r = impactR + (edgeR - impactR) * (1 - progress);
  const tx = Math.cos(ang) * r;
  const ty = Math.sin(ang) * r * INBOUND_DRONE_Y_MUL;
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return null;
  return { x: center + tx, y: center + ty, opacity: 0.88 };
}

export function packInboundDronesToFloat32(
  drones: ArcInboundDrone[],
  startOrbitMsById: ReadonlyMap<string, number>,
): number[] {
  const out = new Array<number>(drones.length * INBOUND_DRONE_PACK_STRIDE).fill(0);
  for (let i = 0; i < drones.length; i++) {
    const d = drones[i]!;
    const b = i * INBOUND_DRONE_PACK_STRIDE;
    out[b] = d.phase === 'inbound' ? 0 : 1;
    out[b + 1] = startOrbitMsById.get(d.id) ?? 0;
    out[b + 2] = Math.max(0.001, Number.isFinite(d.inboundDurationSec) ? d.inboundDurationSec : 0.001);
    out[b + 3] = Number.isFinite(d.approachAngleRad) ? d.approachAngleRad : 0;
    out[b + 4] = 0;
  }
  return out;
}

/** packSig — elapsed 제외(아크 수송선 arcPackSig 패턴). 스폰·phase·궤도만 */
export function buildInboundDronePackSig(drones: readonly ArcInboundDrone[]): string {
  return drones
    .map((d) =>
      [
        d.id,
        d.phase,
        d.inboundDurationSec.toFixed(3),
        d.approachAngleRad.toFixed(4),
      ].join(':'),
    )
    .join('|');
}
