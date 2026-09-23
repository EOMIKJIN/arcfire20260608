/**
 * 아크 수송선 위상 각도 연속 — dwelling/entering → departing bake.
 * worklet(`computeArcNpcShipScreenPacked`)과 동일 상수·공식을 JS에서 맞춤.
 */

import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';

/** planetOrbitHubWorklets ARC_ORBIT_* 와 동기 유지 */
export const ARC_TRAFFIC_ORBIT_Y_MUL = 0.66;
export const ARC_TRAFFIC_EDGE_Y_MUL = 0.72;
export const ARC_TRAFFIC_EDGE_R = PLANET_MAIN_ORBIT_SCENE_SIZE * 0.68;

export function bakeDwellOrbitAngleIntoAnchor(input: {
  orbitAngleRad: number;
  phaseElapsedSec: number;
  arcTrafficDwellRadPerSec: number;
}): number {
  const elapsed = Number.isFinite(input.phaseElapsedSec) ? Math.max(0, input.phaseElapsedSec) : 0;
  const rate = Number.isFinite(input.arcTrafficDwellRadPerSec) ? input.arcTrafficDwellRadPerSec : 0;
  const anchor = Number.isFinite(input.orbitAngleRad) ? input.orbitAngleRad : 0;
  return anchor + elapsed * rate;
}

/**
 * entering 중 이탈(eject) — 현재 lerp 화면 위치를 궤도 앵커(각·반경)로 굽는다.
 * departing은 이 앵커에서 외곽으로 lerp하므로 bake 없으면 orbit 목표점으로 순간 이동한다.
 */
export function bakeEnteringLerpToOrbitAnchor(input: {
  phaseElapsedSec: number;
  phaseDurationSec: number;
  orbitAngleRad: number;
  orbitRadiusPx: number;
  edgeAngleRad: number;
  edgeRadiusPx: number;
}): { orbitAngleRad: number; orbitRadiusPx: number } {
  const dur = Math.max(0.001, Number.isFinite(input.phaseDurationSec) ? input.phaseDurationSec : 0.001);
  const elapsed = Number.isFinite(input.phaseElapsedSec) ? Math.max(0, input.phaseElapsedSec) : 0;
  const phaseP = Math.min(1, Math.max(0, elapsed / dur));
  const edgeAng = Number.isFinite(input.edgeAngleRad) ? input.edgeAngleRad : 0;
  const orbitAng = Number.isFinite(input.orbitAngleRad) ? input.orbitAngleRad : 0;
  const orbitR = Number.isFinite(input.orbitRadiusPx) ? input.orbitRadiusPx : 0;
  const edgeR = Number.isFinite(input.edgeRadiusPx) ? input.edgeRadiusPx : 0;

  const edgeX = Math.cos(edgeAng) * edgeR;
  const edgeY = Math.sin(edgeAng) * edgeR * ARC_TRAFFIC_EDGE_Y_MUL;
  const orbitX = Math.cos(orbitAng) * orbitR;
  const orbitY = Math.sin(orbitAng) * orbitR * ARC_TRAFFIC_ORBIT_Y_MUL;
  const tx = edgeX + (orbitX - edgeX) * phaseP;
  const ty = edgeY + (orbitY - edgeY) * phaseP;
  // 궤도 타원(Y_MUL) 기준 극좌표로 복원 — departing 시작점이 현재 화면 위치와 일치
  const ang = Math.atan2(ty / ARC_TRAFFIC_ORBIT_Y_MUL, tx);
  const r = Math.hypot(tx, ty / ARC_TRAFFIC_ORBIT_Y_MUL);
  return {
    orbitAngleRad: Number.isFinite(ang) ? ang : orbitAng,
    orbitRadiusPx: Number.isFinite(r) && r > 1 ? r : Math.max(orbitR, 1),
  };
}
