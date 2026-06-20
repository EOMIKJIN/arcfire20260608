// ============================================================
// v2.0 §5-3 — 15단계 행성 코어 스탯 R&D 기본 시간 (Master Plan 축약)
// ============================================================

export type PlanetCoreStatRdStat = 'resource' | 'population' | 'defense' | 'technology' | 'environment';

/** stage 1..14 → 다음 단계(2..15) 연구 기본 시간(h) — stat별 동일 곡선 */
const BASE_HOURS_BY_STAGE: readonly number[] = [
  0, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104,
];

export function resolvePlanetCoreStatRdBaseHours(stage: number): number {
  const idx = Math.max(1, Math.min(14, Math.floor(stage)));
  return BASE_HOURS_BY_STAGE[idx] ?? 8;
}

export function resolvePlanetCoreStatRdTargetStage(currentStage: number): number | null {
  const cur = Math.max(0, Math.min(14, Math.floor(currentStage)));
  if (cur >= 14) return null;
  return cur + 1;
}
