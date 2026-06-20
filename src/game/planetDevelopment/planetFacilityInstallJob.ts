// ============================================================
// v2.0 §8 — 최초 건설(installDurationSec) · upgradeJob 재사용
// ============================================================

import { resolvePlanetFacilityInstallDurationSec } from '../../arcCore/balance/facilityUpgradeDurationPolicy';
import type {
  PlanetDefenseSatelliteUpgradeJob,
  PlanetFacilityDurationTier,
} from '../../store/planetCoreMetricTypes';
export function resolveFacilityInstallDurationSec(facilityType: string): number {
  return resolvePlanetFacilityInstallDurationSec(facilityType);
}

export function resolveJobProgressPct(
  job: PlanetDefenseSatelliteUpgradeJob | null | undefined,
  nowMs = Date.now(),
): number {
  if (!job) return 0;
  const total = job.completeAtMs - job.startedAtMs;
  if (total <= 0) return 100;
  const elapsed = nowMs - job.startedAtMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export function isFacilityInstallJob(detail: {
  installed: boolean;
  upgradeJob?: PlanetDefenseSatelliteUpgradeJob | null;
}): boolean {
  return !detail.installed && !!detail.upgradeJob && detail.upgradeJob.targetLevel === 1;
}

export function buildInstallUpgradeJob(
  durationSec: number,
  nowMs = Date.now(),
  durationTier: PlanetFacilityDurationTier = 'standard',
): PlanetDefenseSatelliteUpgradeJob {
  return {
    targetLevel: 1,
    startedAtMs: nowMs,
    completeAtMs: nowMs + Math.max(0, durationSec) * 1000,
    durationTier,
  };
}

export function buildUpgradeJob(
  targetLevel: number,
  durationSec: number,
  nowMs = Date.now(),
  durationTier: PlanetFacilityDurationTier = 'standard',
): PlanetDefenseSatelliteUpgradeJob {
  return {
    targetLevel,
    startedAtMs: nowMs,
    completeAtMs: nowMs + Math.max(0, durationSec) * 1000,
    durationTier,
  };
}
