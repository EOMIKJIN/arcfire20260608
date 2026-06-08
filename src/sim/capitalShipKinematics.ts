// ============================================================
// 전함(자본함) 평면 운동학 — 최소 회전반경(요율 제한)
// 진행 방향(헤딩)으로 전진만 하며, 방향 전환은 멈춘 뒤 즉시 반대로 가지 못함
// (위성/항공기식: 속도 벡터가 곡선으로 스냅)
// ============================================================

export type Vec2 = { x: number; y: number };

/** (-π, π] 로 정규화 */
export function normalizeAngleRad(rad: number): number {
  const twoPi = Math.PI * 2;
  return ((((rad + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
}

/** from → to 로 가장 짧은 회전각 (라디안) */
export function shortestTurnDeltaRad(fromHeading: number, toHeading: number): number {
  return normalizeAngleRad(toHeading - fromHeading);
}

export type CapitalShipKinematicStep = {
  forwardSpeedPxPerMs: number;
  minTurnRadiusPx: number;
  dtMs: number;
};

/**
 * 현재 (x,y,heading) 에서 desiredHeading 방향으로 곡선 선회하며 한 스텝 적분.
 * 최대 요율 ω_max = v / R_min (조종 가능한 최소 반경 근사).
 */
export function integrateCapitalShipPlanar(
  x: number,
  y: number,
  headingRad: number,
  desiredHeadingRad: number,
  step: CapitalShipKinematicStep,
): { x: number; y: number; headingRad: number } {
  const { forwardSpeedPxPerMs: v, minTurnRadiusPx: R, dtMs } = step;
  const Rc = Math.max(8, R);
  const omegaMax = v / Rc;
  const delta = shortestTurnDeltaRad(headingRad, desiredHeadingRad);
  const turn = Math.max(-omegaMax * dtMs, Math.min(omegaMax * dtMs, delta));
  const newHeading = normalizeAngleRad(headingRad + turn);
  return {
    x: x + Math.cos(newHeading) * v * dtMs,
    y: y + Math.sin(newHeading) * v * dtMs,
    headingRad: newHeading,
  };
}

export function desiredHeadingPursuit(self: Vec2, target: Vec2): number {
  return Math.atan2(target.y - self.y, target.x - self.x);
}

/** 추격회피: 표적 방향 + 수직 위빙 단위벡터의 방향각 */
export function desiredHeadingEvasivePursuit(
  self: Vec2,
  target: Vec2,
  elapsedMs: number,
  weaveAmp: number,
  weaveOmega: number,
): number {
  const tx = target.x - self.x;
  const ty = target.y - self.y;
  const d = Math.hypot(tx, ty) || 1e-6;
  const fx = tx / d;
  const fy = ty / d;
  const px = -fy;
  const py = fx;
  const weave = Math.sin(elapsedMs * weaveOmega);
  const wx = fx + px * weave * weaveAmp;
  const wy = fy + py * weave * weaveAmp;
  const w = Math.hypot(wx, wy) || 1e-6;
  return Math.atan2(wy / w, wx / w);
}

/** 궤도 반대편 스폰 시 시계 반대 방향 접선 헤딩(화면 y+) */
export function progradeHeadingFromOrbitAngle(positionAngleRad: number): number {
  return normalizeAngleRad(positionAngleRad + Math.PI / 2);
}
