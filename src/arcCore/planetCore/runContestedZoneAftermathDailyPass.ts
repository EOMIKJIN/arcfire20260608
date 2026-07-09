// ============================================================
// 분쟁지역(접전지) — 전쟁 여파 복합 스탯 수렴 · 일 1회 ArcCore 배치
// 저해: 인구·환경·경제(자원) · 이익: 방어·기술·전쟁경제(자원)
// ============================================================

import {
  planetCoreRuntimeToGaugeView,
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import { resolveCoreOpenGameplayPlanetRef } from '../../world/coreOpenGameplayPlanets';
import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import {
  listContestedZoneStatAftermathPlanetIds,
  resolveContestedZoneAftermathGlobalPolicy,
  resolveContestedZoneStatAftermathOffsets,
} from '../balance/contestedZoneAftermathPolicy';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import {
  isPlanetCoreGaugeIntentBatchActive,
  pushPlanetCoreGaugeIntent,
} from './planetCoreGaugeIntent';
import { computeNonContestedGalaxyGaugeReference } from './computeNonContestedGalaxyGaugeReference';
import type { ContestedZoneAftermathDetail } from '../../store/planetCoreMetricTypes';

export type ContestedZoneAftermathDailyPassResult = {
  ran: boolean;
  planetsProcessed: number;
  galaxyReferenceSampleCount: number;
};

const GAUGE_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;

function clampGauge(g: PlanetCoreGaugeView): PlanetCoreGaugeView {
  const next = { ...g };
  for (const k of GAUGE_KEYS) {
    next[k] = Math.max(0, Math.min(100, Math.round(next[k])));
  }
  return next;
}

function csvBaselineGauge(planetId: string): PlanetCoreGaugeView | null {
  const ref = resolveCoreOpenGameplayPlanetRef(planetId);
  if (!ref) return null;
  return planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(ref.planet));
}

function computeEquilibriumTarget(
  baseline: PlanetCoreGaugeView,
  offsets: ReturnType<typeof resolveContestedZoneStatAftermathOffsets>,
): PlanetCoreGaugeView {
  if (!offsets) return baseline;
  return clampGauge({
    resource: baseline.resource + offsets.resource,
    population: baseline.population + offsets.population,
    defense: baseline.defense + offsets.defense,
    technology: baseline.technology + offsets.technology,
    environment: baseline.environment + offsets.environment,
  });
}

function driftTowardTarget(
  current: PlanetCoreGaugeView,
  target: PlanetCoreGaugeView,
  rate: number,
  maxGain: number,
  maxDrop: number,
): PlanetCoreGaugeView {
  const next = { ...current };
  for (const k of GAUGE_KEYS) {
    const raw = (target[k] - current[k]) * rate;
    const clamped = Math.max(-maxDrop, Math.min(maxGain, raw));
    next[k] = current[k] + clamped;
  }
  return clampGauge(next);
}

/**
 * 일 1회 — energy/environment 직후 · stat equilibrium 직전.
 * CSV 시드 + 분쟁 여파 offset 목표로 arc_core intent 누적.
 */
export function runContestedZoneAftermathDailyPass(): ContestedZoneAftermathDailyPassResult {
  const policy = resolveContestedZoneAftermathGlobalPolicy();
  const empty: ContestedZoneAftermathDailyPassResult = {
    ran: false,
    planetsProcessed: 0,
    galaxyReferenceSampleCount: 0,
  };
  if (!policy.enabled) return empty;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const galaxyRef = policy.galaxyReferenceEnabled
    ? computeNonContestedGalaxyGaugeReference()
    : { gauge: { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 }, sampleCount: 0 };

  const kstDayKey = planetAttackKstDayKey();
  let planetsProcessed = 0;

  const contestedIds = listContestedZoneStatAftermathPlanetIds().filter(
    (planetId) => isPlanetContestedZone(planetId),
  );

  for (const planetId of contestedIds) {
    const offsets = resolveContestedZoneStatAftermathOffsets(planetId);
    if (!offsets) continue;

    const baseline = csvBaselineGauge(planetId);
    if (!baseline) continue;

    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;

    const before = planetCoreRuntimeToGaugeView(runtime);
    const target = computeEquilibriumTarget(baseline, offsets);
    const after = driftTowardTarget(
      before,
      target,
      policy.driftRatePerDay,
      policy.maxDailyStatGainPerMetric,
      policy.maxDailyStatDropPerMetric,
    );

    const changed = GAUGE_KEYS.some((k) => after[k] !== before[k]);
    if (!changed) continue;

    const appliedDelta: ContestedZoneAftermathDetail['appliedDelta'] = {};
    for (const k of GAUGE_KEYS) {
      const d = after[k] - before[k];
      if (d !== 0) appliedDelta[k] = d;
    }

    const gapVsGalaxyAvg: Partial<PlanetCoreGaugeView> = {};
    if (policy.galaxyReferenceEnabled && galaxyRef.sampleCount > 0) {
      for (const k of GAUGE_KEYS) {
        gapVsGalaxyAvg[k] = after[k] - galaxyRef.gauge[k];
      }
    }

    const baselinePgp = calculatePlanetPgpFromStats(baseline);
    const afterPgp = calculatePlanetPgpFromStats(after);
    const aftermathDetail: ContestedZoneAftermathDetail = {
      version: 1,
      kstDayKey,
      galaxyAvgGauge: galaxyRef.gauge,
      galaxySampleCount: galaxyRef.sampleCount,
      csvBaselineGauge: baseline,
      equilibriumTarget: target,
      appliedDelta,
      gapVsGalaxyAvg,
      netPgpDeltaVsCsvBaseline: afterPgp - baselinePgp,
      updatedAtMs: Date.now(),
    };

    if (isPlanetCoreGaugeIntentBatchActive()) {
      pushPlanetCoreGaugeIntent(planetId, appliedDelta, 'arc_core');
      coreStore.patchPlanetCore(planetId, {
        detail: {
          ...runtime.detail,
          contestedAftermath: aftermathDetail,
        },
      });
    } else {
      coreStore.patchPlanetCore(planetId, {
        ...after,
        detail: {
          ...runtime.detail,
          contestedAftermath: aftermathDetail,
        },
      });
    }

    planetsProcessed += 1;
  }

  return {
    ran: planetsProcessed > 0,
    planetsProcessed,
    galaxyReferenceSampleCount: galaxyRef.sampleCount,
  };
}
