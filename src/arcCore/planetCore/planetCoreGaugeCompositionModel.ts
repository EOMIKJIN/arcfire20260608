// ============================================================
// gauge composition — genesis base · headroom · pct cap apply
// ============================================================

import type { PlanetCoreGaugeCompositionDetail, PlanetCoreStatKey } from '../../store/planetCoreMetricTypes';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { resolvePlanetGenesisCoreGauge } from '../planetResource/planetResourceEcosystemPolicy';
import {
  resolvePlanetDevelopmentStatWeights,
  sumPlanetDevelopmentStatWeightTotal,
} from './computePlanetDevelopmentStatTargets';
import { resolvePlanetCoreGaugeCompositionPolicy } from '../balance/planetCoreGaugeCompositionPolicy';
import { roundPlanetCoreStatDeltaTenth } from './planetCoreStatOpsTrend';

export const PLANET_CORE_GAUGE_KEYS: readonly PlanetCoreStatKey[] = [
  'resource',
  'population',
  'defense',
  'technology',
  'environment',
];

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function gaugeFromGenesis(planetId: string): PlanetCoreGaugeView {
  return resolvePlanetGenesisCoreGauge(planetId);
}

function zeroGauge(): PlanetCoreGaugeView {
  return { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 };
}

/** 저장 composition 없을 때 genesis + 현재 gauge로 초기 분해 */
export function resolveInitialGaugeComposition(
  planetId: string,
  current: PlanetCoreGaugeView,
): PlanetCoreGaugeCompositionDetail {
  const base = gaugeFromGenesis(planetId);
  const share: PlanetCoreGaugeView = zeroGauge();
  for (const k of PLANET_CORE_GAUGE_KEYS) {
    share[k] = clamp100(Math.max(0, current[k] - base[k]));
  }
  return {
    version: 1,
    arcCoreBase: { ...base },
    playerDevShare: { ...share },
  };
}

function capSignedDelta(
  current: number,
  rawDelta: number,
  maxPct: number,
  minAbs: number,
): number {
  if (rawDelta === 0) return 0;
  const cap = Math.max(minAbs, (Math.abs(current) * maxPct) / 100);
  return Math.max(-cap, Math.min(cap, rawDelta));
}

export type ApplyGaugeCompositionInput = {
  planetId: string;
  current: PlanetCoreGaugeView;
  composition: PlanetCoreGaugeCompositionDetail | undefined;
  arcIntent: PlanetCoreGaugeView;
  devIntent: PlanetCoreGaugeView;
  kstDayKey: string;
};

export type ApplyGaugeCompositionResult = {
  gauge: PlanetCoreGaugeView;
  composition: PlanetCoreGaugeCompositionDetail;
  changed: boolean;
};

/** ArcCore + player dev intent 합산 → pct cap → base/share/gauge 동기 */
export function applyPlanetCoreGaugeComposition(input: ApplyGaugeCompositionInput): ApplyGaugeCompositionResult {
  const policy = resolvePlanetCoreGaugeCompositionPolicy();
  const maxPct = policy.maxDailyChangePctPerMetric;
  const minAbs = policy.minDailyChangeAbsPerMetric;

  const composition = input.composition ?? resolveInitialGaugeComposition(input.planetId, input.current);
  let base: PlanetCoreGaugeView = { ...composition.arcCoreBase };
  let share: PlanetCoreGaugeView = { ...composition.playerDevShare };

  const devWeightTotal = sumPlanetDevelopmentStatWeightTotal(
    resolvePlanetDevelopmentStatWeights(input.planetId),
  );

  const nextGauge: PlanetCoreGaugeView = { ...input.current };
  let changed = false;

  for (const k of PLANET_CORE_GAUGE_KEYS) {
    const cur = input.current[k];
    const rawArc = input.arcIntent[k] ?? 0;
    const rawDev = policy.playerDevIntentEnabled ? (input.devIntent[k] ?? 0) : 0;
    const rawTotal = rawArc + rawDev;
    if (rawTotal === 0) continue;

    const applied = roundPlanetCoreStatDeltaTenth(
      capSignedDelta(cur, rawTotal, maxPct, minAbs),
    );
    if (applied === 0) continue;

    let toDev = 0;
    if (devWeightTotal > 0 && policy.playerDevIntentEnabled && Math.abs(rawDev) > 0) {
      const mag = Math.abs(rawArc) + Math.abs(rawDev);
      toDev = roundPlanetCoreStatDeltaTenth(applied * (Math.abs(rawDev) / mag));
    }
    const toArc = roundPlanetCoreStatDeltaTenth(applied - toDev);

    base[k] = clamp100(base[k] + toArc);
    const headroom = Math.max(0, 100 - base[k]);
    share[k] = clamp100(Math.min(headroom, share[k] + toDev));
    nextGauge[k] = clamp100(base[k] + share[k]);
    if (nextGauge[k] !== cur) changed = true;
  }

  return {
    gauge: nextGauge,
    composition: {
      version: 1,
      arcCoreBase: { ...base },
      playerDevShare: { ...share },
      lastAppliedKstDayKey: input.kstDayKey,
    },
    changed,
  };
}

export function genesisGaugeToRuntimeSeed(planetId: string): PlanetCoreGaugeView {
  return gaugeFromGenesis(planetId);
}
