// ============================================================
// 아크코어 드론 — Skia radial trail (단일 선 + 종료 후 시간 페이드)
// ============================================================

import type { SkPath } from '@shopify/react-native-skia';
import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';
import { INBOUND_DRONE_Y_MUL } from './planetOrbitInboundDroneConstants';

/** trail flat: phase, startOrbitMs|endElapsed, dur, ang, endOrbitMs */
export const INBOUND_DRONE_TRAIL_PACK_STRIDE = 5;

/** 전투 `MISSILE_INFLIGHT_TRAIL_WINDOW_U` / `MISSILE_TRAIL_FADE_MS` 패턴 */
export const INBOUND_DRONE_TRAIL_WINDOW_U = 0.78;
export const INBOUND_DRONE_TRAIL_FADE_MS = 1400;
export const INBOUND_DRONE_TRAIL_GLOW_STROKE_MUL = 2.4;
export const INBOUND_DRONE_TRAIL_GLOW_OPACITY_MUL = 0.42;
export const INBOUND_DRONE_TRAIL_GLOW_COLOR = 'rgba(239, 68, 68, 0.55)';
export const INBOUND_DRONE_TRAIL_POLYLINE_SAMPLES = 10;
/** 머리(드론 쪽) / 꼬리(오래된 쪽) 반폭 px — fill 리본 테이퍼 */
export const INBOUND_DRONE_TRAIL_HEAD_HALF_WIDTH_PX =
  0.5 * INBOUND_DRONE_TRAIL_GLOW_STROKE_MUL + 0.55;
export const INBOUND_DRONE_TRAIL_TAIL_HALF_WIDTH_PX = 0.22;
export const INBOUND_DRONE_TRAIL_WIDTH_TAPER_EXP = 0.82;

function finiteOr(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

export type InboundDroneTrailSlice = {
  uHead: number;
  uTail: number;
  trailOpacity: number;
  visible: boolean;
  ang: number;
};

export function packInboundDroneTrailFlat(
  drones: ArcInboundDrone[],
  startOrbitMsById: ReadonlyMap<string, number>,
  endOrbitMsById: ReadonlyMap<string, number>,
  orbitMsNow: number,
): number[] {
  const out = new Array<number>(drones.length * INBOUND_DRONE_TRAIL_PACK_STRIDE).fill(0);
  for (let i = 0; i < drones.length; i += 1) {
    const d = drones[i]!;
    const b = i * INBOUND_DRONE_TRAIL_PACK_STRIDE;
    const flying = d.phase === 'inbound';
    out[b] = flying ? 0 : 1;
    out[b + 2] = Math.max(0.001, Number.isFinite(d.inboundDurationSec) ? d.inboundDurationSec : 0.001);
    out[b + 3] = Number.isFinite(d.approachAngleRad) ? d.approachAngleRad : 0;
    if (flying) {
      out[b + 1] = startOrbitMsById.get(d.id) ?? orbitMsNow;
      out[b + 4] = 0;
    } else {
      out[b + 1] = Number.isFinite(d.inboundElapsedSec) ? d.inboundElapsedSec : 0;
      const cached = endOrbitMsById.get(d.id);
      out[b + 4] = cached ?? orbitMsNow;
    }
  }
  return out;
}

export function resolveInboundDroneTrailSlice(
  index: number,
  orbitMs: number,
  flat: ArrayLike<number>,
  droneCount: number,
): InboundDroneTrailSlice | null {
  if (index >= droneCount) return null;
  const b = index * INBOUND_DRONE_TRAIL_PACK_STRIDE;
  if (b + INBOUND_DRONE_TRAIL_PACK_STRIDE - 1 >= flat.length) return null;

  const phaseCode = flat[b]!;
  const anchorOrElapsed = finiteOr(flat[b + 1]!, 0);
  const dur = Math.max(0.001, finiteOr(flat[b + 2]!, 0.001));
  const ang = finiteOr(flat[b + 3]!, 0);
  const endOrbitMs = finiteOr(flat[b + 4]!, 0);
  const tailStartAtImpact = Math.max(0, 1 - INBOUND_DRONE_TRAIL_WINDOW_U);

  let uHead: number;
  let uTail: number;
  let trailOpacity = 0.9;

  if (phaseCode === 0) {
    const elapsed = Math.max(0, (orbitMs - anchorOrElapsed) * 0.001);
    const uFlight = Math.min(1, Math.max(0, elapsed / dur));
    uHead = uFlight;
    uTail = Math.max(0, uHead - INBOUND_DRONE_TRAIL_WINDOW_U);
  } else {
    const elapsed0 = anchorOrElapsed;
    uHead = Math.min(1, Math.max(0, elapsed0 / dur));
    const fadeMs = Math.max(0, orbitMs - endOrbitMs);
    if (fadeMs >= INBOUND_DRONE_TRAIL_FADE_MS) return null;
    const postHitT01 = fadeMs / INBOUND_DRONE_TRAIL_FADE_MS;
    uTail = tailStartAtImpact + (1 - tailStartAtImpact) * postHitT01;
    trailOpacity *= Math.max(0, 1 - Math.pow(postHitT01, 0.85));
  }

  const span = uHead - uTail;
  const visible = trailOpacity > 0.01 && span >= 0.004;
  if (!visible) return null;
  return { uHead, uTail, trailOpacity, visible, ang };
}

function resetPath(path: SkPath): void {
  const anyPath = path as unknown as { rewind?: () => void; reset?: () => void };
  if (typeof anyPath.rewind === 'function') anyPath.rewind();
  else if (typeof anyPath.reset === 'function') anyPath.reset();
}

function radialTrailPoint(
  center: number,
  edgeR: number,
  impactR: number,
  ang: number,
  u: number,
): { x: number; y: number } {
  const r = impactR + (edgeR - impactR) * (1 - u);
  return {
    x: center + Math.cos(ang) * r,
    y: center + Math.sin(ang) * r * INBOUND_DRONE_Y_MUL,
  };
}

/** uTail(얇음) → uHead(두꺼움) 단일 fill 리본 — stroke 세그먼트 분할 없음 */
export function writeInboundDroneTaperedTrailFillPath(
  path: SkPath,
  center: number,
  edgeR: number,
  impactR: number,
  ang: number,
  uTail: number,
  uHead: number,
): boolean {
  const span = uHead - uTail;
  if (span < 0.004) {
    resetPath(path);
    return false;
  }
  const n = Math.max(
    2,
    Math.min(INBOUND_DRONE_TRAIL_POLYLINE_SAMPLES, Math.ceil(4 + 10 * Math.max(span, 0.004))),
  );

  const cosA = Math.cos(ang);
  const sinA = Math.sin(ang);
  const chord = edgeR - impactR;
  let tx = -cosA * chord;
  let ty = -sinA * chord * INBOUND_DRONE_Y_MUL;
  const tLen = Math.hypot(tx, ty);
  if (tLen > 1e-6) {
    tx /= tLen;
    ty /= tLen;
  }
  const nx = -ty;
  const ny = tx;

  const left: Array<{ x: number; y: number }> = [];
  const right: Array<{ x: number; y: number }> = [];

  for (let k = 0; k <= n; k += 1) {
    const u = uTail + (k / n) * span;
    const p = radialTrailPoint(center, edgeR, impactR, ang, u);
    const along = (u - uTail) / span;
    const halfW =
      INBOUND_DRONE_TRAIL_TAIL_HALF_WIDTH_PX +
      (INBOUND_DRONE_TRAIL_HEAD_HALF_WIDTH_PX - INBOUND_DRONE_TRAIL_TAIL_HALF_WIDTH_PX) *
        Math.pow(along, INBOUND_DRONE_TRAIL_WIDTH_TAPER_EXP);
    left.push({ x: p.x + nx * halfW, y: p.y + ny * halfW });
    right.push({ x: p.x - nx * halfW, y: p.y - ny * halfW });
  }

  resetPath(path);
  path.moveTo(left[0]!.x, left[0]!.y);
  for (let k = 1; k < left.length; k += 1) {
    path.lineTo(left[k]!.x, left[k]!.y);
  }
  for (let k = right.length - 1; k >= 0; k -= 1) {
    path.lineTo(right[k]!.x, right[k]!.y);
  }
  path.close();
  return true;
}

export function writeInboundDroneRadialTrailPath(
  path: SkPath,
  center: number,
  edgeR: number,
  impactR: number,
  ang: number,
  uTail: number,
  uHead: number,
  reset = true,
): boolean {
  const span = uHead - uTail;
  if (span < 0.004) {
    if (reset) resetPath(path);
    return false;
  }
  const n = Math.max(
    2,
    Math.min(INBOUND_DRONE_TRAIL_POLYLINE_SAMPLES, Math.ceil(4 + 10 * Math.max(span, 0.004))),
  );
  if (reset) resetPath(path);
  for (let k = 0; k <= n; k += 1) {
    const t = uTail + (k / n) * span;
    const p = radialTrailPoint(center, edgeR, impactR, ang, t);
    if (k === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
  }
  return true;
}
