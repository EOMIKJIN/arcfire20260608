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
  resolveShipyardInstantUpgradeCostCredits,
  resolveShipyardMineralUpgradeCapForLevel,
  resolveShipyardUpgradeCostCredits,
  resolveShipyardUpgradeDurationSec,
  resolveShipyardUpgradeRequiredPlayerLevel,
} from '../../arcCore/balance/facilityShipyardLevelPolicy';
import {
  applyPlanetFacilityLevelUpBenefits,
  resolvePlanetDevDiscountedCredits,
} from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import {
  hasPlanetCoreRuntimeEntry,
  writeFacilityModuleDetail,
} from './planetFacilityModuleRuntime';
import { invalidatePlanetMemoCachesForPlanet } from '../planetMemoCache';
import { t } from '../../i18n';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import {
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  isPlanetOrbitShipyardInstalled,
  readPlanetOrbitShipyardDetail,
} from './planetOrbitShipyardListing';

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
  applyPlanetFacilityLevelUpBenefits(planetId, 'shipyard', targetLevel);
  syncTradeCatalogAfterShipyardChange(planetId);
}

export function tryCompleteOrbitShipyardUpgrade(planetId: string): boolean {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed || !detail.upgradeJob) return false;
  const now = Date.now();
  if (now < detail.upgradeJob.completeAtMs) return false;
  applyOrbitShipyardLevel(planetId, detail.upgradeJob.targetLevel);
  return true;
}

export function buildOrbitShipyardDevSnapshot(planetId: string): OrbitShipyardDevSnapshot {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  const maxLevel = getFacilityShipyardMaxLevel();
  const level = detail.installed ? detail.level : 0;
  const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
  const isUpgrading = Boolean(detail.upgradeJob);
  const player = usePlayerStore.getState().player;
  const playerCredits = player?.credits ?? 0;
  const playerLevel = player?.level ?? 1;

  const installCost = resolveOrbitShipyardInstallCostCredits(planetId);
  const nextUpgradeCost = nextTargetLevel != null
    ? resolvePlanetDevDiscountedCredits(planetId, resolveShipyardUpgradeCostCredits(level) ?? 0)
    : null;
  const nextInstantCost = nextTargetLevel != null
    ? resolvePlanetDevDiscountedCredits(planetId, resolveShipyardInstantUpgradeCostCredits(level) ?? 0)
    : null;
  const nextUpgradeDurationSec = nextTargetLevel != null
    ? resolveShipyardUpgradeDurationSec(level)
    : null;
  const requiredPilot = nextTargetLevel != null
    ? resolveShipyardUpgradeRequiredPlayerLevel(level)
    : 0;
  const pilotOk = requiredPilot <= 0 || playerLevel >= requiredPilot;

  const canInstall = !detail.installed && playerCredits >= installCost;
  const canStartUpgrade = detail.installed
    && !isUpgrading
    && nextTargetLevel != null
    && nextUpgradeCost != null
    && playerCredits >= nextUpgradeCost
    && pilotOk;
  const canInstantComplete = detail.installed
    && isUpgrading
    && nextInstantCost != null
    && playerCredits >= nextInstantCost;
  const instantNextTotal = (nextUpgradeCost ?? 0) + (nextInstantCost ?? 0);
  const canInstantUpgradeNext = detail.installed
    && !isUpgrading
    && nextTargetLevel != null
    && playerCredits >= instantNextTotal
    && pilotOk;

  const builtHullTierKeys = detail.installed
    ? (detail.builtHullTierKeys ?? resolveShipyardBuiltHullTierKeysForLevel(level))
    : [];

  return {
    installed: detail.installed,
    level,
    maxLevel,
    builtHullTierKeys,
    mineralUpgradeCap: resolveShipyardMineralUpgradeCapForLevel(level),
    upgradeJob: detail.upgradeJob ?? null,
    upgradeProgressPct: resolveOrbitShipyardUpgradeProgressPct(detail.upgradeJob),
    isUpgrading,
    canInstall,
    canStartUpgrade,
    canInstantComplete,
    canInstantUpgradeNext,
    installCost,
    nextUpgradeCost,
    nextInstantCost,
    nextUpgradeDurationSec,
    nextTargetLevel,
  };
}

export function installPlanetOrbitShipyard(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  if (isPlanetOrbitShipyardInstalled(planetId)) {
    return { ok: false, reason: t('orbitShipyardDev.alreadyInstalled') };
  }
  if (!hasPlanetCoreRuntimeEntry(planetId)) {
    return { ok: false, reason: t('orbitShipyardDev.notReady') };
  }
  const cost = resolveOrbitShipyardInstallCostCredits(planetId);
  if (!spendPlayerCredits(cost)) {
    return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  }
  const written = writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_ORBIT_SHIPYARD, {
    version: 1,
    installed: true,
    level: 1,
    builtHullTierKeys: resolveShipyardBuiltHullTierKeysForLevel(1),
    upgradeJob: null,
    updatedAtMs: Date.now(),
  });
  if (!written) {
    usePlayerStore.getState().addCredits(cost);
    void usePlayerStore.getState().persist();
    return { ok: false, reason: t('orbitShipyardDev.recordFailed') };
  }
  invalidatePlanetMemoCachesForPlanet(planetId);
  applyPlanetFacilityLevelUpBenefits(planetId, 'shipyard', 1);
  syncTradeCatalogAfterShipyardChange(planetId);
  return { ok: true };
}

export function startPlanetOrbitShipyardUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed) return { ok: false, reason: t('orbitShipyardDev.installFirst') };
  if (detail.upgradeJob) return { ok: false, reason: t('orbitShipyardDev.upgradeInProgress') };
  const level = detail.level;
  const maxLevel = getFacilityShipyardMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: t('orbitShipyardDev.maxLevel') };
  const reqPilot = resolveShipyardUpgradeRequiredPlayerLevel(level);
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  if (reqPilot > 0 && playerLevel < reqPilot) {
    return { ok: false, reason: t('orbitShipyardDev.pilotLevelRequired', { level: reqPilot }) };
  }
  const rawCost = resolveShipyardUpgradeCostCredits(level);
  if (rawCost == null) return { ok: false, reason: t('orbitShipyardDev.cannotUpgrade') };
  const cost = resolvePlanetDevDiscountedCredits(planetId, rawCost);
  if (!spendPlayerCredits(cost)) return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  const durationSec = resolveShipyardUpgradeDurationSec(level) ?? 0;
  const targetLevel = level + 1;
  if (durationSec <= 0) {
    applyOrbitShipyardLevel(planetId, targetLevel);
    return { ok: true };
  }
  const startedAtMs = Date.now();
  patchOrbitShipyardDetail(planetId, {
    upgradeJob: {
      targetLevel,
      startedAtMs,
      completeAtMs: startedAtMs + durationSec * 1000,
    },
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}

export function instantCompleteOrbitShipyardUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.upgradeJob) return { ok: false, reason: t('orbitShipyardDev.noUpgradeJob') };
  const rawInstant = resolveShipyardInstantUpgradeCostCredits(detail.level);
  if (rawInstant == null) return { ok: false, reason: t('orbitShipyardDev.cannotInstant') };
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, rawInstant);
  if (!spendPlayerCredits(instantCost)) return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  applyOrbitShipyardLevel(planetId, detail.upgradeJob.targetLevel);
  return { ok: true };
}

export function instantUpgradeOrbitShipyardNext(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetOrbitShipyardDetail(planetId);
  if (!detail.installed) return { ok: false, reason: t('orbitShipyardDev.installFirst') };
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
  const instantCost = resolvePlanetDevDiscountedCredits(planetId, resolveShipyardInstantUpgradeCostCredits(level) ?? 0);
  if (!spendPlayerCredits(baseCost + instantCost)) {
    return { ok: false, reason: t('orbitShipyardDev.notEnoughCredits') };
  }
  applyOrbitShipyardLevel(planetId, level + 1);
  return { ok: true };
}

export function formatOrbitShipyardDurationLabel(sec: number): string {
  if (sec <= 0) return t('orbitShipyardDev.durationInstant');
  const totalMin = Math.ceil(sec / 60);
  if (totalMin < 60) return t('orbitShipyardDev.durationMin', { min: totalMin });
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0
    ? t('orbitShipyardDev.durationHourMin', { hours, mins })
    : t('orbitShipyardDev.durationHour', { hours });
}

export function getOrbitShipyardLevelStatRow(level: number) {
  return getFacilityShipyardLevelRow(level);
}

export { listFacilityShipyardLevelRows };
