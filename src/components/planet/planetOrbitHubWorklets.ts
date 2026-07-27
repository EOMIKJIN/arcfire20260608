// ============================================================
// 행성 허브 궤도 — Reanimated worklet 공용 (info 거리 정렬 + Skia 동일 기하)
// ============================================================

import { Skia } from '@shopify/react-native-skia';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';

/** 아크 수송 패킹 stride — ArcNpcTrafficShip 스냅샷 */
export const ARC_ORBIT_PACK_STRIDE = 7;

export const ARC_ORBIT_EDGE_R = PLANET_MAIN_ORBIT_SCENE_SIZE * 0.68;
export const ARC_ORBIT_Y_MUL = 0.66;
export const ARC_ORBIT_EDGE_Y_MUL = 0.72;

/** 테이블 NPC 궤도 worklet flat stride — planet.tsx ORBIT_FLAT_STRIDE 와 동일 */
export const TABLE_ORBIT_FLAT_STRIDE = 7;

export type ArcNpcShipScreen = { x: number; y: number; opacity: number };

function finiteOr(v: number, fallback: number): number {
  'worklet';
  return Number.isFinite(v) ? v : fallback;
}

export function computeArcNpcShipScreenPacked(
  index: number,
  m: number,
  t0: number,
  flat: ArrayLike<number>,
  shipCount: number,
  center: number,
): ArcNpcShipScreen | null {
  'worklet';
  if (index >= shipCount) return null;
  const b = index * ARC_ORBIT_PACK_STRIDE;
  if (b + ARC_ORBIT_PACK_STRIDE - 1 >= flat.length) return null;
  const phaseCode = flat[b]!;
  const phaseEl0 = finiteOr(flat[b + 1]!, 0);
  const phaseDur = Math.max(0.001, finiteOr(flat[b + 2]!, 0.001));
  let orbitAng = finiteOr(flat[b + 3]!, 0);
  const orbitR = finiteOr(flat[b + 4]!, 0);
  const edgeAng = finiteOr(flat[b + 5]!, 0);
  const dwellRadPerSec = finiteOr(flat[b + 6]!, 0);
  const dt = (m - t0) * 0.001;
  // phaseEl0(= 이번 phase 진입 이후 JS `tickShips`가 누적한 경과초, 코어 벽시계 기준·throttle 없음)
  // + dt(마지막 재-pack 이후 worklet 자체 경과, 같은 SharedValue를 worklet이 직접 읽어 지연 없음)
  // — 두 값 다 신뢰 가능한 시계라 이어붙여도 끊김이 없다. 체류 각도는 이 합산값 하나로만 적분한다
  // (2026-07-27, arc-transport-dwell-jank) — orbitAng(고정 앵커)는 entering 진입 때 확정된 값.
  const phaseEl = phaseEl0 + dt;
  if (phaseCode === 1) {
    orbitAng += phaseEl * dwellRadPerSec;
  }
  const phaseP = Math.min(1, Math.max(0, phaseEl / phaseDur));
  const edgeX = Math.cos(edgeAng) * ARC_ORBIT_EDGE_R;
  const edgeY = Math.sin(edgeAng) * ARC_ORBIT_EDGE_R * ARC_ORBIT_EDGE_Y_MUL;
  const orbitX = Math.cos(orbitAng) * orbitR;
  const orbitY = Math.sin(orbitAng) * orbitR * ARC_ORBIT_Y_MUL;
  let tx = orbitX;
  let ty = orbitY;
  if (phaseCode === 0) {
    tx = edgeX + (orbitX - edgeX) * phaseP;
    ty = edgeY + (orbitY - edgeY) * phaseP;
  } else if (phaseCode === 2) {
    tx = orbitX + (edgeX - orbitX) * phaseP;
    ty = orbitY + (edgeY - orbitY) * phaseP;
  }
  const opacity = phaseCode === 1 ? 1 : 0.9;
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return null;
  return { x: center + tx, y: center + ty, opacity };
}

export function appendSkiaDiamondPath(
  p: ReturnType<typeof Skia.Path.Make>,
  cx: number,
  cy: number,
  r: number,
) {
  'worklet';
  p.moveTo(cx, cy - r);
  p.lineTo(cx + r, cy);
  p.lineTo(cx, cy + r);
  p.lineTo(cx - r, cy);
  p.close();
}

/** 테이블 NPC(타원 궤도) — planet OrbitNpcDiamond 와 동일 */
export function computeTableNpcOrbitXY(
  flat: number[],
  slotIndex: number,
  orbitClockMs: number,
  center: number,
  npcOrbitCycleMs: number,
): { x: number; y: number } | null {
  'worklet';
  const b = slotIndex * TABLE_ORBIT_FLAT_STRIDE;
  if (b + TABLE_ORBIT_FLAT_STRIDE - 1 >= flat.length) return null;
  const phase = flat[b]!;
  const speed = flat[b + 1]!;
  const radius = flat[b + 2]!;
  const moving = flat[b + 3] !== 0;
  const ellipseY = flat[b + 4]!;
  const pathTilt = flat[b + 5]!;
  const periodScale = flat[b + 6]!;
  const spin = moving ? (orbitClockMs / npcOrbitCycleMs) * Math.PI * 2 * speed * periodScale : 0;
  const ang = phase + spin;
  const x0 = Math.cos(ang) * radius;
  const y0 = Math.sin(ang) * radius * ellipseY;
  const c = Math.cos(pathTilt);
  const s = Math.sin(pathTilt);
  const x = x0 * c - y0 * s;
  const y = x0 * s + y0 * c;
  return { x: center + x, y: center + y };
}

/** JS 스레드 — Zustand 스냅샷 → worklet용 숫자 배열 */
export function packArcNpcShipsToFloat32(ships: ArcNpcTrafficShip[]): number[] {
  const out = new Array<number>(ships.length * ARC_ORBIT_PACK_STRIDE).fill(0);
  for (let i = 0; i < ships.length; i++) {
    const s = ships[i]!;
    const b = i * ARC_ORBIT_PACK_STRIDE;
    out[b] = s.phase === 'entering' ? 0 : s.phase === 'dwelling' ? 1 : 2;
    out[b + 1] = Number.isFinite(s.phaseElapsedSec) ? s.phaseElapsedSec : 0;
    out[b + 2] = Math.max(0.001, Number.isFinite(s.phaseDurationSec) ? s.phaseDurationSec : 0.001);
    out[b + 3] = Number.isFinite(s.orbitAngleRad) ? s.orbitAngleRad : 0;
    out[b + 4] = Number.isFinite(s.orbitRadiusPx) ? s.orbitRadiusPx : 0;
    out[b + 5] = Number.isFinite(s.edgeAngleRad) ? s.edgeAngleRad : 0;
    out[b + 6] = Number.isFinite(s.arcTrafficDwellRadPerSec) ? s.arcTrafficDwellRadPerSec : 0;
  }
  return out;
}

/**
 * JS 전용 — INFO 거리 정렬용. 행성 중심까지 거리 (`computeTableNpcOrbitXY` 기준 좌표, center 오프셋 전).
 */
export function jsTableNpcDistanceFromCenter(
  flat: number[],
  slotIndex: number,
  orbitClockMs: number,
  npcOrbitCycleMs: number,
): number | null {
  const b = slotIndex * TABLE_ORBIT_FLAT_STRIDE;
  if (b + TABLE_ORBIT_FLAT_STRIDE - 1 >= flat.length) return null;
  const phase = flat[b]!;
  const speed = flat[b + 1]!;
  const radius = flat[b + 2]!;
  const moving = flat[b + 3] !== 0;
  const ellipseY = flat[b + 4]!;
  const pathTilt = flat[b + 5]!;
  const periodScale = flat[b + 6]!;
  const spin = moving ? (orbitClockMs / npcOrbitCycleMs) * Math.PI * 2 * speed * periodScale : 0;
  const ang = phase + spin;
  const x0 = Math.cos(ang) * radius;
  const y0 = Math.sin(ang) * radius * ellipseY;
  const c = Math.cos(pathTilt);
  const s = Math.sin(pathTilt);
  const x = x0 * c - y0 * s;
  const y = x0 * s + y0 * c;
  return Math.hypot(x, y);
}

/**
 * JS 전용 — INFO 거리 정렬용. `computeArcNpcShipScreenPacked` 와 동일 궤도, 행성 중심까지 거리.
 */
export function jsArcNpcDistanceFromCenter(
  index: number,
  m: number,
  t0: number,
  flat: ArrayLike<number>,
  shipCount: number,
): number | null {
  if (index >= shipCount) return null;
  const b = index * ARC_ORBIT_PACK_STRIDE;
  if (b + ARC_ORBIT_PACK_STRIDE - 1 >= flat.length) return null;
  const phaseCode = flat[b]!;
  const phaseEl0 = flat[b + 1]!;
  const phaseDur = flat[b + 2]!;
  let orbitAng = flat[b + 3]!;
  const orbitR = flat[b + 4]!;
  const edgeAng = flat[b + 5]!;
  const dwellRadPerSec = flat[b + 6]!;
  const dt = (m - t0) * 0.001;
  // computeArcNpcShipScreenPacked와 동일 공식(2026-07-27 단일화) — 이 함수는 worklet이 아니지만
  // "동일 궤도" 계약(위 docstring)을 지키려면 적분 방식도 반드시 같아야 한다.
  const phaseEl = phaseEl0 + dt;
  if (phaseCode === 1) {
    orbitAng += phaseEl * dwellRadPerSec;
  }
  const phaseP = Math.min(1, Math.max(0, phaseEl / phaseDur));
  const edgeX = Math.cos(edgeAng) * ARC_ORBIT_EDGE_R;
  const edgeY = Math.sin(edgeAng) * ARC_ORBIT_EDGE_R * ARC_ORBIT_EDGE_Y_MUL;
  const orbitX = Math.cos(orbitAng) * orbitR;
  const orbitY = Math.sin(orbitAng) * orbitR * ARC_ORBIT_Y_MUL;
  let tx = orbitX;
  let ty = orbitY;
  if (phaseCode === 0) {
    tx = edgeX + (orbitX - edgeX) * phaseP;
    ty = edgeY + (orbitY - edgeY) * phaseP;
  } else if (phaseCode === 2) {
    tx = orbitX + (edgeX - orbitX) * phaseP;
    ty = orbitY + (edgeY - orbitY) * phaseP;
  }
  return Math.hypot(tx, ty);
}
