// ============================================================
// 범용 시설 개발 런타임 팩토리 — 무역소·연구소·선술집 공통 install/upgrade
// ============================================================

import type { FacilityGenericLevelRow } from '../../arcCore/balance/facilityGenericLevelPolicy';
import { getFacilityInstallPrerequisite } from '../../arcCore/balance/facilityInstallPrerequisitesPolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../planetMemoCache';
import { t } from '../../i18n';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import { countPlanetCombatWinsSync } from '../../store/combatMatchTelemetryStore';
import { getPlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import {
  applyPlanetFacilityLevelUpBenefits,
  resolvePlanetDevDiscountedCredits,
} from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import {
  hasPlanetCoreRuntimeEntry,
  readFacilityModuleDetail,
  writeFacilityModuleDetail,
} from './planetFacilityModuleRuntime';
export type GenericFacilityDevSnapshot = {
  installed: boolean;
  level: number;
  maxLevel: number;
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
  installBlockReason: string | null;
  requiredCombatWins: number;
  currentCombatWins: number;
};

type GenericFacilityPolicy = {
  getMaxLevel: () => number;
  getLevelRow: (level: number) => FacilityGenericLevelRow | null;
  listRows: () => FacilityGenericLevelRow[];
  resolveUpgradeCostCredits: (currentLevel: number) => number | null;
  resolveInstantUpgradeCostCredits: (currentLevel: number) => number | null;
  resolveUpgradeDurationSec: (currentLevel: number) => number | null;
  resolveUpgradeRequiredPlayerLevel: (currentLevel: number) => number;
  resolveUpgradeRequiredStat: (currentLevel: number) => { type: string; value: number };
};

type CreateGenericFacilityDevOptions = {
  moduleId: string;
  facilityType: string;
  policy: GenericFacilityPolicy;
  i18nPrefix: string;
  onLevelApplied?: (planetId: string, level: number) => void;
};

function spendPlayerCredits(amount: number): boolean {
  if (amount <= 0) return true;
  const ok = usePlayerStore.getState().spendCredits(amount);
  if (ok) void usePlayerStore.getState().persist();
  return ok;
}

function resolveUpgradeProgressPct(
  job: PlanetFacilityModuleDetail['upgradeJob'],
  nowMs = Date.now(),
): number {
  if (!job) return 0;
  const total = job.completeAtMs - job.startedAtMs;
  if (total <= 0) return 100;
  const elapsed = nowMs - job.startedAtMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function resolvePlanetStatForPrereq(planetId: string, statType: string): number {
  const core = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (!core) return 0;
  switch (statType) {
    case 'resource': return core.resource;
    case 'population': return core.population;
    case 'defense': return core.defense;
    case 'technology': return core.technology;
    case 'environment': return core.environment;
    default: return 0;
  }
}

export function createGenericFacilityDevelopment(opts: CreateGenericFacilityDevOptions) {
  const { moduleId, facilityType, policy, i18nPrefix, onLevelApplied } = opts;

  function readDetail(planetId: string): PlanetFacilityModuleDetail {
    return readFacilityModuleDetail(planetId, moduleId);
  }

  function patchDetail(planetId: string, patch: Partial<PlanetFacilityModuleDetail>): void {
    const prev = readDetail(planetId);
    writeFacilityModuleDetail(planetId, moduleId, {
      ...prev,
      ...patch,
      version: 1,
      updatedAtMs: Date.now(),
    });
  }

  function applyLevel(planetId: string, targetLevel: number): void {
    patchDetail(planetId, { level: targetLevel, upgradeJob: null });
    invalidatePlanetMemoCachesForPlanet(planetId);
    applyPlanetFacilityLevelUpBenefits(planetId, facilityType, targetLevel);
    onLevelApplied?.(planetId, targetLevel);
  }

  function isInstalled(planetId: string): boolean {
    const d = readDetail(planetId);
    return d.version === 1 && d.installed === true;
  }

  function resolveInstallCostCredits(planetId: string): number {
    const base = getPlanetDevelopmentCatalogRow(moduleId)?.installCostCredits ?? 0;
    return resolvePlanetDevDiscountedCredits(planetId, base);
  }

  function tryCompleteUpgrade(planetId: string): boolean {
    const detail = readDetail(planetId);
    if (!detail.installed || !detail.upgradeJob) return false;
    if (Date.now() < detail.upgradeJob.completeAtMs) return false;
    applyLevel(planetId, detail.upgradeJob.targetLevel);
    return true;
  }

  function buildSnapshot(planetId: string): GenericFacilityDevSnapshot {
    const detail = readDetail(planetId);
    const maxLevel = policy.getMaxLevel();
    const level = detail.installed ? detail.level : 0;
    const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
    const isUpgrading = Boolean(detail.upgradeJob);
    const player = usePlayerStore.getState().player;
    const playerCredits = player?.credits ?? 0;
    const playerLevel = player?.level ?? 1;

    const installCost = resolveInstallCostCredits(planetId);
    const nextUpgradeCost = nextTargetLevel != null
      ? resolvePlanetDevDiscountedCredits(planetId, policy.resolveUpgradeCostCredits(level) ?? 0)
      : null;
    const nextInstantCost = nextTargetLevel != null
      ? resolvePlanetDevDiscountedCredits(planetId, policy.resolveInstantUpgradeCostCredits(level) ?? 0)
      : null;
    const nextUpgradeDurationSec = nextTargetLevel != null ? policy.resolveUpgradeDurationSec(level) : null;

    const reqPilot = nextTargetLevel != null ? policy.resolveUpgradeRequiredPlayerLevel(level) : 0;
    const reqStat = nextTargetLevel != null ? policy.resolveUpgradeRequiredStat(level) : { type: '', value: 0 };
    const pilotOk = reqPilot <= 0 || playerLevel >= reqPilot;
    const statOk = reqStat.value <= 0 || reqStat.type === ''
      || resolvePlanetStatForPrereq(planetId, reqStat.type) >= reqStat.value;

    const prereq = getFacilityInstallPrerequisite(facilityType);
    const requiredCombatWins = prereq?.requiredCombatWins ?? 0;
    const currentCombatWins = countPlanetCombatWinsSync(planetId);

    const canInstall = !detail.installed && playerCredits >= installCost;
    const canStartUpgrade = detail.installed
      && !isUpgrading
      && nextTargetLevel != null
      && nextUpgradeCost != null
      && playerCredits >= nextUpgradeCost
      && pilotOk
      && statOk;
    const canInstantComplete = detail.installed
      && isUpgrading
      && nextInstantCost != null
      && playerCredits >= nextInstantCost;
    const instantNextTotal = (nextUpgradeCost ?? 0) + (nextInstantCost ?? 0);
    const canInstantUpgradeNext = detail.installed
      && !isUpgrading
      && nextTargetLevel != null
      && playerCredits >= instantNextTotal
      && pilotOk
      && statOk;

    return {
      installed: detail.installed,
      level,
      maxLevel,
      upgradeJob: detail.upgradeJob ?? null,
      upgradeProgressPct: resolveUpgradeProgressPct(detail.upgradeJob),
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
      installBlockReason: playerCredits < installCost ? t(`${i18nPrefix}.notEnoughCredits`) : null,
      requiredCombatWins,
      currentCombatWins,
    };
  }

  function install(planetId: string): { ok: true } | { ok: false; reason: string } {
    if (isInstalled(planetId)) return { ok: false, reason: t(`${i18nPrefix}.alreadyInstalled`) };
    if (!hasPlanetCoreRuntimeEntry(planetId)) return { ok: false, reason: t(`${i18nPrefix}.notReady`) };
    const cost = resolveInstallCostCredits(planetId);
    if (!spendPlayerCredits(cost)) return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    const written = writeFacilityModuleDetail(planetId, moduleId, {
      version: 1,
      installed: true,
      level: 1,
      upgradeJob: null,
      updatedAtMs: Date.now(),
    });
    if (!written) {
      usePlayerStore.getState().addCredits(cost);
      void usePlayerStore.getState().persist();
      return { ok: false, reason: t(`${i18nPrefix}.recordFailed`) };
    }
    invalidatePlanetMemoCachesForPlanet(planetId);
    applyPlanetFacilityLevelUpBenefits(planetId, facilityType, 1);
    onLevelApplied?.(planetId, 1);
    return { ok: true };
  }

  function startUpgrade(planetId: string): { ok: true } | { ok: false; reason: string } {
    const detail = readDetail(planetId);
    if (!detail.installed) return { ok: false, reason: t(`${i18nPrefix}.installFirst`) };
    if (detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.upgradeInProgress`) };
    const level = detail.level;
    if (level >= policy.getMaxLevel()) return { ok: false, reason: t(`${i18nPrefix}.maxLevel`) };
    const reqPilot = policy.resolveUpgradeRequiredPlayerLevel(level);
    const playerLevel = usePlayerStore.getState().player?.level ?? 1;
    if (reqPilot > 0 && playerLevel < reqPilot) {
      return { ok: false, reason: t(`${i18nPrefix}.pilotLevelRequired`, { level: reqPilot }) };
    }
    const reqStat = policy.resolveUpgradeRequiredStat(level);
    if (reqStat.value > 0 && reqStat.type) {
      const cur = resolvePlanetStatForPrereq(planetId, reqStat.type);
      if (cur < reqStat.value) {
        return { ok: false, reason: t(`${i18nPrefix}.statRequired`, { stat: reqStat.type, value: reqStat.value }) };
      }
    }
    const rawUpgradeCost = policy.resolveUpgradeCostCredits(level);
    if (rawUpgradeCost == null) return { ok: false, reason: t(`${i18nPrefix}.cannotUpgrade`) };
    const cost = resolvePlanetDevDiscountedCredits(planetId, rawUpgradeCost);
    if (!spendPlayerCredits(cost)) return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    const durationSec = policy.resolveUpgradeDurationSec(level) ?? 0;
    const targetLevel = level + 1;
    if (durationSec <= 0) {
      applyLevel(planetId, targetLevel);
      return { ok: true };
    }
    const startedAtMs = Date.now();
    patchDetail(planetId, {
      upgradeJob: {
        targetLevel,
        startedAtMs,
        completeAtMs: startedAtMs + durationSec * 1000,
      },
    });
    invalidatePlanetMemoCachesForPlanet(planetId);
    return { ok: true };
  }

  function instantCompleteUpgrade(planetId: string): { ok: true } | { ok: false; reason: string } {
    const detail = readDetail(planetId);
    if (!detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.noUpgradeJob`) };
    const rawInstant = policy.resolveInstantUpgradeCostCredits(detail.level);
    if (rawInstant == null) return { ok: false, reason: t(`${i18nPrefix}.cannotInstant`) };
    const instantCost = resolvePlanetDevDiscountedCredits(planetId, rawInstant);
    if (!spendPlayerCredits(instantCost)) return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    applyLevel(planetId, detail.upgradeJob.targetLevel);
    return { ok: true };
  }

  function instantUpgradeNext(planetId: string): { ok: true } | { ok: false; reason: string } {
    const detail = readDetail(planetId);
    if (!detail.installed) return { ok: false, reason: t(`${i18nPrefix}.installFirst`) };
    if (detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.upgradeInProgress`) };
    const level = detail.level;
    if (level >= policy.getMaxLevel()) return { ok: false, reason: t(`${i18nPrefix}.maxLevel`) };
    const reqPilot = policy.resolveUpgradeRequiredPlayerLevel(level);
    const playerLevel = usePlayerStore.getState().player?.level ?? 1;
    if (reqPilot > 0 && playerLevel < reqPilot) {
      return { ok: false, reason: t(`${i18nPrefix}.pilotLevelRequired`, { level: reqPilot }) };
    }
    const baseCost = resolvePlanetDevDiscountedCredits(planetId, policy.resolveUpgradeCostCredits(level) ?? 0);
    const instantCost = resolvePlanetDevDiscountedCredits(planetId, policy.resolveInstantUpgradeCostCredits(level) ?? 0);
    if (!spendPlayerCredits(baseCost + instantCost)) {
      return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    }
    applyLevel(planetId, level + 1);
    return { ok: true };
  }

  function formatDurationLabel(sec: number): string {
    if (sec <= 0) return t(`${i18nPrefix}.durationInstant`);
    const totalMin = Math.ceil(sec / 60);
    if (totalMin < 60) return t(`${i18nPrefix}.durationMin`, { min: totalMin });
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0
      ? t(`${i18nPrefix}.durationHourMin`, { hours, mins })
      : t(`${i18nPrefix}.durationHour`, { hours });
  }

  return {
    readDetail,
    isInstalled,
    tryCompleteUpgrade,
    buildSnapshot,
    install,
    startUpgrade,
    instantCompleteUpgrade,
    instantUpgradeNext,
    formatDurationLabel,
    getLevelRow: policy.getLevelRow,
    listLevelRows: policy.listRows,
  };
}

export type { PlanetCoreGaugeView };
