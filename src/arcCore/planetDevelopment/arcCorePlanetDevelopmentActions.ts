// ============================================================
// ArcCore RED 행성개발 — 모듈별 install/upgrade 디스패치
// ============================================================

import { getPlanetOccupationSeedRow } from '../balance/balanceTableRegistry';
import { resolveArcCorePlanetDevActionOpts } from '../../game/planetDevelopment/planetDevelopmentActionOptions';
import type { PlanetDevActionOpts } from '../../game/planetDevelopment/planetDevelopmentActionOptions';
import {
  buildDefenseSatelliteDevSnapshot,
  installPlanetDefenseSatellite,
  startPlanetDefenseSatelliteUpgrade,
} from '../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import {
  buildOrbitShipyardDevSnapshot,
  installPlanetOrbitShipyard,
  startPlanetOrbitShipyardUpgrade,
} from '../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import {
  buildTradePortDevSnapshot,
  installPlanetTradePort,
  startPlanetTradePortUpgrade,
} from '../../game/planetDevelopment/planetTradePortDevelopment';
import {
  buildLaboratoryDevSnapshot,
  installPlanetLaboratory,
  startPlanetLaboratoryUpgrade,
} from '../../game/planetDevelopment/planetLaboratoryDevelopment';
import {
  buildTavernFacilityDevSnapshot,
  installPlanetTavernFacility,
  startPlanetTavernFacilityUpgrade,
} from '../../game/planetDevelopment/planetTavernFacilityDevelopment';
import type { PlanetDevFacilitySnapshotSlice } from '../../game/planetDevelopment/planetDevelopmentListRowModel';
import { hasAnyPlanetDevJobInProgress } from '../../game/planetDevelopment/planetDevelopmentListRowModel';
import {
  resolveArcCorePlanetDevInvestmentPolicy,
  resolveArcCorePlanetDevModuleWeight,
} from './arcCorePlanetDevInvestmentPolicy';
import {
  releaseArcCorePlanetDevBudget,
  tryConsumeArcCorePlanetDevBudget,
} from './arcCorePlanetDevBudgetState';

export const ARC_CORE_PLANET_DEV_MODULE_IDS = [
  'defense_satellite',
  'dev_orbit_shipyard',
  'dev_trade_port',
  'dev_research_lab',
  'dev_population_dome',
] as const;

export type ArcCorePlanetDevModuleId = (typeof ARC_CORE_PLANET_DEV_MODULE_IDS)[number];

const ARC_OPTS = resolveArcCorePlanetDevActionOpts();

type ModuleSnapshot = PlanetDevFacilitySnapshotSlice & {
  installCost?: number;
  nextUpgradeCost?: number | null;
  maxLevel?: number;
};

export function buildArcCorePlanetDevModuleSnapshot(
  planetId: string,
  moduleId: ArcCorePlanetDevModuleId,
): ModuleSnapshot | null {
  switch (moduleId) {
    case 'defense_satellite':
      return buildDefenseSatelliteDevSnapshot(planetId);
    case 'dev_orbit_shipyard':
      return buildOrbitShipyardDevSnapshot(planetId);
    case 'dev_trade_port':
      return buildTradePortDevSnapshot(planetId);
    case 'dev_research_lab':
      return buildLaboratoryDevSnapshot(planetId);
    case 'dev_population_dome':
      return buildTavernFacilityDevSnapshot(planetId);
    default:
      return null;
  }
}

export function planetHasArcCoreDevJobInProgress(planetId: string): boolean {
  const snapshots: PlanetDevFacilitySnapshotSlice[] = [];
  for (let i = 0; i < ARC_CORE_PLANET_DEV_MODULE_IDS.length; i += 1) {
    const snap = buildArcCorePlanetDevModuleSnapshot(planetId, ARC_CORE_PLANET_DEV_MODULE_IDS[i]!);
    if (snap) snapshots.push(snap);
  }
  return hasAnyPlanetDevJobInProgress(snapshots);
}

export function scoreArcCorePlanetDevCandidate(
  planetId: string,
  moduleId: ArcCorePlanetDevModuleId,
): number {
  const policy = resolveArcCorePlanetDevInvestmentPolicy();
  let score = resolveArcCorePlanetDevModuleWeight(moduleId, policy);
  const seed = getPlanetOccupationSeedRow(planetId);
  if (moduleId === 'defense_satellite' && String(seed?.contestedZone ?? '').toLowerCase() === 'true') {
    score += policy.contestedDefenseBonus;
  }
  if (planetId === 'core_prime') {
    score += policy.capitalPrimeBonus;
  }
  return score;
}

type DevAction = 'install' | 'upgrade';

function resolveDevAction(snap: ModuleSnapshot): DevAction | null {
  if (snap.isInstalling || snap.isUpgrading) return null;
  if (snap.isCsvWorldBaseline) {
    if ((snap.maxLevel ?? 99) <= snap.level) return null;
    return 'upgrade';
  }
  if (!snap.installed) return 'install';
  if (snap.maxLevel != null && snap.level >= snap.maxLevel) return null;
  return 'upgrade';
}

function dispatchArcCorePlanetDevAction(
  planetId: string,
  moduleId: ArcCorePlanetDevModuleId,
  action: DevAction,
  opts: PlanetDevActionOpts,
): { ok: true } | { ok: false; reason: string } {
  switch (moduleId) {
    case 'defense_satellite':
      return action === 'install'
        ? installPlanetDefenseSatellite(planetId, opts)
        : startPlanetDefenseSatelliteUpgrade(planetId, opts);
    case 'dev_orbit_shipyard':
      return action === 'install'
        ? installPlanetOrbitShipyard(planetId, opts)
        : startPlanetOrbitShipyardUpgrade(planetId, opts);
    case 'dev_trade_port':
      return action === 'install'
        ? installPlanetTradePort(planetId, opts)
        : startPlanetTradePortUpgrade(planetId, opts);
    case 'dev_research_lab':
      return action === 'install'
        ? installPlanetLaboratory(planetId, opts)
        : startPlanetLaboratoryUpgrade(planetId, opts);
    case 'dev_population_dome':
      return action === 'install'
        ? installPlanetTavernFacility(planetId, opts)
        : startPlanetTavernFacilityUpgrade(planetId, opts);
    default:
      return { ok: false, reason: 'unknown_module' };
  }
}

export type ArcCorePlanetDevRankedCandidate = {
  planetId: string;
  moduleId: ArcCorePlanetDevModuleId;
  action: DevAction;
  cost: number;
  score: number;
};

const rankedScratch: ArcCorePlanetDevRankedCandidate[] = [];

function insertRanked(candidate: ArcCorePlanetDevRankedCandidate): void {
  let insertAt = rankedScratch.length;
  for (let i = 0; i < rankedScratch.length; i += 1) {
    if (candidate.score > rankedScratch[i]!.score) {
      insertAt = i;
      break;
    }
  }
  rankedScratch.splice(insertAt, 0, candidate);
}

export function collectArcCorePlanetDevCandidates(
  planetIds: readonly string[],
): readonly ArcCorePlanetDevRankedCandidate[] {
  rankedScratch.length = 0;
  for (let p = 0; p < planetIds.length; p += 1) {
    const planetId = planetIds[p]!;
    if (planetHasArcCoreDevJobInProgress(planetId)) continue;

    for (let m = 0; m < ARC_CORE_PLANET_DEV_MODULE_IDS.length; m += 1) {
      const moduleId = ARC_CORE_PLANET_DEV_MODULE_IDS[m]!;
      const snap = buildArcCorePlanetDevModuleSnapshot(planetId, moduleId);
      if (!snap) continue;

      const action = resolveDevAction(snap);
      if (!action) continue;

      const cost = action === 'install'
        ? Math.max(0, Math.floor(snap.installCost ?? 0))
        : Math.max(0, Math.floor(snap.nextUpgradeCost ?? 0));
      if (action === 'upgrade' && cost <= 0) continue;

      insertRanked({
        planetId,
        moduleId,
        action,
        cost,
        score: scoreArcCorePlanetDevCandidate(planetId, moduleId),
      });
    }
  }
  return rankedScratch;
}

export function arcCoreExecutePlanetDevCandidate(
  candidate: ArcCorePlanetDevRankedCandidate,
): { ok: boolean; spentCr: number; reason?: string } {
  const cost = Math.max(0, Math.floor(candidate.cost));
  if (cost > 0 && !tryConsumeArcCorePlanetDevBudget(cost)) {
    return { ok: false, spentCr: 0, reason: 'budget_exhausted' };
  }

  const result = dispatchArcCorePlanetDevAction(
    candidate.planetId,
    candidate.moduleId,
    candidate.action,
    ARC_OPTS,
  );

  if (!result.ok) {
    if (cost > 0) releaseArcCorePlanetDevBudget(cost);
    return { ok: false, spentCr: 0, reason: result.reason };
  }

  return { ok: true, spentCr: cost };
}
