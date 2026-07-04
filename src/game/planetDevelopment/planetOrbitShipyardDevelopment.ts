// ============================================================
// 궤도 조선소(dev_orbit_shipyard) 개발 — 설치·레벨업·builtHullTierKeys
// 방위위성과 동일한 upgradeJob 패턴 · 무역소 listing 필터 연동
// 설치비: planet_development_catalog.csv · 레벨 정책: facility_shipyard_level_policy.csv
// ============================================================

import {
  getFacilityShipyardLevelRow,
  getFacilityShipyardMaxLevel,
  listFacilityShipyardLevelRows,
  resolveShipyardBuiltHullTierKeysForLevel,
  resolveShipyardMineralUpgradeCapForLevel,
  resolveShipyardUpgradeCostCredits,
  resolveShipyardUpgradeDurationSec,
  resolveShipyardUpgradeRequiredPlayerLevel,
} from '../../arcCore/balance/facilityShipyardLevelPolicy';
import { resolvePlanetFacilityInstallGate } from './planetFacilityInstallGate';
import {
  buildInstallUpgradeJob,
  buildUpgradeJob,
  isFacilityInstallJob,
  resolveFacilityInstallDurationSec,
  resolveJobProgressPct,
} from './planetFacilityInstallJob';
import { resolveActivePlanetFacilityDurationTier } from '../../arcCore/balance/facilityUpgradeDurationPolicy';
import { resolvePlanetFacilityInstantCompleteCredits } from './planetFacilityInstantCompleteModel';
import {
  finalizePlanetFacilityLevelApplied,
} from './planetFacilityLevelApplied';
import {
  resolvePlanetDevDiscountedCredits,
  applyPlanetFacilityLevelUpBenefits,
} from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import {
  ensurePlanetCoreRuntimeForDev,
  hasPlanetCoreRuntimeEntry,
  writeFacilityModuleDetail,
} from './planetFacilityModuleRuntime';
import { invalidatePlanetMemoCachesForPlanet } from '../planetMemoCache';
import { t } from '../../i18n';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetDevActionOpts } from './planetDevelopmentActionOptions';
import { isArcCorePlanetDevAction, resolvePlanetDevFundingSource } from './planetDevelopmentActionOptions';
import {
  refundPlanetDevelopmentCredits,
  resolvePlanetDevFundingBalance,
  spendPlanetDevelopmentCredits,
} from '../../arcCore/planetDevelopment/planetDevelopmentFunding';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import {
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  isPlanetOrbitShipyardInstalled,
  readPlanetOrbitShipyardDetail,
} from './planetOrbitShipyardListing';
import {
  isPlanetCsvWorldDevModuleBaseline,
  materializeCsvWorldBaselineDevModule,
  resolveEffectiveFacilityDevView,
} from './planetCsvWorldFacilityBaseline';

export {
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  isPlanetOrbitShipyardInstalled,
  isPlanetTradeShipTabEnabled,
  readPlanetOrbitShipyardDetail,
  resolvePlanetShipyardListingMode,
} from './planetOrbitShipyardListing';
export type { PlanetShipyardListingMode } from './planetOrbitShipyardListing';

export type OrbitShipyardDevSnapshot = {
  installed: boolean;
  level: number;
  maxLevel: number;
  builtHullTierKeys: string[];
  mineralUpgradeCap: number;
  upgradeJob: PlanetFacilityModuleDetail['upgradeJob'];
  upgradeProgressPct: number;
  isUpgrading: boolean;
  isInstalling: boolean;
  installDurationSec: number | null;
  installBlockReason: string | null;
  canInstall: boolean;
  canStartUpgrade: boolean;
  canInstantComplete: boolean;
  canInstantUpgradeNext: boolean;
  installCost: number;
  nextUpgradeCost: number | null;
  nextInstantCost: number | null;
  nextUpgradeDurationSec: number | null;
  nextTargetLevel: number | null;
  isCsvWorldBaseline: boolean;
};

/** 최초 설치 비용 — catalog + 개발 비용 효율 */
export function resolveOrbitShipyardInstallCostCredits(planetId: string): number {
  const base = getPlanetDevelopmentCatalogRow(PLANET_DEV_MODULE_ORBIT_SHIPYARD)?.installCostCredits ?? 0;
  return resolvePlanetDevDiscountedCredits(planetId, base);
}

function patchOrbitShipyardDetail(
  planetId: string,
  patch: Partial<PlanetFacilityModuleDetail>,
): void {
  const prev = readPlanetOrbitShipyardDetail(planetId);
  writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, {
    ...prev,
    ...patch,
    version: 1,
    updatedAtMs: Date.now(),
  });
}

function syncTradeCatalogAfterShipyardChange(planetId: string): void {
  // tradePortCatalogPolicy ↔ tradePortCapitalShipPolicy 순환 방지 — 런타임 require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncTradePortCatalogForPlanet } = require('../../arcCore/balance/tradePortCatalogPolicy') as typeof import('../../arcCore/balance/tradePortCatalogPolicy');
  syncTradePortCatalogForPlanet(planetId);
}

function spendDevCredits(amount: number, planetId: string, opts?: PlanetDevActionOpts): boolean {
  return spendPlanetDevelopmentCredits(amount, resolvePlanetDevFundingSource(opts), {
    planetId,
    moduleId: PLANET_DEV_MODULE_ORBIT_SHIPYARD,
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

export function resolveOrbitShipyardUpgradeProgressPct(
  job: PlanetFacilityModuleDetail['upgradeJob'],
  nowMs = Date.now(),
): number {
  if (!job) return 0;
  const total = job.completeAtMs - job.startedAtMs;
  if (total <= 0) return 100;
  const elapsed = nowMs - job.startedAtMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function applyOrbitShipyardLevel(planetId: string, targetLevel: number): void {
  patchOrbitShipyardDetail(planetId, {
    level: targetLevel,
    builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(targetLevel),
    upgradeJob: null,
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  finalizePlanetFacilityLevelApplied(planetId, 'shipyard', targetLevel);
  syncTradeCatalogAfterShipyardChange(planetId);
}

function completeOrbitShipyardInstall(planetId: string): void {
  patchOrbitShipyardDetail(planetId, {
    installed: true,
    level: 1,
    builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(1),
    upgradeJob: null,
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  finalizePlanetFacilityLevelApplied(planetId, 'shipyard', 1);
  syncTradeCatalogAfterShipyardChange(planetId);
}

export function tryCompleteOrbitShipyardUpgrade(planetId: string): boolean {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.upgradeJob) return false;
  const now = Date.now();
  if (now < detail.upgradeJob.completeAtMs) return false;
  if (isFacilityInstallJob(detail)) {
    completeOrbitShipyardInstall(planetId);
    return true;
  }
  if (!detail.installed) return false;
  applyOrbitShipyardLevel(planetId, detail.upgradeJob.targetLevel);
  return true;
}

export function buildOrbitShipyardDevSnapshot(planetId: string): OrbitShipyardDevSnapshot {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  const effective = resolveEffectiveFacilityDevView(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, detail);
  const maxLevel = getFacilityShipyardMaxLevel();
  const level = effective.effectiveLevel;
  const installed = effective.effectiveInstalled;
  const isCsvWorldBaseline = effective.csvWorldBaselineOnly;
  const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
  const isInstalling = isFacilityInstallJob(detail);
  const isUpgrading = detail.installed && Boolean(detail.upgradeJob);
  const installDurationSec = !installed && !isCsvWorldBaseline
    ? resolveFacilityInstallDurationSec('shipyard')
    : null;
  const previewInstallInstant = resolvePlanetDevDiscountedCredits(
    planetId,
    resolvePlanetFacilityInstantCompleteCredits({ facilityType: 'shipyard', kind: 'install', currentLevel: 0 }),
  );
  const player = usePlayerStore.getState().player;
  const playerCredits = player?.credits ?? 0;
  const playerLevel = player?.level ?? 1;

  const installCost = resolveOrbitShipyardInstallCostCredits(planetId);
  const installGate = !installed && !isCsvWorldBaseline
    ? resolvePlanetFacilityInstallGate({
      planetId,
      installed,
      isCsvWorldBaseline,
      hasActiveJob: Boolean(detail.upgradeJob),
      playerCredits,
      installCost,
      notEnoughCreditsMessage: t('orbitShipyardDev.notEnoughCredits'),
    })
    : null;
  const nextUpgradeCost = nextTargetLevel != null
    ? resolvePlanetDevDiscountedCredits(planetId, resolveShipyardUpgradeCostCredits(level) ?? 0)
    : null;
  const previewUpgradeInstant = nextTargetLevel != null && !detail.upgradeJob
    ? resolvePlanetDevDiscountedCredits(
      planetId,
      resolvePlanetFacilityInstantCompleteCredits({ facilityType: 'shipyard', kind: 'upgrade', currentLevel: level }),
    )
    : null;
  const nextUpgradeDurationSec = nextTargetLevel != null
    ? resolveShipyardUpgradeDurationSec(level)
    : null;
  const requiredPilot = nextTargetLevel != null
    ? resolveShipyardUpgradeRequiredPlayerLevel(level)
    : 0;
  const pilotOk = requiredPilot <= 0 || playerLevel >= requiredPilot;

  const canInstall = installGate?.canInstall ?? false;
  const canStartUpgrade = installed
    && !isUpgrading
    && !isInstalling
    && nextTargetLevel != null
    && nextUpgradeCost != null
    && playerCredits >= nextUpgradeCost
    && pilotOk;
  const activeInstantRaw = detail.upgradeJob
    ? resolvePlanetFacilityInstantCompleteCredits({
      facilityType: 'shipyard',
      kind: isInstalling ? 'install' : 'upgrade',
      currentLevel: isInstalling ? 0 : level,
      job: detail.upgradeJob,
    })
    : null;
  const activeInstantCost = activeInstantRaw != null
    ? resolvePlanetDevDiscountedCredits(planetId, activeInstantRaw)
    : null;
  const canInstantComplete = Boolean(detail.upgradeJob)
    && activeInstantCost != null
    && playerCredits >= activeInstantCost;
  const instantNextTotal = (nextUpgradeCost ?? 0) + (previewUpgradeInstant ?? 0);
  const canInstantUpgradeNext = installed
    && !isUpgrading
    && !isInstalling
    && nextTargetLevel != null
    && playerCredits >= instantNextTotal
    && pilotOk;

  const builtHullTierKeys = installed
    ? (detail.installed
      ? (detail.builtHullTierKeys ?? resolveShipyardBuiltHullTierKeysForLevel(level))
      : resolveShipyardBuiltHullTierKeysForLevel(level))
    : [];

  return {
    installed,
    level,
    maxLevel,
    builtHullTierKeys,
    mineralUpgradeCap: resolveShipyardMineralUpgradeCapForLevel(level),
    upgradeJob: detail.upgradeJob ?? null,
    upgradeProgressPct: resolveJobProgressPct(detail.upgradeJob),
    isUpgrading,
    isInstalling,
    installDurationSec,
    installBlockReason: installGate?.installBlockReason ?? null,
    canInstall,
    canStartUpgrade,
    canInstantComplete,
    canInstantUpgradeNext,
    installCost,
    nextUpgradeCost,
    nextInstantCost: detail.upgradeJob ? activeInstantCost : (isInstalling ? previewInstallInstant : previewUpgradeInstant),
    nextUpgradeDurationSec,
    nextTargetLevel,
    isCsvWorldBaseline,
  };
}

export function installPlanetOrbitShipyard(
  planetId: string,
  opts?: PlanetDevActionOpts,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (isPlanetOrbitShipyardInstalled(planetId) || isPlanetCsvWorldDevModuleBaseline(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD)) {
    return { ok: false, reason: t('orbitShipyardDev.alreadyInstalled') };
  }
  if (detail.upgradeJob) {
    return { ok: false, reason: t('orbitShipyardDev.upgradeInProgress') };
  }
  if (!hasPlanetCoreRuntimeEntry(planetId) && !ensurePlanetCoreRuntimeForDev(planetId)) {
    return { ok: false, reason: t('orbitShipyardDev.notReady') };
  }
  const installGate = resolvePlanetFacilityInstallGate({
    planetId,
    installed: isPlanetOrbitShipyardInstalled(planetId),
    isCsvWorldBaseline: isPlanetCsvWorldDevModuleBaseline(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD),
    hasActiveJob: Boolean(detail.upgradeJob),
    playerCredits: resolveGateCredits(opts),
    installCost: resolveOrbitShipyardInstallCostCredits(planetId),
    notEnoughCreditsMessage: t('orbitShipyardDev.notEnoughCredits'),
  });
  if (installGate.installBlockReason) {
    return { ok: false, reason: installGate.installBlockReason };
  }
  const cost = resolveOrbitShipyardInstallCostCredits(planetId);
  if (!spendDevCredits(cost, planetId, opts)) {
    return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  }
  const durationSec = resolveFacilityInstallDurationSec('shipyard');
  if (durationSec <= 0) {
    const written = writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, {
      version: 1,
      installed: true,
      level: 1,
      builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(1),
      upgradeJob: null,
      updatedAtMs: Date.now(),
    });
    if (!written) {
      refundDevCredits(cost, opts);
      return { ok: false, reason: t('orbitShipyardDev.recordFailed') };
    }
    invalidatePlanetMemoCachesForPlanet(planetId);
    finalizePlanetFacilityLevelApplied(planetId, 'shipyard', 1);
    syncTradeCatalogAfterShipyardChange(planetId);
    return { ok: true };
  }
  const written = writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, {
    version: 1,
    installed: false,
    level: 0,
    upgradeJob: buildInstallUpgradeJob(durationSec, Date.now(), resolveActivePlanetFacilityDurationTier()),
    updatedAtMs: Date.now(),
  });
  if (!written) {
    refundDevCredits(cost, opts);
    return { ok: false, reason: t('orbitShipyardDev.recordFailed') };
  }
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}

export function startPlanetOrbitShipyardUpgrade(
  planetId: string,
  opts?: PlanetDevActionOpts,
): { ok: true } | { ok: false; reason: string } {
  let detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed) {
    if (!isPlanetCsvWorldDevModuleBaseline(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD)) {
      return { ok: false, reason: t('orbitShipyardDev.installFirst') };
    }
    if (!materializeCsvWorldBaselineDevModule(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, detail, {
      builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(1),
    })) {
      return { ok: false, reason: t('orbitShipyardDev.notReady') };
    }
    invalidatePlanetMemoCachesForPlanet(planetId);
    applyPlanetFacilityLevelUpBenefits(planetId, 'shipyard', 1);
    syncTradeCatalogAfterShipyardChange(planetId);
    detail = readPlanetOrbitShipyardDetail(planetId);
  }
  if (detail.upgradeJob) return { ok: false, reason: t('orbitShipyardDev.upgradeInProgress') };
  const level = detail.level;
  const maxLevel = getFacilityShipyardMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: t('orbitShipyardDev.maxLevel') };
  const reqPilot = resolveShipyardUpgradeRequiredPlayerLevel(level);
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  if (!isArcCorePlanetDevAction(opts) && reqPilot > 0 && playerLevel < reqPilot) {
    return { ok: false, reason: t('orbitShipyardDev.pilotLevelRequired', { level: reqPilot }) };
  }
  const rawCost = resolveShipyardUpgradeCostCredits(level);
  if (rawCost == null) return { ok: false, reason: t('orbitShipyardDev.cannotUpgrade') };
  const cost = resolvePlanetDevDiscountedCredits(planetId, rawCost);
  if (!spendDevCredits(cost, planetId, opts)) return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  const durationSec = resolveShipyardUpgradeDurationSec(level) ?? 0;
  const targetLevel = level + 1;
  if (durationSec <= 0) {
    applyOrbitShipyardLevel(planetId, targetLevel);
    return { ok: true };
  }
  patchOrbitShipyardDetail(planetId, {
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

export function instantCompleteOrbitShipyardUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.upgradeJob) return { ok: false, reason: t('orbitShipyardDev.noUpgradeJob') };
  const isInstall = isFacilityInstallJob(detail);
  const rawInstant = resolvePlanetFacilityInstantCompleteCredits({
    facilityType: 'shipyard',
    kind: isInstall ? 'install' : 'upgrade',
    currentLevel: isInstall ? 0 : detail.level,
    job: detail.upgradeJob,
  });
  if (rawInstant <= 0) return { ok: false, reason: t('orbitShipyardDev.cannotInstant') };
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, rawInstant);
  if (!spendPlayerCredits(instantCost)) return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  if (isInstall) {
    completeOrbitShipyardInstall(planetId);
  } else {
    applyOrbitShipyardLevel(planetId, detail.upgradeJob.targetLevel);
  }
  return { ok: true };
}

export function instantUpgradeOrbitShipyardNext(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  let detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed) {
    if (!isPlanetCsvWorldDevModuleBaseline(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD)) {
      return { ok: false, reason: t('orbitShipyardDev.installFirst') };
    }
    if (!materializeCsvWorldBaselineDevModule(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, detail, {
      builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(1),
    })) {
      return { ok: false, reason: t('orbitShipyardDev.notReady') };
    }
    invalidatePlanetMemoCachesForPlanet(planetId);
    applyPlanetFacilityLevelUpBenefits(planetId, 'shipyard', 1);
    syncTradeCatalogAfterShipyardChange(planetId);
    detail = readPlanetOrbitShipyardDetail(planetId);
  }
  if (detail.upgradeJob) return { ok: false, reason: t('orbitShipyardDev.upgradeInProgress') };
  const level = detail.level;
  const maxLevel = getFacilityShipyardMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: t('orbitShipyardDev.maxLevel') };
  const reqPilot = resolveShipyardUpgradeRequiredPlayerLevel(level);
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  if (reqPilot > 0 && playerLevel < reqPilot) {
    return { ok: false, reason: t('orbitShipyardDev.pilotLevelRequired', { level: reqPilot }) };
  }
  const baseCost = resolvePlanetDevDiscountedCredits(planetId, resolveShipyardUpgradeCostCredits(level) ?? 0);
  const instantRaw = resolvePlanetFacilityInstantCompleteCredits({
    facilityType: 'shipyard',
    kind: 'upgrade',
    currentLevel: level,
  });
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, instantRaw);
  if (!spendPlayerCredits(baseCost + instantCost)) {
    return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  }
  applyOrbitShipyardLevel(planetId, level + 1);
  return { ok: true };
}

import { formatPlanetFacilityDurationLabel } from './formatPlanetFacilityDurationLabel';

export function formatOrbitShipyardDurationLabel(sec: number): string {
  return formatPlanetFacilityDurationLabel(sec);
}

export function getOrbitShipyardLevelStatRow(level: number) {
  return getFacilityShipyardLevelRow(level);
}

export { listFacilityShipyardLevelRows };
