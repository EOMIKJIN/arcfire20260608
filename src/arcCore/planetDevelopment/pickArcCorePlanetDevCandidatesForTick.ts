// ============================================================
// ArcCore RED 행성개발 — 우선순위·모듈 다양성 기반 tick 선정
// ============================================================

import {
  ARC_CORE_PLANET_DEV_MODULE_IDS,
  buildArcCorePlanetDevModuleSnapshot,
  collectArcCorePlanetDevCandidates,
  planetHasArcCoreDevJobInProgress,
  scoreArcCorePlanetDevCandidate,
  type ArcCorePlanetDevModuleId,
  type ArcCorePlanetDevRankedCandidate,
} from './arcCorePlanetDevelopmentActions';
import {
  resolveArcCorePlanetDevInvestmentPolicy,
  type ArcCorePlanetDevInvestmentPolicy,
} from './arcCorePlanetDevInvestmentPolicy';
import { resolveArcCoreRedPlanetDevPortfolio } from './arcCoreRedPlanetDevPortfolio';

const MODULE_INDEX: Record<ArcCorePlanetDevModuleId, number> = {
  defense_satellite: 0,
  dev_orbit_shipyard: 1,
  dev_trade_port: 2,
  dev_research_lab: 3,
  dev_population_dome: 4,
};

const moduleInFlightScratch = new Int32Array(ARC_CORE_PLANET_DEV_MODULE_IDS.length);
const moduleTypeActiveScratch = new Uint8Array(ARC_CORE_PLANET_DEV_MODULE_IDS.length);
let planetsWithActiveJobScratch = 0;

const perPlanetPickScratch: (ArcCorePlanetDevRankedCandidate | null)[] = [];
const pickScratch: ArcCorePlanetDevRankedCandidate[] = [];

type FleetSnapshot = {
  planetsWithActiveJob: number;
  activeModuleTypeCount: number;
  firstWavePlanetsMet: boolean;
  firstWaveModulesMet: boolean;
};

function resetFleetScratch(): void {
  moduleInFlightScratch.fill(0);
  moduleTypeActiveScratch.fill(0);
  planetsWithActiveJobScratch = 0;
}

function scanRedPlanetDevFleetState(
  planetIds: readonly string[],
  policy: ArcCorePlanetDevInvestmentPolicy,
): FleetSnapshot {
  resetFleetScratch();

  for (let p = 0; p < planetIds.length; p += 1) {
    const planetId = planetIds[p]!;
    let planetHasJob = false;

    for (let m = 0; m < ARC_CORE_PLANET_DEV_MODULE_IDS.length; m += 1) {
      const moduleId = ARC_CORE_PLANET_DEV_MODULE_IDS[m]!;
      const snap = buildArcCorePlanetDevModuleSnapshot(planetId, moduleId);
      if (!snap) continue;
      if (!snap.isInstalling && !snap.isUpgrading) continue;

      planetHasJob = true;
      const idx = MODULE_INDEX[moduleId];
      moduleInFlightScratch[idx] += 1;
      moduleTypeActiveScratch[idx] = 1;
    }

    if (planetHasJob) planetsWithActiveJobScratch += 1;
  }

  let activeModuleTypeCount = 0;
  for (let i = 0; i < moduleTypeActiveScratch.length; i += 1) {
    if (moduleTypeActiveScratch[i] === 1) activeModuleTypeCount += 1;
  }

  return {
    planetsWithActiveJob: planetsWithActiveJobScratch,
    activeModuleTypeCount,
    firstWavePlanetsMet: planetsWithActiveJobScratch >= policy.minFirstWavePlanets,
    firstWaveModulesMet: activeModuleTypeCount >= policy.minFirstWaveModuleTypes,
  };
}

function moduleOrderForPlanet(
  planetId: string,
): readonly ArcCorePlanetDevModuleId[] {
  const portfolio = resolveArcCoreRedPlanetDevPortfolio(planetId);
  if (!portfolio) return ARC_CORE_PLANET_DEV_MODULE_IDS;

  const ordered: ArcCorePlanetDevModuleId[] = [
    portfolio.primaryModuleId,
    portfolio.secondaryModuleId,
  ];
  for (let i = 0; i < ARC_CORE_PLANET_DEV_MODULE_IDS.length; i += 1) {
    const moduleId = ARC_CORE_PLANET_DEV_MODULE_IDS[i]!;
    if (moduleId === portfolio.primaryModuleId || moduleId === portfolio.secondaryModuleId) continue;
    ordered.push(moduleId);
  }
  return ordered;
}

function scorePlanetModuleCandidate(
  candidate: ArcCorePlanetDevRankedCandidate,
  policy: ArcCorePlanetDevInvestmentPolicy,
  pendingModuleInFlight: Int32Array,
): number {
  const portfolio = resolveArcCoreRedPlanetDevPortfolio(candidate.planetId);
  let score = scoreArcCorePlanetDevCandidate(candidate.planetId, candidate.moduleId);

  if (portfolio) {
    if (candidate.moduleId === portfolio.primaryModuleId) {
      score += policy.portfolioPrimaryAffinityBonus;
    } else if (candidate.moduleId === portfolio.secondaryModuleId) {
      score += policy.portfolioSecondaryAffinityBonus;
    }
  }

  const idx = MODULE_INDEX[candidate.moduleId];
  const inFlight = moduleInFlightScratch[idx] + pendingModuleInFlight[idx];
  score -= inFlight * policy.sameModuleInFlightPenalty;

  return score;
}

function buildPerPlanetBestCandidates(
  planetIds: readonly string[],
  allCandidates: readonly ArcCorePlanetDevRankedCandidate[],
  policy: ArcCorePlanetDevInvestmentPolicy,
  fleet: FleetSnapshot,
  pendingModuleInFlight: Int32Array,
): void {
  perPlanetPickScratch.length = 0;

  const firstWaveOpen = !fleet.firstWavePlanetsMet || !fleet.firstWaveModulesMet;

  for (let p = 0; p < planetIds.length; p += 1) {
    const planetId = planetIds[p]!;
    perPlanetPickScratch[p] = null;

    if (planetHasArcCoreDevJobInProgress(planetId)) continue;

    const priorityRank = resolveArcCoreRedPlanetDevPortfolio(planetId)?.priorityRank ?? 99;
    if (firstWaveOpen && priorityRank > policy.firstWavePlanetPriorityCap) continue;

    const moduleOrder = moduleOrderForPlanet(planetId);
    let best: ArcCorePlanetDevRankedCandidate | null = null;
    let bestScore = -Infinity;

    for (let mo = 0; mo < moduleOrder.length; mo += 1) {
      const moduleId = moduleOrder[mo]!;
      let found: ArcCorePlanetDevRankedCandidate | null = null;
      for (let c = 0; c < allCandidates.length; c += 1) {
        const cand = allCandidates[c]!;
        if (cand.planetId === planetId && cand.moduleId === moduleId) {
          found = cand;
          break;
        }
      }
      if (!found) continue;

      const idx = MODULE_INDEX[moduleId];
      const inFlight = moduleInFlightScratch[idx] + pendingModuleInFlight[idx];
      if (inFlight >= policy.maxConcurrentSameModule) continue;

      const scored = scorePlanetModuleCandidate(found, policy, pendingModuleInFlight);
      if (scored > bestScore) {
        bestScore = scored;
        best = { ...found, score: scored };
      }
    }

    perPlanetPickScratch[p] = best;
  }
}

function selectionPriorityScore(
  candidate: ArcCorePlanetDevRankedCandidate,
  policy: ArcCorePlanetDevInvestmentPolicy,
  fleet: FleetSnapshot,
  pendingModuleInFlight: Int32Array,
  pendingModuleTypes: Uint8Array,
): number {
  let priority = candidate.score;

  const idx = MODULE_INDEX[candidate.moduleId];
  const alreadyActive = moduleTypeActiveScratch[idx] === 1;
  const pendingActive = pendingModuleTypes[idx] === 1;
  if (!alreadyActive && !pendingActive) {
    priority += 1000;
  }

  const portfolio = resolveArcCoreRedPlanetDevPortfolio(candidate.planetId);
  const rank = portfolio?.priorityRank ?? 99;
  if (!fleet.firstWavePlanetsMet && rank <= policy.firstWavePlanetPriorityCap) {
    priority += 500 - rank * 10;
  }

  const inFlight = moduleInFlightScratch[idx] + pendingModuleInFlight[idx];
  if (inFlight >= policy.maxConcurrentSameModule) {
    priority -= 5000;
  }

  return priority;
}

function pickBestForSlot(
  policy: ArcCorePlanetDevInvestmentPolicy,
  fleet: FleetSnapshot,
  pendingModuleInFlight: Int32Array,
  pendingModuleTypes: Uint8Array,
): { pick: ArcCorePlanetDevRankedCandidate; slotIndex: number } | null {
  let best: ArcCorePlanetDevRankedCandidate | null = null;
  let bestSlot = -1;
  let bestPriority = -Infinity;

  for (let i = 0; i < perPlanetPickScratch.length; i += 1) {
    const cand = perPlanetPickScratch[i];
    if (!cand) continue;

    const priority = selectionPriorityScore(
      cand,
      policy,
      fleet,
      pendingModuleInFlight,
      pendingModuleTypes,
    );
    if (priority > bestPriority) {
      bestPriority = priority;
      best = cand;
      bestSlot = i;
    }
  }

  if (!best || bestSlot < 0) return null;
  return { pick: best, slotIndex: bestSlot };
}

/**
 * 전행성 동일 모듈 일괄 투자 대신, 포트폴리오·1차 웨이브(≥3 행성·≥3 모듈) 다양성을 반영해 tick 시작 후보를 고른다.
 */
export function pickArcCorePlanetDevCandidatesForTick(
  planetIds: readonly string[],
): readonly ArcCorePlanetDevRankedCandidate[] {
  pickScratch.length = 0;
  const policy = resolveArcCorePlanetDevInvestmentPolicy();
  const allCandidates = collectArcCorePlanetDevCandidates(planetIds);
  if (allCandidates.length === 0) return pickScratch;

  const fleet = scanRedPlanetDevFleetState(planetIds, policy);
  const pendingModuleInFlight = new Int32Array(ARC_CORE_PLANET_DEV_MODULE_IDS.length);
  const pendingModuleTypes = new Uint8Array(ARC_CORE_PLANET_DEV_MODULE_IDS.length);

  buildPerPlanetBestCandidates(planetIds, allCandidates, policy, fleet, pendingModuleInFlight);

  for (let slot = 0; slot < policy.maxStartsPerTick; slot += 1) {
    const chosen = pickBestForSlot(policy, fleet, pendingModuleInFlight, pendingModuleTypes);
    if (!chosen) break;

    pickScratch.push(chosen.pick);
    perPlanetPickScratch[chosen.slotIndex] = null;

    const idx = MODULE_INDEX[chosen.pick.moduleId];
    pendingModuleInFlight[idx] += 1;
    pendingModuleTypes[idx] = 1;

    buildPerPlanetBestCandidates(planetIds, allCandidates, policy, fleet, pendingModuleInFlight);
  }

  return pickScratch;
}
