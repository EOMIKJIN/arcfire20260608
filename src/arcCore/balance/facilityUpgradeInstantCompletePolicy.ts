// ============================================================
// v3.1 BM — 행성 시설 즉시완료 크레딧 (시간 비례 + 비용 비율 하한 + 잔여시간 prorate)
// tables/balance/facility_upgrade_duration_global.csv
// tables/balance/facility_upgrade_instant_complete_tier.csv
// ============================================================

import {
  FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV,
  FacilityUpgradeDurationGlobal_FROM_BALANCE_CSV,
  FacilityUpgradeInstantCompleteTier_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import type { PlanetDefenseSatelliteUpgradeJob, PlanetFacilityDurationTier } from '../../store/planetCoreMetricTypes';
import { resolveActivePlanetFacilityDurationTier } from './facilityUpgradeDurationPolicy';

export type PlanetFacilityInstantCompleteKind = 'install' | 'upgrade';

export type PlanetFacilityFullInstantCompleteInput = {
  facilityType: string;
  kind: PlanetFacilityInstantCompleteKind;
  targetLevel: number;
  durationSec: number;
  baseCostCredits: number;
  durationTier?: PlanetFacilityDurationTier;
};

type InstantGlobalBm = {
  costPerHourCredits: number;
  installInstantCostRatio: number;
  upgradeInstantCostRatio: number;
  instantRemainFloorPct: number;
  /** (baseCost + instant) / baseCost 하한 — 업계 BM 3~5× 프리미엄 */
  premiumTotalMin: number;
  /** (baseCost + instant) / baseCost 상한 */
  premiumTotalMax: number;
};

type InstantTierRow = {
  durationTier: PlanetFacilityDurationTier;
  targetLevel: number;
  perHourMultiplier: number;
  minCredits: number;
};

let cachedBm: InstantGlobalBm | null = null;
let cachedTierRows: InstantTierRow[] | null = null;
let cachedFacilityInstantMul: Map<string, number> | null = null;

function parseTier(raw: string | undefined): PlanetFacilityDurationTier {
  return String(raw ?? '').trim().toLowerCase() === 'epic' ? 'epic' : 'standard';
}

function readGlobalMap(): Map<string, { num: number; str: string }> {
  const map = new Map<string, { num: number; str: string }>();
  for (const row of FacilityUpgradeDurationGlobal_FROM_BALANCE_CSV) {
    map.set(String(row.key ?? ''), {
      num: Number(row.value_num),
      str: String(row.value_str ?? ''),
    });
  }
  return map;
}

function readNum(map: Map<string, { num: number; str: string }>, key: string, fallback: number): number {
  const v = map.get(key)?.num;
  if (v === undefined || !Number.isFinite(v)) return fallback;
  return v;
}

export function getPlanetFacilityInstantCompleteBmGlobal(): InstantGlobalBm {
  if (cachedBm) return cachedBm;
  const map = readGlobalMap();
  const premiumTotalMin = Math.max(1, readNum(map, 'instant_premium_total_min', 3));
  const premiumTotalMax = Math.max(premiumTotalMin, readNum(map, 'instant_premium_total_max', 5));
  cachedBm = {
    costPerHourCredits: Math.max(0, Math.floor(readNum(map, 'instant_complete_cost_per_hour_credits', 0))),
    installInstantCostRatio: Math.max(0, readNum(map, 'install_instant_cost_ratio', 0.5)),
    upgradeInstantCostRatio: Math.max(0, readNum(map, 'upgrade_instant_cost_ratio', 0.4)),
    instantRemainFloorPct: Math.min(1, Math.max(0, readNum(map, 'instant_remain_floor_pct', 0.05))),
    premiumTotalMin,
    premiumTotalMax,
  };
  return cachedBm;
}

export function isPlanetFacilityInstantCompleteBmEnabled(): boolean {
  return getPlanetFacilityInstantCompleteBmGlobal().costPerHourCredits > 0;
}

function listInstantTierRows(): InstantTierRow[] {
  if (cachedTierRows) return cachedTierRows;
  cachedTierRows = FacilityUpgradeInstantCompleteTier_FROM_BALANCE_CSV.map((raw) => ({
    durationTier: parseTier(raw.duration_tier),
    targetLevel: Math.max(1, Math.floor(Number(raw.target_level) || 1)),
    perHourMultiplier: Math.max(0.01, Number(raw.per_hour_multiplier) || 1),
    minCredits: Math.max(0, Math.floor(Number(raw.min_credits) || 0)),
  }));
  return cachedTierRows;
}

function getInstantTierRow(tier: PlanetFacilityDurationTier, targetLevel: number): InstantTierRow | null {
  return listInstantTierRows().find((r) => r.durationTier === tier && r.targetLevel === targetLevel) ?? null;
}

function getFacilityInstantCompleteMul(facilityType: string): number {
  if (!cachedFacilityInstantMul) {
    cachedFacilityInstantMul = new Map(
      FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV.map((raw) => {
        const row = raw as Record<string, string>;
        return [
          String(row.facility_type ?? '').trim(),
          Math.max(0.01, Number(row.instant_complete_mul ?? row.upgrade_duration_mul) || 1),
        ] as const;
      }),
    );
  }
  return cachedFacilityInstantMul.get(facilityType) ?? 1;
}

function roundCredits(n: number): number {
  return Math.max(0, Math.ceil(n));
}

/** 전체 구간 즉시완료 — max(티어 min, 시간곡선, install/upgradeCost×ratio) */
export function resolvePlanetFacilityFullInstantCompleteCredits(input: PlanetFacilityFullInstantCompleteInput): number {
  const bm = getPlanetFacilityInstantCompleteBmGlobal();
  if (bm.costPerHourCredits <= 0 || input.durationSec <= 0) return 0;

  const tier = input.durationTier ?? resolveActivePlanetFacilityDurationTier();
  const tierRow = getInstantTierRow(tier, Math.max(1, Math.floor(input.targetLevel)));
  if (!tierRow) return 0;

  const hours = input.durationSec / 3600;
  const timeBased = roundCredits(
    hours * bm.costPerHourCredits * tierRow.perHourMultiplier * getFacilityInstantCompleteMul(input.facilityType),
  );
  const ratio = input.kind === 'install' ? bm.installInstantCostRatio : bm.upgradeInstantCostRatio;
  const ratioBased = roundCredits(Math.max(0, input.baseCostCredits) * ratio);

  let instant = Math.max(tierRow.minCredits, timeBased, ratioBased);
  const baseCost = Math.max(0, input.baseCostCredits);
  if (baseCost > 0 && bm.premiumTotalMin > 1) {
    const minInstant = roundCredits(baseCost * (bm.premiumTotalMin - 1));
    const maxInstant =
      bm.premiumTotalMax > bm.premiumTotalMin
        ? roundCredits(baseCost * (bm.premiumTotalMax - 1))
        : minInstant;
    instant = Math.min(maxInstant, Math.max(minInstant, instant));
  }
  return instant;
}

/** 진행 중 job — 잔여시간 비례, full×floorPct 하한 */
export function resolvePlanetFacilityProratedInstantCompleteCredits(
  job: PlanetDefenseSatelliteUpgradeJob,
  fullInstantCredits: number,
  nowMs = Date.now(),
): number {
  if (fullInstantCredits <= 0) return 0;
  const totalMs = job.completeAtMs - job.startedAtMs;
  if (totalMs <= 0) return fullInstantCredits;

  const bm = getPlanetFacilityInstantCompleteBmGlobal();
  const remainingMs = Math.max(0, job.completeAtMs - nowMs);
  const floorCredits = roundCredits(fullInstantCredits * bm.instantRemainFloorPct);
  const prorated = roundCredits(fullInstantCredits * (remainingMs / totalMs));
  return Math.max(floorCredits, prorated);
}

export type PlanetFacilityInstantCompleteQuoteInput = PlanetFacilityFullInstantCompleteInput & {
  job?: PlanetDefenseSatelliteUpgradeJob | null;
  nowMs?: number;
};

/** UI·과금 공통 — job 있으면 prorate, 없으면 full */
export function resolvePlanetFacilityInstantCompleteCreditsQuote(input: PlanetFacilityInstantCompleteQuoteInput): number {
  const durationSec = input.job
    ? Math.max(1, Math.floor((input.job.completeAtMs - input.job.startedAtMs) / 1000))
    : input.durationSec;
  const full = resolvePlanetFacilityFullInstantCompleteCredits({
    ...input,
    durationSec,
    durationTier: input.job?.durationTier ?? input.durationTier,
  });
  if (!input.job) return full;
  return resolvePlanetFacilityProratedInstantCompleteCredits(input.job, full, input.nowMs);
}

export function resolveLegacyInstantCompleteCreditsFromCsvValue(csvInstantCredits: number | null | undefined): number {
  return Math.max(0, Math.floor(Number(csvInstantCredits) || 0));
}
