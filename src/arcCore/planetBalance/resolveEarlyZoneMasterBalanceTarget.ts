// ============================================================
// 초반 zone — zone 목표와 CSV 시드 블렌드 + 일일 당김 완화
// ============================================================

import type { Planet } from '../../types';
import {
  planetCsvBaselineToRuntime,
  planetCoreRuntimeToGaugeView,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import {
  resolveEarlyZoneBaselineBlendWeight,
  resolveEarlyZoneGaugeFloorPct,
  resolveMasterBalanceMaxDeltaForZone,
} from '../balance/planetMasterBalanceEarlyZonePolicy';
import { nudgeGaugeTowardTarget } from './deriveMasterBalanceCoreTargets';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

const GAUGE_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;

function blendGaugeViews(
  csvBaseline: PlanetCoreGaugeView,
  zoneTarget: PlanetCoreGaugeView,
  baselineWeight: number,
): PlanetCoreGaugeView {
  const w = Math.max(0, Math.min(1, baselineWeight));
  const out: PlanetCoreGaugeView = { ...zoneTarget };
  for (const key of GAUGE_KEYS) {
    out[key] = clamp100(csvBaseline[key] * w + zoneTarget[key] * (1 - w));
  }
  return out;
}

export type EarlyZoneMasterBalanceAdjustResult = {
  target: PlanetCoreGaugeView;
  maxDelta: number;
  gaugeFloorPct: number | null;
};

/** zone·무역허브 여부에 따라 유효 목표·일일 maxDelta·하한 산출 */
export function resolveEarlyZoneMasterBalanceAdjust(
  planet: Planet,
  zoneIndex: number,
  zoneTarget: PlanetCoreGaugeView,
): EarlyZoneMasterBalanceAdjustResult {
  const csvBaseline = planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(planet));
  const isTradeHub = Boolean(planet.hasTradePort);
  const baselineWeight = resolveEarlyZoneBaselineBlendWeight(zoneIndex, isTradeHub);

  if (baselineWeight == null) {
    return {
      target: zoneTarget,
      maxDelta: resolveMasterBalanceMaxDeltaForZone(zoneIndex),
      gaugeFloorPct: null,
    };
  }

  return {
    target: blendGaugeViews(csvBaseline, zoneTarget, baselineWeight),
    maxDelta: resolveMasterBalanceMaxDeltaForZone(zoneIndex),
    gaugeFloorPct: resolveEarlyZoneGaugeFloorPct(zoneIndex),
  };
}

export function nudgeGaugeTowardTargetWithOptionalFloor(
  current: PlanetCoreGaugeView,
  target: PlanetCoreGaugeView,
  maxDelta: number,
  gaugeFloorPct: number | null,
): PlanetCoreGaugeView {
  const nudged = nudgeGaugeTowardTarget(current, target, maxDelta);
  if (gaugeFloorPct == null || gaugeFloorPct <= 0) return nudged;
  const floor = clamp100(gaugeFloorPct);
  const out = { ...nudged };
  for (const key of GAUGE_KEYS) {
    out[key] = clamp100(Math.max(floor, out[key]));
  }
  return out;
}
