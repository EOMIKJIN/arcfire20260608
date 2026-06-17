export { PLANET_ATTACK_KIND, PLANET_CORE_METRIC_KEYS, zeroPlanetCoreMetricDelta } from './planetAttackKind';
export type { PlanetAttackKind, PlanetCoreMetricDelta, PlanetCoreMetricKey } from './planetAttackKind';
export { planetAttackKstDayKey } from './planetAttackKstDayKey';
export {
  getPlanetAttackCoreDamagePolicy,
  getPlanetAttackCoreDamagePolicyIndex,
  scalePlanetCoreMetricDelta,
  computePlanetAttackAppliedDelta,
} from './planetAttackCoreDamagePolicy';
export type { PlanetAttackCoreDamagePolicyRow } from './planetAttackCoreDamagePolicy';
export { applyPlanetAttackCoreDamage } from './applyPlanetAttackCoreDamage';
export type {
  ApplyPlanetAttackCoreDamageInput,
  ApplyPlanetAttackCoreDamageResult,
} from './applyPlanetAttackCoreDamage';

// 통합 공격 시스템 기반 (1~5 레벨 · inert)
export {
  ARC_ATTACK_CATEGORY,
  ARC_ATTACK_LEVEL_MIN,
  ARC_ATTACK_LEVEL_MAX,
  ARC_ATTACK_LEVEL_BASELINE,
  ARC_ATTACK_SAFETY,
  clampArcAttackLevel,
} from './arcCoreAttackModel';
export type { ArcAttackCategory } from './arcCoreAttackModel';
export {
  getArcCorePlanetAttackLevelPolicy,
  resolveEffectiveInboundDronePolicy,
  resolveAttackIntensityMul,
  resolveAttackDailyCapMul,
  resolveGeneralCombatLevelMul,
  resolveTransitEncounterMul,
} from './arcCorePlanetAttackLevelPolicy';
export type { ArcCorePlanetAttackLevelRow } from './arcCorePlanetAttackLevelPolicy';
export { resolvePlanetAttackLevel } from './resolvePlanetAttackLevel';
