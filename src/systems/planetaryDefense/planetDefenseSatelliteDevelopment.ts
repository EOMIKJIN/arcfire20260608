import {
  getPlanetDefenseSatelliteLevelRow,
  getPlanetDefenseSatelliteMaxLevel,
  resolveDefenseSatelliteActiveCountForLevel,
  resolveDefenseSatelliteInstallCostCredits,
  resolveDefenseSatelliteInstantUpgradeCostCredits,
  resolveDefenseSatelliteUpgradeCostCredits,
  resolveDefenseSatelliteUpgradeDurationSec,
} from '../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { invalidatePlanetMemoCachesForPlanet } from '../../game/planetMemoCache';
import {
  isPlanetDefenseSatelliteInstalled,
  readDefenseSatelliteDetailFromPlanet,
  writeDefenseSatelliteDetailToPlanet,
} from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import { usePlayerStore } from '../../store/playerStore';
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
  const level = Math.max(1, Math.floor(Number(raw.level) || 1));
  const installed = raw.installed === true;
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
  if (!detail.installed || !detail.upgradeJob) return false;
  const now = Date.now();
  if (now < detail.upgradeJob.completeAtMs) return false;
  const targetLevel = detail.upgradeJob.targetLevel;
  patchDefenseSatelliteDetail(planetId, {
    level: targetLevel,
    upgradeJob: null,
  });
  syncDefenseSatelliteInstances(planetId, targetLevel);
  invalidatePlanetMemoCachesForPlanet(planetId);
  return true;
}

export function buildDefenseSatelliteDevSnapshot(planetId: string): DefenseSatelliteDevSnapshot {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  const level = detail.installed ? resolvePlanetDefenseSatelliteLevel(planetId) : 0;
  const nextTargetLevel = level > 0 && level < maxLevel ? level + 1 : null;
  const isUpgrading = Boolean(detail.upgradeJob);
  const playerCredits = usePlayerStore.getState().player?.credits ?? 0;

  const installCost = resolveDefenseSatelliteInstallCostCredits();
  const nextUpgradeCost = nextTargetLevel != null
    ? resolveDefenseSatelliteUpgradeCostCredits(level)
    : null;
  const nextInstantCost = nextTargetLevel != null
    ? resolveDefenseSatelliteInstantUpgradeCostCredits(level)
    : null;
  const nextUpgradeDurationSec = nextTargetLevel != null
    ? resolveDefenseSatelliteUpgradeDurationSec(level)
    : null;

  const canInstall = !detail.installed && playerCredits >= installCost;
  const canStartUpgrade = detail.installed
    && !isUpgrading
    && nextTargetLevel != null
    && nextUpgradeCost != null
    && playerCredits >= nextUpgradeCost;
  const canInstantComplete = detail.installed
    && isUpgrading
    && nextInstantCost != null
    && playerCredits >= nextInstantCost;
  const instantNextTotal = (nextUpgradeCost ?? 0) + (nextInstantCost ?? 0);
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
    upgradeProgressPct: resolveDefenseSatelliteUpgradeProgressPct(detail.upgradeJob),
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

export function installPlanetDefenseSatellite(planetId: string): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (detail.installed) return { ok: false, reason: '이미 설치되어 있습니다.' };
  const cost = resolveDefenseSatelliteInstallCostCredits();
  if (!spendPlayerCredits(cost)) return { ok: false, reason: '크레딧이 부족합니다.' };
  patchDefenseSatelliteDetail(planetId, {
    installed: true,
    level: 1,
    upgradeJob: null,
  });
  syncDefenseSatelliteInstances(planetId, 1);
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
}

export function startPlanetDefenseSatelliteUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.installed) return { ok: false, reason: '방위위성을 먼저 설치하세요.' };
  if (detail.upgradeJob) return { ok: false, reason: '업그레이드가 진행 중입니다.' };
  const level = resolvePlanetDefenseSatelliteLevel(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: '최대 레벨입니다.' };
  const cost = resolveDefenseSatelliteUpgradeCostCredits(level);
  if (cost == null) return { ok: false, reason: '더 이상 업그레이드할 수 없습니다.' };
  if (!spendPlayerCredits(cost)) return { ok: false, reason: '크레딧이 부족합니다.' };
  const durationSec = resolveDefenseSatelliteUpgradeDurationSec(level) ?? 0;
  const targetLevel = level + 1;
  if (durationSec <= 0) {
    applyDefenseSatelliteLevel(planetId, targetLevel);
    return { ok: true };
  }
  const startedAtMs = Date.now();
  patchDefenseSatelliteDetail(planetId, {
    upgradeJob: {
      targetLevel,
      startedAtMs,
      completeAtMs: startedAtMs + durationSec * 1000,
    },
  });
  invalidatePlanetMemoCachesForPlanet(planetId);
  return { ok: true };
}

export function instantCompleteDefenseSatelliteUpgrade(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.upgradeJob) return { ok: false, reason: '진행 중인 업그레이드가 없습니다.' };
  const level = resolvePlanetDefenseSatelliteLevel(planetId);
  const instantCost = resolveDefenseSatelliteInstantUpgradeCostCredits(level);
  if (instantCost == null) return { ok: false, reason: '즉시 완료할 수 없습니다.' };
  if (!spendPlayerCredits(instantCost)) return { ok: false, reason: '크레딧이 부족합니다.' };
  applyDefenseSatelliteLevel(planetId, detail.upgradeJob.targetLevel);
  return { ok: true };
}

export function instantUpgradeDefenseSatelliteNext(
  planetId: string,
): { ok: true } | { ok: false; reason: string } {
  const detail = readPlanetDefenseSatelliteDetail(planetId);
  if (!detail.installed) return { ok: false, reason: '방위위성을 먼저 설치하세요.' };
  if (detail.upgradeJob) return { ok: false, reason: '업그레이드가 진행 중입니다.' };
  const level = resolvePlanetDefenseSatelliteLevel(planetId);
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  if (level >= maxLevel) return { ok: false, reason: '최대 레벨입니다.' };
  const baseCost = resolveDefenseSatelliteUpgradeCostCredits(level) ?? 0;
  const instantCost = resolveDefenseSatelliteInstantUpgradeCostCredits(level) ?? 0;
  if (!spendPlayerCredits(baseCost + instantCost)) {
    return { ok: false, reason: '크레딧이 부족합니다.' };
  }
  applyDefenseSatelliteLevel(planetId, level + 1);
  return { ok: true };
}

export function formatDefenseSatelliteDurationLabel(sec: number): string {
  if (sec <= 0) return '즉시';
  const totalMin = Math.ceil(sec / 60);
  if (totalMin < 60) return `${totalMin}분`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export function getDefenseSatelliteLevelStatRow(level: number) {
  return getPlanetDefenseSatelliteLevelRow(level);
}
