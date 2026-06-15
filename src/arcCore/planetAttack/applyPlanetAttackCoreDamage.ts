// ============================================================
// 행성 공격 요소 → 5대 스탯(R/P/D/T/E) 피해 적용 파이프라인
// - 정본: `planet_attack_core_damage.csv` (Table-First)
// - 런타임 반영: `planetCoreRuntimeStore.patchPlanetCore` only
// - 일일 상한: detail.attackDamage.daily (KST)
// ============================================================

import {
  usePlanetCoreRuntimeStore,
  planetCoreRuntimeToGaugeView,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import type { PlanetAttackDamageDetail, PlanetAttackLastEvent } from '../../store/planetCoreMetricTypes';
import type { PlanetCoreMetricDelta } from './planetAttackKind';
import { PLANET_CORE_METRIC_KEYS, zeroPlanetCoreMetricDelta } from './planetAttackKind';
import { planetAttackKstDayKey } from './planetAttackKstDayKey';
import {
  applyDeltaToGauge,
  computePlanetAttackAppliedDelta,
  getPlanetAttackCoreDamagePolicy,
  scalePlanetCoreMetricDelta,
} from './planetAttackCoreDamagePolicy';
import { recordPlanetEconomyAttackSignal } from '../economy/planetEconomyFabric';

const MAX_LAST_EVENTS = 8;

export type ApplyPlanetAttackCoreDamageInput = {
  planetId: string;
  attackKind: string;
  /** 드론 id 등 — 중복 적용 방지·로그용 */
  sourceId?: string;
  /** 정책 delta 배율(기본 1) */
  intensityMul?: number;
  atMs?: number;
};

export type ApplyPlanetAttackCoreDamageResult =
  | {
      ok: true;
      applied: PlanetCoreMetricDelta;
      after: PlanetCoreGaugeView;
    }
  | {
      ok: false;
      reason: 'not_hydrated' | 'unknown_planet' | 'no_policy' | 'disabled' | 'daily_cap';
    };

function gaugeToMetricDelta(gauge: PlanetCoreGaugeView): PlanetCoreMetricDelta {
  return {
    resource: gauge.resource,
    population: gauge.population,
    defense: gauge.defense,
    technology: gauge.technology,
    environment: gauge.environment,
  };
}

function emptyAttackDamageDetail(kstDayKey: string): PlanetAttackDamageDetail {
  return {
    version: 1,
    daily: { kstDayKey, byKind: {} },
    lastEvents: [],
    totalEvents: 0,
  };
}

function resolveAttackDamageDetail(
  prev: PlanetAttackDamageDetail | undefined,
  kstDayKey: string,
): PlanetAttackDamageDetail {
  if (!prev || prev.version !== 1) return emptyAttackDamageDetail(kstDayKey);
  if (prev.daily.kstDayKey !== kstDayKey) {
    return {
      ...prev,
      daily: { kstDayKey, byKind: {} },
    };
  }
  return prev;
}

function bumpDailyCount(detail: PlanetAttackDamageDetail, attackKind: string): PlanetAttackDamageDetail {
  const count = detail.daily.byKind[attackKind] ?? 0;
  return {
    ...detail,
    daily: {
      ...detail.daily,
      byKind: { ...detail.daily.byKind, [attackKind]: count + 1 },
    },
  };
}

function appendLastEvent(
  detail: PlanetAttackDamageDetail,
  event: PlanetAttackLastEvent,
): PlanetAttackDamageDetail {
  const lastEvents = [event, ...detail.lastEvents].slice(0, MAX_LAST_EVENTS);
  return {
    ...detail,
    lastEvents,
    totalEvents: detail.totalEvents + 1,
  };
}

/**
 * 공격 요소 1회를 행성 5대 스탯에 반영한다.
 * 아크코어 서브코어·전투 종료 훅 등에서 호출 — UI 직접 패치 금지.
 */
export function applyPlanetAttackCoreDamage(
  input: ApplyPlanetAttackCoreDamageInput,
): ApplyPlanetAttackCoreDamageResult {
  const { planetId, attackKind, sourceId, intensityMul = 1, atMs = Date.now() } = input;
  if (!planetId) return { ok: false, reason: 'unknown_planet' };

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return { ok: false, reason: 'not_hydrated' };

  const policy = getPlanetAttackCoreDamagePolicy(attackKind);
  if (!policy) return { ok: false, reason: 'no_policy' };
  if (!policy.enabled) return { ok: false, reason: 'disabled' };

  const prevRuntime = coreStore.getPlanetCoreRuntime(planetId);
  if (!prevRuntime) return { ok: false, reason: 'unknown_planet' };

  const kstDayKey = planetAttackKstDayKey(atMs);
  let attackDetail = resolveAttackDamageDetail(prevRuntime.detail?.attackDamage, kstDayKey);
  const todayCount = attackDetail.daily.byKind[attackKind] ?? 0;
  if (policy.dailyEventCap > 0 && todayCount >= policy.dailyEventCap) {
    return { ok: false, reason: 'daily_cap' };
  }

  const currentGauge = planetCoreRuntimeToGaugeView(prevRuntime);
  const currentMetrics = gaugeToMetricDelta(currentGauge);
  const scaledDelta = scalePlanetCoreMetricDelta(policy.delta, intensityMul);
  if (PLANET_CORE_METRIC_KEYS.every((k) => scaledDelta[k] === 0)) {
    return { ok: false, reason: 'disabled' };
  }

  const applied = computePlanetAttackAppliedDelta(currentMetrics, scaledDelta);

  const nextMetrics = applyDeltaToGauge(currentMetrics, applied);
  const after: PlanetCoreGaugeView = {
    resource: nextMetrics.resource,
    population: nextMetrics.population,
    defense: nextMetrics.defense,
    technology: nextMetrics.technology,
    environment: nextMetrics.environment,
  };

  attackDetail = bumpDailyCount(attackDetail, attackKind);
  attackDetail = appendLastEvent(attackDetail, {
    attackKind,
    atMs,
    sourceId,
    applied: {
      resource: applied.resource,
      population: applied.population,
      defense: applied.defense,
      technology: applied.technology,
      environment: applied.environment,
    },
  });

  coreStore.patchPlanetCore(planetId, {
    ...after,
    detail: {
      ...prevRuntime.detail,
      attackDamage: attackDetail,
    },
  });

  if (applied.defense < 0 || applied.population < 0) {
    recordPlanetEconomyAttackSignal(planetId, attackKind, {
      defense: applied.defense,
      population: applied.population,
    });
  }

  return { ok: true, applied, after };
}
