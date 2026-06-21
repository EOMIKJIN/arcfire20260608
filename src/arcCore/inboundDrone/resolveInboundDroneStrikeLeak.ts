import type { ArcInboundDrone } from '../../store/arcInboundDroneStore';

/** 위성 요격 hitPct(0..100) → 행성 표면까지 누수되는 타격 비율(0..1) */
export function leakFractionFromInterceptHitPct(hitPct: number): number {
  const hit = Math.max(0, Math.min(100, hitPct));
  return Math.max(0.05, (100 - hit) / 100);
}

/**
 * 방어구 통과 중 기록된 최소 누수율 — 미기록 시 1(위성 없음·구역 미진입).
 * ArcInboundDroneSubCore impact 시 applyPlanetAttackCoreDamage intensityMul 로 전달.
 */
export function resolveArcInboundDroneStrikeLeakMul(drone: ArcInboundDrone): number {
  const raw = drone.strikeLeakMul;
  if (raw == null || !Number.isFinite(raw)) return 1;
  return Math.max(0.05, Math.min(1, raw));
}
