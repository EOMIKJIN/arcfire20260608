import { PlanetAttackCoreDamage_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { PlanetCoreMetricDelta, PlanetCoreMetricKey } from './planetAttackKind';
import { PLANET_CORE_METRIC_KEYS, zeroPlanetCoreMetricDelta } from './planetAttackKind';

export type PlanetAttackCoreDamagePolicyRow = {
  attackKind: string;
  delta: PlanetCoreMetricDelta;
  dailyEventCap: number;
  enabled: boolean;
  /** 정책 delta에 곱하는 미세 반영 배율(0..1, 기본 1) */
  impactScale: number;
  /** 지표별 impact_scale 오버라이드(미설정 시 impactScale) */
  metricImpactScale: Partial<Record<PlanetCoreMetricKey, number>>;
  notesKo: string;
};

function parseFloatField(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

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

  const impactScale = parseFloatField(String(row.impact_scale ?? '1'), 1);
  const metricImpactScale: Partial<Record<PlanetCoreMetricKey, number>> = {};
  const defenseImpactRaw = String(row.defense_impact_scale ?? '').trim();
  if (defenseImpactRaw !== '') {
    metricImpactScale.defense = parseFloatField(defenseImpactRaw, impactScale);
  }
  const technologyImpactRaw = String(row.technology_impact_scale ?? '').trim();
  if (technologyImpactRaw !== '') {
    metricImpactScale.technology = parseFloatField(technologyImpactRaw, impactScale);
  }

  return {
    attackKind,
    delta,
    dailyEventCap: Math.max(0, parseIntField(String(row.daily_event_cap ?? '0'), 0)),
    enabled: parseBool01(String(row.enabled ?? '0')),
    impactScale,
    metricImpactScale,
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

function remainderToMetricDelta(
  remainder: Partial<Record<PlanetCoreMetricKey, number>> | undefined,
): PlanetCoreMetricDelta {
  const out = zeroPlanetCoreMetricDelta();
  if (!remainder) return out;
  for (const key of PLANET_CORE_METRIC_KEYS) {
    const v = remainder[key];
    out[key] = Number.isFinite(v) ? v! : 0;
  }
  return out;
}

function metricDeltaToRemainder(delta: PlanetCoreMetricDelta): Partial<Record<PlanetCoreMetricKey, number>> {
  const out: Partial<Record<PlanetCoreMetricKey, number>> = {};
  for (const key of PLANET_CORE_METRIC_KEYS) {
    if (delta[key] !== 0) out[key] = delta[key];
  }
  return out;
}

/**
 * impact_scale·intensityMul로 미세 Δ를 누적하고, 정수 게이지 변화만 반환한다.
 */
export function computeFractionalPlanetAttackAppliedDelta(
  current: PlanetCoreMetricDelta,
  rawDelta: PlanetCoreMetricDelta,
  impactScale: number,
  intensityMul: number,
  remainderIn: Partial<Record<PlanetCoreMetricKey, number>> | undefined,
  metricImpactScale?: Partial<Record<PlanetCoreMetricKey, number>>,
): {
  applied: PlanetCoreMetricDelta;
  remainderOut: Partial<Record<PlanetCoreMetricKey, number>>;
} {
  const defaultScale = Number.isFinite(impactScale) && impactScale >= 0 ? impactScale : 1;
  const intensity = Number.isFinite(intensityMul) && intensityMul > 0 ? intensityMul : 1;
  const acc = remainderToMetricDelta(remainderIn);
  const applied = zeroPlanetCoreMetricDelta();

  for (const key of PLANET_CORE_METRIC_KEYS) {
    const base = rawDelta[key];
    if (base === 0) continue;
    const metricScale = metricImpactScale?.[key] ?? defaultScale;
    const scale =
      (Number.isFinite(metricScale) && metricScale >= 0 ? metricScale : defaultScale) * intensity;
    acc[key] += base * scale;
    let deltaApplied = 0;
    if (base < 0) {
      while (acc[key] <= -1) {
        deltaApplied -= 1;
        acc[key] += 1;
      }
    } else {
      while (acc[key] >= 1) {
        deltaApplied += 1;
        acc[key] -= 1;
      }
    }
    if (deltaApplied === 0) {
      applied[key] = 0;
      continue;
    }
    const before = Math.max(0, Math.min(100, Math.round(current[key])));
    const after = Math.max(0, Math.min(100, before + deltaApplied));
    applied[key] = after - before;
  }

  return { applied, remainderOut: metricDeltaToRemainder(acc) };
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
