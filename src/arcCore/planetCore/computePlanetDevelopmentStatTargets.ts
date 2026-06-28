// ============================================================
// 행성개발(시설 레벨) → 5대 스탯 목표치 (baseline ~50 → 풀개발 ~87)
// ============================================================

import { resolveFacilityStatNudgesForLevel } from '../balance/facilityUpgradeLevelsPolicy';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { listInstalledFacilityLevels } from '../../game/planetDevelopment/planetFacilityLevelResolver';
import { resolvePlanetCoreStatEquilibriumPolicy } from '../balance/planetCoreStatEquilibriumPolicy';

const STAT_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;
const MAX_DEV_LEVEL = 15;
const FACILITY_TYPES = [
  'trade_port',
  'shipyard',
  'defense_satellite',
  'laboratory',
  'tavern',
] as const;

export type PlanetDevStatWeightGauge = PlanetCoreGaugeView;

let cachedMaxWeights: PlanetDevStatWeightGauge | null = null;

function emptyGauge(): PlanetDevStatWeightGauge {
  return { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 };
}

function addGauge(a: PlanetDevStatWeightGauge, b: PlanetDevStatWeightGauge): PlanetDevStatWeightGauge {
  return {
    resource: a.resource + b.resource,
    population: a.population + b.population,
    defense: a.defense + b.defense,
    technology: a.technology + b.technology,
    environment: a.environment + b.environment,
  };
}

/** facility_upgrade_levels.csv L15 × 5시설 — 스탯별 최대 기여 가중치 */
export function resolveMaxPlanetDevelopmentStatWeights(): PlanetDevStatWeightGauge {
  if (cachedMaxWeights) return cachedMaxWeights;
  let acc = emptyGauge();
  for (const facilityType of FACILITY_TYPES) {
    const n = resolveFacilityStatNudgesForLevel(facilityType, MAX_DEV_LEVEL);
    acc = addGauge(acc, n);
  }
  cachedMaxWeights = acc;
  return acc;
}

/** 설치 시설 레벨 합산 — 스탯별 개발 기여 가중치 */
export function resolvePlanetDevelopmentStatWeights(planetId: string): PlanetDevStatWeightGauge {
  let acc = emptyGauge();
  for (const f of listInstalledFacilityLevels(planetId)) {
    if (!f.installed || f.level <= 0) continue;
    const n = resolveFacilityStatNudgesForLevel(f.facilityType, f.level);
    acc = addGauge(acc, n);
  }
  return acc;
}

function ratio(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, current / max));
}

/**
 * CSV baseline(≈50)에서 개발 진행도에 따라 목표 스탯 산출.
 * 풀개발(5×L15) 시 각 스탯 ~full_dev_target_pct(87%).
 */
export function computePlanetDevelopmentStatTargets(
  planetId: string,
  baseline?: Partial<PlanetCoreGaugeView>,
): PlanetCoreGaugeView {
  const policy = resolvePlanetCoreStatEquilibriumPolicy();
  const base = policy.baselineStatPct;
  const targetMax = policy.fullDevTargetPct;
  const span = Math.max(0, targetMax - base);

  const b: PlanetCoreGaugeView = {
    resource: baseline?.resource ?? base,
    population: baseline?.population ?? base,
    defense: baseline?.defense ?? base,
    technology: baseline?.technology ?? base,
    environment: baseline?.environment ?? base,
  };

  const weights = resolvePlanetDevelopmentStatWeights(planetId);
  const maxW = resolveMaxPlanetDevelopmentStatWeights();

  return {
    resource: Math.round(b.resource + span * ratio(weights.resource, maxW.resource)),
    population: Math.round(b.population + span * ratio(weights.population, maxW.population)),
    defense: Math.round(b.defense + span * ratio(weights.defense, maxW.defense)),
    technology: Math.round(b.technology + span * ratio(weights.technology, maxW.technology)),
    environment: Math.round(b.environment + span * ratio(weights.environment, maxW.environment)),
  };
}

export function sumPlanetDevelopmentStatWeightTotal(weights: PlanetDevStatWeightGauge): number {
  return STAT_KEYS.reduce((s, k) => s + weights[k], 0);
}
