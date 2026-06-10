// ============================================================
// 발사체 스폰 기하 — trajectoryMode별 p0/p1/p2·travelMs (테이블 탄속 연동)
// ============================================================

import type { CapitalWeaponCsvRow } from '../data/generated';
import { resolveRocketImpactSpreadRadiusPx } from '../game/capitalWeaponRegistry';
import { resolveCapitalWeaponRuntimeSpec } from './capitalWeaponRuntimeSpec';

export type ProjectileSpawnPoint = { x: number; y: number };

export type CapitalProjectileSpawnParams = {
  weaponId: string;
  p0: ProjectileSpawnPoint;
  aimCenter: ProjectileSpawnPoint;
  spreadIdx: number;
  salvoCount: number;
  flightSpeedPxPerMs: number;
  curveSign?: 1 | -1;
};

export type CapitalProjectileSpawnResult = {
  p0: ProjectileSpawnPoint;
  p1: ProjectileSpawnPoint;
  p2: ProjectileSpawnPoint;
  travelMs: number;
  lockImpactPoint: boolean;
  spreadLane: number;
  salvoCount: number;
  curveSign: 1 | -1;
};

function missileSpreadLane(spreadIdx: number, salvoCount: number): number {
  const count = Math.max(1, salvoCount);
  const i = ((spreadIdx % count) + count) % count;
  return i - (count - 1) * 0.5;
}

export function computeCapitalProjectileTravelMs(
  chordPx: number,
  flightSpeedPxPerMs: number,
  opts?: { minMs?: number; maxMs?: number },
): number {
  const minMs = opts?.minMs ?? 120;
  const maxMs = opts?.maxMs ?? 24_000;
  return Math.round(
    Math.max(minMs, Math.min(maxMs, chordPx / Math.max(1e-5, flightSpeedPxPerMs))),
  );
}

function randomSpreadOffset(spreadRadiusPx: number): ProjectileSpawnPoint {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.sqrt(Math.random()) * spreadRadiusPx;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
}

function buildBezierGuidedSpawn(
  params: CapitalProjectileSpawnParams,
): CapitalProjectileSpawnResult {
  const { p0, aimCenter, spreadIdx, salvoCount, flightSpeedPxPerMs, curveSign = 1 } = params;
  const aim = { ...aimCenter };
  const chord = Math.hypot(aim.x - p0.x, aim.y - p0.y) || 1e-4;
  const travelMs = computeCapitalProjectileTravelMs(chord, flightSpeedPxPerMs, { minMs: 400 });
  const lane = missileSpreadLane(spreadIdx, salvoCount);
  const dx = aim.x - p0.x;
  const dy = aim.y - p0.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 1e-9 ? dx / d : 1;
  const uy = d > 1e-9 ? dy / d : 0;
  const nx = -uy;
  const ny = ux;
  const laneLateral = 24 * lane;
  const baseArcLateral = lane === 0 ? 20 * curveSign : 0;
  const lateral = laneLateral + baseArcLateral;
  const forward = 18 + Math.abs(lane) * 6;
  const p1 = {
    x: (p0.x + aim.x) / 2 + nx * lateral + ux * forward,
    y: (p0.y + aim.y) / 2 + ny * lateral + uy * forward,
  };
  const spec = resolveCapitalWeaponRuntimeSpec(params.weaponId);
  return {
    p0: { ...p0 },
    p1,
    p2: { ...aim },
    travelMs,
    lockImpactPoint: spec?.lockImpactPoint ?? false,
    spreadLane: spreadIdx % Math.max(1, salvoCount),
    salvoCount: Math.max(1, salvoCount),
    curveSign,
  };
}

function buildStraightFixedSpawn(
  params: CapitalProjectileSpawnParams,
  spreadRadiusPx: number,
): CapitalProjectileSpawnResult {
  const { p0, aimCenter, spreadIdx, salvoCount, flightSpeedPxPerMs } = params;
  const offset = randomSpreadOffset(spreadRadiusPx);
  const aim = { x: aimCenter.x + offset.x, y: aimCenter.y + offset.y };
  const chord = Math.hypot(aim.x - p0.x, aim.y - p0.y) || 1e-4;
  const travelMs = computeCapitalProjectileTravelMs(chord, flightSpeedPxPerMs, { maxMs: 6000 });
  return {
    p0: { ...p0 },
    p1: { x: (p0.x + aim.x) * 0.5, y: (p0.y + aim.y) * 0.5 },
    p2: { ...aim },
    travelMs,
    lockImpactPoint: true,
    spreadLane: spreadIdx % Math.max(1, salvoCount),
    salvoCount: Math.max(1, salvoCount),
    curveSign: 1,
  };
}

/** family trajectoryMode → 스폰 결과. drone/carrier는 effectPending이어도 straight/bezier 폴백 */
export function buildCapitalProjectileSpawn(
  params: CapitalProjectileSpawnParams,
): CapitalProjectileSpawnResult | null {
  const spec = resolveCapitalWeaponRuntimeSpec(params.weaponId);
  if (!spec) return null;

  switch (spec.trajectoryMode) {
    case 'straight_fixed':
      return buildStraightFixedSpawn(params, resolveRocketImpactSpreadRadiusPx(params.weaponId));
    case 'bezier_guided':
      return buildBezierGuidedSpawn(params);
    case 'orbit_loiter':
    case 'arc_loiter_turn':
      // 미구현: 우선 로켓과 동일 직선+분산으로 스텁(연출만 family 팔레트)
      return buildStraightFixedSpawn(params, resolveRocketImpactSpreadRadiusPx(params.weaponId) * 1.2);
    case 'instant_beam':
      return null;
    default:
      return buildBezierGuidedSpawn(params);
  }
}

export function resolveCapitalProjectileSpeedPxPerMs(
  row: CapitalWeaponCsvRow,
  fallbackPxPerMs: number,
): number {
  return Math.max(1e-5, (row.projectileSpeedPxPerSec || fallbackPxPerMs * 1000) / 1000);
}
