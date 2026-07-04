import {
  getPlanetDefenseSatelliteLevelRow,
  getPlanetDefenseSatelliteMaxLevel,
  resolveDefenseSatelliteActiveCountForLevel,
  resolveDefenseSatelliteInstallCostCredits,
  resolveDefenseSatelliteUpgradeCostCredits,
  resolveDefenseSatelliteUpgradeDurationSec,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import {
  finalizePlanetFacilityLevelApplied,
} from '../../game/planetDevelopment/planetFacilityLevelApplied';
import {
  resolvePlanetDevDiscountedCredits,
} from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import {
  buildInstallUpgradeJob,
  buildUpgradeJob,
  isFacilityInstallJob,
  resolveFacilityInstallDurationSec,
  resolveJobProgressPct,
} from '../../game/planetDevelopment/planetFacilityInstallJob';
import { resolveActivePlanetFacilityDurationTier } from '../../arcCore/balance/facilityUpgradeDurationPolicy';
import { resolvePlanetFacilityInstantCompleteCredits } from '../../game/planetDevelopment/planetFacilityInstantCompleteModel';
import { invalidatePlanetMemoCachesForPlanet } from '../../game/planetMemoCache';
import { t } from '../../i18n';
import {
  isPlanetDefenseSatelliteInstalled,
  readDefenseSatelliteDetailFromPlanet,
  writeDefenseSatelliteDetailToPlanet,
} from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import { resolvePlanetFacilityInstallGate } from '../../game/planetDevelopment/planetFacilityInstallGate';
import { ensurePlanetCoreRuntimeForDev } from '../../game/planetDevelopment/planetFacilityModuleRuntime';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetDevActionOpts } from '../../game/planetDevelopment/planetDevelopmentActionOptions';
import { isArcCorePlanetDevAction, resolvePlanetDevFundingSource } from '../../game/planetDevelopment/planetDevelopmentActionOptions';
import {
  refundPlanetDevelopmentCredits,
  resolvePlanetDevFundingBalance,
  spendPlanetDevelopmentCredits,
} from '../../arcCore/planetDevelopment/planetDevelopmentFunding';
import type { PlanetDefenseSatelliteDetail } from '../../store/planetCoreMetricTypes';
import {
  patchPlanetDefenseSatelliteInstanceLevel,
  resolvePlanetDefenseSatelliteLevel,
} from './planetDefenseSatelliteLevel';

export type DefenseSatelliteDevSnapshot = {
  installed: boolean;
  level: number;
  maxLevel: number;
  activeSatelliteCount: number;
  upgradeJob: PlanetDefenseSatelliteDetail['upgradeJob'];
  upgradeProgressPct: number;
  isUpgrading: boolean;
  isInstalling: boolean;
  installDurationSec: number | null;
  canInstall: boolean;
  canStartUpgrade: boolean;
  canInstantComplete: boolean;
  canInstantUpgradeNext: boolean;
  installCost: number;
  nextUpgradeCost: number | null;
  nextInstantCost: number | null;
  nextUpgradeDurationSec: number | null;
  nextTargetLevel: number | null;
};

function normalizeDefenseSatelliteDetail(
  raw: PlanetDefenseSatelliteDetail | undefined,
): PlanetDefenseSatelliteDetail {
  if (!raw || raw.version !== 1) {
    return { version: 1, installed: false, level: 1, upgradeJob: null };
  }
  const installed = raw.installed === true;
  const level = installed
    ? Math.max(1, Math.floor(Number(raw.level) || 1))
    : Math.max(0, Math.floor(Number(raw.level) || 0));
  const job = raw.upgradeJob;
  const upgradeJob =
    job
    && typeof job.targetLevel === 'number'
    && typeof job.startedAtMs === 'number'
    && typeof job.completeAtMs === 'number'
      ? job
      : null;
  return {
    version: 1,
    installed,
    level,
    upgradeJob,
    updatedAtMs: raw.updatedAtMs,
  };
}

export function readPlanetDefenseSatelliteDetail(
  planetId: string,
): PlanetDefenseSatelliteDetail {
  return normalizeDefenseSatelliteDetail(readDefenseSatelliteDetailFromPlanet(planetId));
}

export { isPlanetDefenseSatelliteInstalled } from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';

function patchDefenseSatelliteDetail(
  planetId: string,
  patch: Partial<PlanetDefenseSatelliteDetail>,
): void {
  const prev = normalizeDefenseSatelliteDetail(readDefenseSatelliteDetailFromPlanet(planetId));
  const next: PlanetDefenseSatelliteDetail = {
    ...prev,
    ...patch,
    version: 1,
    updatedAtMs: Date.now(),
  };
  writeDefenseSatelliteDetailToPlanet(planetId, next);
}

function syncDefenseSatelliteInstances(planetId: string, level: number): void {
  const count = resolveDefenseSatelliteActiveCountForLevel(level);
  for (let i = 1; i <= count; i += 1) {
    patchPlanetDefenseSatelliteInstanceLevel(planetId, String(i), level);
  }
}

function spendDevCredits(amount: number, planetId: string, opts?: PlanetDevActionOpts): boolean {
  return spendPlanetDevelopmentCredits(amount, resolvePlanetDevFundingSource(opts), {
    planetId,
    moduleId: 'defense_satellite',
    note: resolvePlanetDevFundingSource(opts) === 'arc_core_vault' ? 'arc_core_planet_dev' : undefined,
  });
}

function refundDevCredits(amount: number, opts?: PlanetDevActionOpts): void {
  refundPlanetDevelopmentCredits(amount, resolvePlanetDevFundingSource(opts));
}

function resolveGateCredits(opts?: PlanetDevActionOpts): number {
  return resolvePlanetDevFundingBalance(resolvePlanetDevFundingSource(opts));
}

function spendPlayerCredits(amount: number): boolean {
  if (amount <= 0) return true;
  const ok = usePlayerStore.getState().spendCredits(amount);
  if (ok) void usePlayerStore.getState().persist();
  return ok;
}

export function resolveDefenseSatelliteUpgradeProgressPct(
  job: PlanetDefenseSatelliteDetail['upgradeJob'],
  nowMs = Date.now(),
): number {
  if (!job) return 0;
  const total = job.completeAtMs - job.startedAtMs;
  if (total <= 0) return 100;
  const elapsed = nowMs - job.startedAtMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export function tryCompleteDefenseSatelliteUpgrade(planetId: string): boolean {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.upgradeJob) return false;
  const now = Date.now();
  if (now < detail.upgradeJob.completeAtMs) return false;
  if (isFacilityInstallJob(detail)) {
    patchDefenseSatelliteDetail(planetId, {
      installed: true,
      level: 1,
      upgradeJob: null,
    });
    syncDefenseSatelliteInstances(planetId, 1);
    invalidatePlanetMemoCachesForPlanet(planetId);
    finalizePlanetFacilityLevelApplied(planetId, 'defense_satellite', 1);
    return true;
  }
  if (!detail.installed) return false;
  const targetLevel = detail.upgradeJob.targetLevel;
  patchDefenseSatelliteDetail(planetId, {
    level: targetLevel,
    upgradeJob: null,
  });
  syncDefenseSatelliteInstances(planetId, targetLevel);
  invalidatePlanetMemoCachesForPlanet(planetId);
  finalizePlanetFacilityLevelApplied(planetId, 'defense_satellite', targetLevel);
  return true;
}

export function buildDefenseSatelliteDevSnapshot(planetId: string): DefenseSatelliteDevSnapshot {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  const level = detail.installed ? resolvePlanetDefenseSatelliteLevel(planetId) : 0;
  const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
  const isInstalling = isFacilityInstallJob(detail);
  const isUpgrading = detail.installed && Boolean(detail.upgradeJob);
  const installDurationSec = !detail.installed ? resolveFacilityInstallDurationSec('defense_satellite') : null;
  const previewInstallInstant = resolvePlanetDevDiscountedCredits(
    planetId,
    resolvePlanetFacilityInstantCompleteCredits({ facilityType: 'defense_satellite', kind: 'install', currentLevel: 0 }),
  );
  const previewUpgradeInstant = nextTargetLevel != null && !detail.upgradeJob
    ? resolvePlanetDevDiscountedCredits(
      planetId,
      resolvePlanetFacilityInstantCompleteCredits({ facilityType: 'defense_satellite', kind: 'upgrade', currentLevel: level }),
    )
    : null;
  const activeInstantRaw = detail.upgradeJob
    ? resolvePlanetFacilityInstantCompleteCredits({
      facilityType: 'defense_satellite',
      kind: isInstalling ? 'install' : 'upgrade',
      currentLevel: isInstalling ? 0 : level,
      job: detail.upgradeJob,
    })
    : null;
  const activeInstantCost = activeInstantRaw != null
    ? resolvePlanetDevDiscountedCredits(planetId, activeInstantRaw)
    : null;
  const nextUpgradeDurationSec = nextTargetLevel != null
    ? resolveDefenseSatelliteUpgradeDurationSec(level)
    : null;
  const playerCredits = usePlayerStore.getState().player?.credits ?? 0;
  const installCost = resolvePlanetDevDiscountedCredits(planetId, resolveDefenseSatelliteInstallCostCredits());
  const nextUpgradeCost = nextTargetLevel != null
    ? resolvePlanetDevDiscountedCredits(planetId, resolveDefenseSatelliteUpgradeCostCredits(level) ?? 0)
    : null;

  const installGate = !detail.installed
    ? resolvePlanetFacilityInstallGate({
      planetId,
      installed: detail.installed,
      isCsvWorldBaseline: false,
      hasActiveJob: Boolean(detail.upgradeJob),
      playerCredits,
      installCost,
      notEnoughCreditsMessage: t('defenseSatDev.notEnoughCredits'),
    })
    : null;

  const canInstall = installGate?.canInstall ?? false;
  const canStartUpgrade = detail.installed
    && !isUpgrading
    && nextTargetLevel != null
    && nextUpgradeCost != null
    && playerCredits >= nextUpgradeCost;
  const canInstantComplete = Boolean(detail.upgradeJob)
    && activeInstantCost != null
    && playerCredits >= activeInstantCost;
  const instantNextTotal = (nextUpgradeCost ?? 0) + (previewUpgradeInstant ?? 0);
  const canInstantUpgradeNext = detail.installed
    && !isUpgrading
    && nextTargetLevel != null
    && playerCredits >= instantNextTotal;

  return {
    installed: detail.installed,
    level,
    maxLevel,
    activeSatelliteCount: detail.installed ? resolveDefenseSatelliteActiveCountForLevel(level) : 0,
    upgradeJob: detail.upgradeJob ?? null,
    upgradeProgressPct: resolveJobProgressPct(detail.upgradeJob),
    isUpgrading,
    isInstalling,
    installDurationSec,
    canInstall,
    canStartUpgrade,
    canInstantComplete,
    canInstantUpgradeNext,
    installCost,
    nextUpgradeCost,
    nextInstantCost: detail.upgradeJob ? activeInstantCost : (isInstalling ? previewInstallInstant : previewUpgradeInstant),
    nextUpgradeDurationSec,
    nextTargetLevel,
  };
}

export function installPlanetDefenseSatellite(
  planetId: string,
  opts?: PlanetDevActionOpts,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (detail.installed) return { ok: false, reason: t('defenseSatDev.alreadyInstalled') };
  if (detail.upgradeJob) return { ok: false, reason: t('defenseSatDev.upgradeInProgress') };
  const installGate = resolvePlanetFacilityInstallGate({
    planetId,
    installed: detail.installed,
    isCsvWorldBaseline: false,
    hasActiveJob: Boolean(detail.upgradeJob),
    playerCredits: resolveGateCredits(opts),
    installCost: resolvePlanetDevDiscountedCredits(planetId, resolveDefenseSatelliteInstallCostCredits()),
    notEnoughCreditsMessage: t('defenseSatDev.notEnoughCredits'),
  });
  if (installGate.installBlockReason) {
    return { ok: false, reason: installGate.installBlockReason };
  }
  const cost = resolvePlanetDevDiscountedCredits(planetId, resolveDefenseSatelliteInstallCostCredits());
  if (!spendDevCredits(cost, planetId, opts)) return { ok: false, reason: t('defenseSatDev.notEnoughCredits') };
  const durationSec = resolveFacilityInstallDurationSec('defense_satellite');
  if (durationSec <= 0) {
    patchDefenseSatelliteDetail(planetId, {
      installed: true,
      level: 1,
      upgradeJob: null,
    });
    syncDefenseSatelliteInstances(planetId, 1);
    invalidatePlanetMemoCachesForPlanet(planetId);
    finalizePlanetFacilityLevelApplied(planetId, 'defense_satellite', 1);
    return { ok: true };
  }
  patchDefenseSatelliteDetail(planetId, {
    installed: false,
    level: 0,
    upgradeJob: buildInstallUpgradeJob(durationSec, Date.now(), resolveActivePlanetFacilityDurationTier()),
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}

function applyDefenseSatelliteLevel(planetId: string, targetLevel: number): void {
  patchDefenseSatelliteDetail(planetId, {
    level: targetLevel,
    upgradeJob: null,
  });
  syncDefenseSatelliteInstances(planetId, targetLevel);
  invalidatePlanetMemoCachesForPlanet(planetId);
  finalizePlanetFacilityLevelApplied(planetId, 'defense_satellite', targetLevel);
}

export function startPlanetDefenseSatelliteUpgrade(
  planetId: string,
  opts?: PlanetDevActionOpts,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.installed) return { ok: false, reason: t('defenseSatDev.installFirst') };
  if (detail.upgradeJob) return { ok: false, reason: t('defenseSatDev.upgradeInProgress') };
  const level = resolvePlanetDefenseSatelliteLevel(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: t('defenseSatDev.maxLevel') };
  const rawCost = resolveDefenseSatelliteUpgradeCostCredits(level);
  if (rawCost == null) return { ok: false, reason: t('defenseSatDev.cannotUpgrade') };
  const cost = resolvePlanetDevDiscountedCredits(planetId, rawCost);
  if (!spendDevCredits(cost, planetId, opts)) return { ok: false, reason: t('defenseSatDev.notEnoughCredits') };
  const durationSec = resolveDefenseSatelliteUpgradeDurationSec(level) ?? 0;
  const targetLevel = level + 1;
  if (durationSec <= 0) {
    applyDefenseSatelliteLevel(planetId, targetLevel);
    return { ok: true };
  }
  patchDefenseSatelliteDetail(planetId, {
    upgradeJob: buildUpgradeJob(
      targetLevel,
      durationSec,
      Date.now(),
      resolveActivePlanetFacilityDurationTier(),
    ),
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}

export function instantCompleteDefenseSatelliteUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.upgradeJob) return { ok: false, reason: t('defenseSatDev.noUpgradeJob') };
  const isInstall = isFacilityInstallJob(detail);
  const level = isInstall ? 0 : resolvePlanetDefenseSatelliteLevel(planetId);
  const rawInstant = resolvePlanetFacilityInstantCompleteCredits({
    facilityType: 'defense_satellite',
    kind: isInstall ? 'install' : 'upgrade',
    currentLevel: level,
    job: detail.upgradeJob,
  });
  if (rawInstant <= 0) return { ok: false, reason: t('defenseSatDev.cannotInstant') };
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, rawInstant);
  if (!spendPlayerCredits(instantCost)) return { ok: false, reason: t('defenseSatDev.notEnoughCredits') };
  if (isInstall) {
    patchDefenseSatelliteDetail(planetId, { installed: true, level: 1, upgradeJob: null });
    syncDefenseSatelliteInstances(planetId, 1);
    invalidatePlanetMemoCachesForPlanet(planetId);
    finalizePlanetFacilityLevelApplied(planetId, 'defense_satellite', 1);
  } else {
    applyDefenseSatelliteLevel(planetId, detail.upgradeJob.targetLevel);
  }
  return { ok: true };
}

export function instantUpgradeDefenseSatelliteNext(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.installed) return { ok: false, reason: t('defenseSatDev.installFirst') };
  if (detail.upgradeJob) return { ok: false, reason: t('defenseSatDev.upgradeInProgress') };
  const level = resolvePlanetDefenseSatelliteLevel(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: t('defenseSatDev.maxLevel') };
  const baseCost = resolvePlanetDevDiscountedCredits(planetId, resolveDefenseSatelliteUpgradeCostCredits(level) ?? 0);
  const instantRaw = resolvePlanetFacilityInstantCompleteCredits({
    facilityType: 'defense_satellite',
    kind: 'upgrade',
    currentLevel: level,
  });
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, instantRaw);
  if (!spendPlayerCredits(baseCost + instantCost)) {
    return { ok: false, reason: t('defenseSatDev.notEnoughCredits') };
  }
  applyDefenseSatelliteLevel(planetId, level + 1);
  return { ok: true };
}

import { formatPlanetFacilityDurationLabel } from '../../game/planetDevelopment/formatPlanetFacilityDurationLabel';

export function formatDefenseSatelliteDurationLabel(sec: number): string {
  return formatPlanetFacilityDurationLabel(sec);
}

export function getDefenseSatelliteLevelStatRow(level: number) {
  return getPlanetDefenseSatelliteLevelRow(level);
}
