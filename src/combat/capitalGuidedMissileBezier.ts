// ============================================================
// 전함 유도미사일 베지어 — combat·방위위성 요격 공용
// ============================================================

import type { ProjectileSpawnPoint } from './capitalProjectileSpawn';

export type CapitalGuidedMissileCurve = {
  p0: ProjectileSpawnPoint;
  p1: ProjectileSpawnPoint;
  p2: ProjectileSpawnPoint;
  spreadLane: number;
  salvoCount: number;
  curveSign: 1 | -1;
};

function missileSpreadLane(spreadIdx: number, salvoCount: number): number {
  const count = Math.max(1, salvoCount);
  const i = ((spreadIdx % count) + count) % count;
  return i - (count - 1) * 0.5;
}

/** 표적 위치로 낙점·제어점을 맞춘다 — 유도탄 곡선 유지(전함 combat과 동일) */
export function retargetCapitalGuidedMissileBezier(
  m: CapitalGuidedMissileCurve,
  target: ProjectileSpawnPoint,
): void {
  m.p2 = { x: target.x, y: target.y };
  const lane = missileSpreadLane(m.spreadLane, m.salvoCount);
  const dx = m.p2.x - m.p0.x;
  const dy = m.p2.y - m.p0.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 1e-9 ? dx / d : 1;
  const uy = d > 1e-9 ? dy / d : 0;
  const nx = -uy;
  const ny = ux;
  const laneLateral = 24 * lane;
  const baseArcLateral = lane === 0 ? 20 * m.curveSign : 0;
  const lateral = laneLateral + baseArcLateral;
  const forward = 18 + Math.abs(lane) * 6;
  m.p1 = {
    x: (m.p0.x + m.p2.x) / 2 + nx * lateral + ux * forward,
    y: (m.p0.y + m.p2.y) / 2 + ny * lateral + uy * forward,
  };
}

export function quadBezierCapitalPoint(
  p0: ProjectileSpawnPoint,
  p1: ProjectileSpawnPoint,
  p2: ProjectileSpawnPoint,
  t: number,
): ProjectileSpawnPoint {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}
