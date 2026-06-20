// ============================================================
// 범용 시설 개발 런타임 팩토리 — 무역소·연구소·선술집 공통 install/upgrade
// ============================================================

import type { FacilityGenericLevelRow } from '../../arcCore/balance/facilityGenericLevelPolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../planetMemoCache';
import { t } from '../../i18n';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';
import {
  requiresInstallVictoryOnPlanet,
  resolvePlanetInstallVictoryBlock,
} from './planetDevelopmentInstallCombatPolicy';
import { hasPlanetCombatVictorySync } from '../../store/combatMatchTelemetryStore';
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
import {
  buildInstallUpgradeJob,
  buildUpgradeJob,
  isFacilityInstallJob,
  resolveFacilityInstallDurationSec,
  resolveJobProgressPct,
} from './planetFacilityInstallJob';
import { resolveActivePlanetFacilityDurationTier } from '../../arcCore/balance/facilityUpgradeDurationPolicy';
import { formatPlanetFacilityDurationLabel } from './formatPlanetFacilityDurationLabel';
import { resolvePlanetDevModuleInstantCompleteCredits } from './planetFacilityInstantCompleteModel';
import {
  isPlanetCsvWorldDevModuleBaseline,
  materializeCsvWorldBaselineDevModule,
  resolveEffectiveFacilityDevView,
} from './planetCsvWorldFacilityBaseline';

export type GenericFacilityDevSnapshot = {
  installed: boolean;
  level: number;
  maxLevel: number;
  upgradeJob: PlanetFacilityModuleDetail['upgradeJob'];
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
  installBlockReason: string | null;
  requiresInstallVictory: boolean;
  hasInstallVictory: boolean;
  /** planets.csv 월드 시설 — dev 미기록·Lv1 표시 */
  isCsvWorldBaseline: boolean;
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

  function completeInstall(planetId: string): void {
    patchDetail(planetId, { installed: true, level: 1, upgradeJob: null });
    invalidatePlanetMemoCachesForPlanet(planetId);
    applyPlanetFacilityLevelUpBenefits(planetId, facilityType, 1);
    onLevelApplied?.(planetId, 1);
  }

  function resolveInstallInstantCost(planetId: string, job?: PlanetFacilityModuleDetail['upgradeJob']): number | null {
    const raw = resolvePlanetDevModuleInstantCompleteCredits({
      facilityType,
      kind: 'install',
      currentLevel: 0,
      legacyInstantCredits: policy.getLevelRow(1)?.instantUpgradeCostCredits,
      job: job ?? null,
    });
    return resolvePlanetDevDiscountedCredits(planetId, raw);
  }

  function resolveUpgradeInstantCost(
    planetId: string,
    level: number,
    job?: PlanetFacilityModuleDetail['upgradeJob'],
  ): number | null {
    const raw = resolvePlanetDevModuleInstantCompleteCredits({
      facilityType,
      kind: 'upgrade',
      currentLevel: level,
      legacyInstantCredits: policy.resolveInstantUpgradeCostCredits(level),
      job: job ?? null,
    });
    return resolvePlanetDevDiscountedCredits(planetId, raw);
  }

  function isInstalled(planetId: string): boolean {
    const d = readDetail(planetId);
    return d.version === 1 && d.installed === true;
  }

  function resolveInstallCostCredits(planetId: string): number {
    const base = getPlanetDevelopmentCatalogRow(moduleId)?.installCostCredits ?? 0;
    return resolvePlanetDevDiscountedCredits(planetId, base);
  }

  /** v2.0 §8 — 설치 선행: 영역별 승리 1회 (시설 체인·승리 N회 CSV 폐기) */
  function resolveInstallPrerequisiteBlock(planetId: string): string | null {
    return resolvePlanetInstallVictoryBlock(planetId);
  }

  function tryCompleteUpgrade(planetId: string): boolean {
    const detail = readDetail(planetId);
    if (!detail.upgradeJob) return false;
    if (Date.now() < detail.upgradeJob.completeAtMs) return false;
    if (isFacilityInstallJob(detail)) {
      completeInstall(planetId);
    } else {
      if (!detail.installed) return false;
      applyLevel(planetId, detail.upgradeJob.targetLevel);
    }
    return true;
  }

  function buildSnapshot(planetId: string): GenericFacilityDevSnapshot {
    const detail = readDetail(planetId);
    const effective = resolveEffectiveFacilityDevView(planetId, moduleId, detail);
    const maxLevel = policy.getMaxLevel();
    const level = effective.effectiveLevel;
    const installed = effective.effectiveInstalled;
    const isCsvWorldBaseline = effective.csvWorldBaselineOnly;
    const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
    const isInstalling = isFacilityInstallJob(detail);
    const isUpgrading = detail.installed && Boolean(detail.upgradeJob);
    const installDurationSec = !installed && !isCsvWorldBaseline
      ? resolveFacilityInstallDurationSec(facilityType)
      : null;
    const player = usePlayerStore.getState().player;
    const playerCredits = player?.credits ?? 0;
    const playerLevel = player?.level ?? 1;

    const installCost = resolveInstallCostCredits(planetId);
    const nextUpgradeCost = nextTargetLevel != null
      ? resolvePlanetDevDiscountedCredits(planetId, policy.resolveUpgradeCostCredits(level) ?? 0)
      : null;
    const previewInstallInstantCost = resolveInstallInstantCost(planetId, null);
    const previewUpgradeInstantCost = nextTargetLevel != null && !detail.upgradeJob
      ? resolveUpgradeInstantCost(planetId, level, null)
      : null;
    const nextUpgradeDurationSec = nextTargetLevel != null ? policy.resolveUpgradeDurationSec(level) : null;

    const reqPilot = nextTargetLevel != null ? policy.resolveUpgradeRequiredPlayerLevel(level) : 0;
    const reqStat = nextTargetLevel != null ? policy.resolveUpgradeRequiredStat(level) : { type: '', value: 0 };
    const pilotOk = reqPilot <= 0 || playerLevel >= reqPilot;
    const statOk = reqStat.value <= 0 || reqStat.type === ''
      || resolvePlanetStatForPrereq(planetId, reqStat.type) >= reqStat.value;

    const installPrereqBlock = !installed && !detail.upgradeJob
      ? resolveInstallPrerequisiteBlock(planetId)
      : null;
    const requiresInstallVictory = requiresInstallVictoryOnPlanet(planetId);
    const hasInstallVictory = hasPlanetCombatVictorySync(planetId);
    const canInstall = !installed
      && !isCsvWorldBaseline
      && !detail.upgradeJob
      && playerCredits >= installCost
      && installPrereqBlock == null;
    const canStartUpgrade = installed
      && !isUpgrading
      && !isInstalling
      && nextTargetLevel != null
      && nextUpgradeCost != null
      && playerCredits >= nextUpgradeCost
      && pilotOk
      && statOk;
    const activeInstantCost = detail.upgradeJob
      ? (isInstalling
        ? resolveInstallInstantCost(planetId, detail.upgradeJob)
        : resolveUpgradeInstantCost(planetId, level, detail.upgradeJob))
      : null;
    const canInstantComplete = Boolean(detail.upgradeJob)
      && activeInstantCost != null
      && playerCredits >= activeInstantCost;
    const instantNextTotal = (nextUpgradeCost ?? 0) + (previewUpgradeInstantCost ?? 0);
    const canInstantUpgradeNext = installed
      && !isUpgrading
      && !isInstalling
      && nextTargetLevel != null
      && playerCredits >= instantNextTotal
      && pilotOk
      && statOk;

    return {
      installed,
      level,
      maxLevel,
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
      nextInstantCost: detail.upgradeJob ? activeInstantCost : (isInstalling ? previewInstallInstantCost : previewUpgradeInstantCost),
      nextUpgradeDurationSec,
      nextTargetLevel,
      installBlockReason: installPrereqBlock
        ?? (playerCredits < installCost ? t(`${i18nPrefix}.notEnoughCredits`) : null),
      requiresInstallVictory,
      hasInstallVictory,
      isCsvWorldBaseline,
    };
  }

  function install(planetId: string): { ok: true } | { ok: false; reason: string } {
    const detail = readDetail(planetId);
    if (isInstalled(planetId) || isPlanetCsvWorldDevModuleBaseline(planetId, moduleId)) {
      return { ok: false, reason: t(`${i18nPrefix}.alreadyInstalled`) };
    }
    if (detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.upgradeInProgress`) };
    if (!hasPlanetCoreRuntimeEntry(planetId)) return { ok: false, reason: t(`${i18nPrefix}.notReady`) };
    const prereqBlock = resolveInstallPrerequisiteBlock(planetId);
    if (prereqBlock) return { ok: false, reason: prereqBlock };
    const cost = resolveInstallCostCredits(planetId);
    if (!spendPlayerCredits(cost)) return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    const durationSec = resolveFacilityInstallDurationSec(facilityType);
    if (durationSec <= 0) {
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
    const written = writeFacilityModuleDetail(planetId, moduleId, {
      version: 1,
      installed: false,
      level: 0,
      upgradeJob: buildInstallUpgradeJob(durationSec, Date.now(), resolveActivePlanetFacilityDurationTier()),
      updatedAtMs: Date.now(),
    });
    if (!written) {
      usePlayerStore.getState().addCredits(cost);
      void usePlayerStore.getState().persist();
      return { ok: false, reason: t(`${i18nPrefix}.recordFailed`) };
    }
    invalidatePlanetMemoCachesForPlanet(planetId);
    return { ok: true };
  }

  function startUpgrade(planetId: string): { ok: true } | { ok: false; reason: string } {
    let detail = readDetail(planetId);
    if (!detail.installed) {
      if (!isPlanetCsvWorldDevModuleBaseline(planetId, moduleId)) {
        return { ok: false, reason: t(`${i18nPrefix}.installFirst`) };
      }
      if (!materializeCsvWorldBaselineDevModule(planetId, moduleId, detail)) {
        return { ok: false, reason: t(`${i18nPrefix}.notReady`) };
      }
      invalidatePlanetMemoCachesForPlanet(planetId);
      applyPlanetFacilityLevelUpBenefits(planetId, facilityType, 1);
      onLevelApplied?.(planetId, 1);
      detail = readDetail(planetId);
    }
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
    patchDetail(planetId, {
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

  function instantCompleteUpgrade(planetId: string): { ok: true } | { ok: false; reason: string } {
    const detail = readDetail(planetId);
    if (!detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.noUpgradeJob`) };
    const isInstall = isFacilityInstallJob(detail);
    const instantCost = isInstall
      ? resolveInstallInstantCost(planetId, detail.upgradeJob)
      : resolveUpgradeInstantCost(planetId, detail.level, detail.upgradeJob);
    if (instantCost == null) return { ok: false, reason: t(`${i18nPrefix}.cannotInstant`) };
    if (!spendPlayerCredits(instantCost)) return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    if (isInstall) {
      completeInstall(planetId);
    } else {
      applyLevel(planetId, detail.upgradeJob.targetLevel);
    }
    return { ok: true };
  }

  function instantUpgradeNext(planetId: string): { ok: true } | { ok: false; reason: string } {
    let detail = readDetail(planetId);
    if (!detail.installed) {
      if (!isPlanetCsvWorldDevModuleBaseline(planetId, moduleId)) {
        return { ok: false, reason: t(`${i18nPrefix}.installFirst`) };
      }
      if (!materializeCsvWorldBaselineDevModule(planetId, moduleId, detail)) {
        return { ok: false, reason: t(`${i18nPrefix}.notReady`) };
      }
      invalidatePlanetMemoCachesForPlanet(planetId);
      applyPlanetFacilityLevelUpBenefits(planetId, facilityType, 1);
      onLevelApplied?.(planetId, 1);
      detail = readDetail(planetId);
    }
    if (detail.upgradeJob) return { ok: false, reason: t(`${i18nPrefix}.upgradeInProgress`) };
    const level = detail.level;
    if (level >= policy.getMaxLevel()) return { ok: false, reason: t(`${i18nPrefix}.maxLevel`) };
    const reqPilot = policy.resolveUpgradeRequiredPlayerLevel(level);
    const playerLevel = usePlayerStore.getState().player?.level ?? 1;
    if (reqPilot > 0 && playerLevel < reqPilot) {
      return { ok: false, reason: t(`${i18nPrefix}.pilotLevelRequired`, { level: reqPilot }) };
    }
    const baseCost = resolvePlanetDevDiscountedCredits(planetId, policy.resolveUpgradeCostCredits(level) ?? 0);
    const instantRaw = resolvePlanetDevModuleInstantCompleteCredits({
      facilityType,
      kind: 'upgrade',
      currentLevel: level,
      legacyInstantCredits: policy.resolveInstantUpgradeCostCredits(level),
    });
    const instantCost = resolvePlanetDevDiscountedCredits(planetId, instantRaw);
    if (!spendPlayerCredits(baseCost + instantCost)) {
      return { ok: false, reason: t(`${i18nPrefix}.notEnoughCredits`) };
    }
    applyLevel(planetId, level + 1);
    return { ok: true };
  }

  function formatDurationLabel(sec: number): string {
    return formatPlanetFacilityDurationLabel(sec);
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
