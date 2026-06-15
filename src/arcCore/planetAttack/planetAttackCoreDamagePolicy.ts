import { PlanetAttackCoreDamage_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { PlanetCoreMetricDelta, PlanetCoreMetricKey } from './planetAttackKind';
import { PLANET_CORE_METRIC_KEYS, zeroPlanetCoreMetricDelta } from './planetAttackKind';

export type PlanetAttackCoreDamagePolicyRow = {
  attackKind: string;
  delta: PlanetCoreMetricDelta;
  dailyEventCap: number;
  enabled: boolean;
  notesKo: string;
};

function parseIntField(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parseBool01(raw: string | undefined): boolean {
  const s = String(raw ?? '').trim();
  return s === '1' || s.toLowerCase() === 'true';
}

function rowToPolicy(row: (typeof PlanetAttackCoreDamage_FROM_BALANCE_CSV)[number]): PlanetAttackCoreDamagePolicyRow | null {
  const attackKind = String(row.attack_kind ?? '').trim();
  if (!attackKind) return null;

  const delta = zeroPlanetCoreMetricDelta();
  const deltaColumn: Record<PlanetCoreMetricKey, keyof typeof row> = {
    resource: 'resource_delta',
    population: 'population_delta',
    defense: 'defense_delta',
    technology: 'technology_delta',
    environment: 'environment_delta',
  };
  for (const key of PLANET_CORE_METRIC_KEYS) {
    delta[key] = parseIntField(String(row[deltaColumn[key]] ?? '0'), 0);
  }

  return {
    attackKind,
    delta,
    dailyEventCap: Math.max(0, parseIntField(String(row.daily_event_cap ?? '0'), 0)),
    enabled: parseBool01(String(row.enabled ?? '0')),
    notesKo: String(row.notesKo ?? '').trim(),
  };
}

let cachedByKind: Map<string, PlanetAttackCoreDamagePolicyRow> | null = null;

function buildIndex(): Map<string, PlanetAttackCoreDamagePolicyRow> {
  const map = new Map<string, PlanetAttackCoreDamagePolicyRow>();
  for (const row of PlanetAttackCoreDamage_FROM_BALANCE_CSV) {
    const policy = rowToPolicy(row);
    if (policy) map.set(policy.attackKind, policy);
  }
  return map;
}

export function getPlanetAttackCoreDamagePolicyIndex(): ReadonlyMap<string, PlanetAttackCoreDamagePolicyRow> {
  if (!cachedByKind) cachedByKind = buildIndex();
  return cachedByKind;
}

export function getPlanetAttackCoreDamagePolicy(attackKind: string): PlanetAttackCoreDamagePolicyRow | undefined {
  return getPlanetAttackCoreDamagePolicyIndex().get(attackKind);
}

export function scalePlanetCoreMetricDelta(
  delta: PlanetCoreMetricDelta,
  intensityMul: number,
): PlanetCoreMetricDelta {
  const mul = Number.isFinite(intensityMul) && intensityMul > 0 ? intensityMul : 1;
  const out = zeroPlanetCoreMetricDelta();
  for (const key of PLANET_CORE_METRIC_KEYS) {
    out[key] = Math.round(delta[key] * mul);
  }
  return out;
}

/** 정책 delta를 0..100 게이지에 적용할 실제 변화량(음수=피해) */
export function computePlanetAttackAppliedDelta(
  current: PlanetCoreMetricDelta,
  rawDelta: PlanetCoreMetricDelta,
): PlanetCoreMetricDelta {
  const applied = zeroPlanetCoreMetricDelta();
  for (const key of PLANET_CORE_METRIC_KEYS) {
    const before = Math.max(0, Math.min(100, Math.round(current[key])));
    const after = Math.max(0, Math.min(100, before + rawDelta[key]));
    applied[key] = after - before;
  }
  return applied;
}

export function applyDeltaToGauge(
  gauge: PlanetCoreMetricDelta,
  delta: PlanetCoreMetricDelta,
): PlanetCoreMetricDelta {
  const next = zeroPlanetCoreMetricDelta();
  for (const key of PLANET_CORE_METRIC_KEYS) {
    next[key] = Math.max(0, Math.min(100, Math.round(gauge[key] + delta[key])));
  }
  return next;
}

export type { PlanetCoreMetricKey };
