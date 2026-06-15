// ============================================================
// 행성 공격 요소(Attack Source) 식별자 — Table-First 정본은 CSV attack_kind 열.
// ============================================================

/** `planet_attack_core_damage.csv` · `attack_kind` 열과 1:1 */
export const PLANET_ATTACK_KIND = {
  /** 아크코어 inbound 드론 — 행성 외곽 충돌(phase=impacted) */
  ARC_INBOUND_DRONE_IMPACT: 'arc_inbound_drone_impact',
  /** 향후: 전투 승리 후 행성 타격 등 */
  PLANETARY_BOMBARDMENT_STUB: 'planetary_bombardment_stub',
} as const;

export type PlanetAttackKind = (typeof PLANET_ATTACK_KIND)[keyof typeof PLANET_ATTACK_KIND];

/** planetCoreRuntimeStore 5대 스탯 키 (R/P/D/T/E) */
export type PlanetCoreMetricKey =
  | 'resource'
  | 'population'
  | 'defense'
  | 'technology'
  | 'environment';

export const PLANET_CORE_METRIC_KEYS: readonly PlanetCoreMetricKey[] = [
  'resource',
  'population',
  'defense',
  'technology',
  'environment',
] as const;

export type PlanetCoreMetricDelta = Record<PlanetCoreMetricKey, number>;

export function zeroPlanetCoreMetricDelta(): PlanetCoreMetricDelta {
  return {
    resource: 0,
    population: 0,
    defense: 0,
    technology: 0,
    environment: 0,
  };
}
