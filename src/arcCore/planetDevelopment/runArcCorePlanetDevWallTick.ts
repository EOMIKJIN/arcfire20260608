// ============================================================
// ArcCore RED 행성개발 — 60s tick (job complete + 투자)
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { tryCompleteAllPlanetDevJobs } from '../../game/planetDevelopment/planetDevelopmentListRowModel';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { listArcCoreRedOccupiedPlanetIds } from './resolveArcCoreRedOccupiedPlanets';
import {
  arcCoreExecutePlanetDevCandidate,
} from './arcCorePlanetDevelopmentActions';
import { pickArcCorePlanetDevCandidatesForTick } from './pickArcCorePlanetDevCandidatesForTick';
import { resolveArcCorePlanetDevInvestmentPolicy } from './arcCorePlanetDevInvestmentPolicy';
import {
  getArcCorePlanetDevBudgetRemaining,
  hydrateArcCorePlanetDevBudgetState,
  recordArcCorePlanetDevActualSpend,
} from './arcCorePlanetDevBudgetState';

export type ArcCorePlanetDevWallTickResult = {
  ran: boolean;
  planetsCompleted: number;
  investmentsStarted: number;
  creditsSpent: number;
};

export async function runArcCorePlanetDevWallTick(
  _nowMs: number = Date.now(),
): Promise<ArcCorePlanetDevWallTickResult> {
  const empty: ArcCorePlanetDevWallTickResult = {
    ran: false,
    planetsCompleted: 0,
    investmentsStarted: 0,
    creditsSpent: 0,
  };

  const policy = resolveArcCorePlanetDevInvestmentPolicy();
  if (!policy.investmentTickEnabled) return { ...empty, ran: true };

  const planetIds = listArcCoreRedOccupiedPlanetIds();
  for (let i = 0; i < planetIds.length; i += 1) {
    tryCompleteAllPlanetDevJobs(planetIds[i]!);
  }

  await hydrateArcCorePlanetDevBudgetState();
  if (getArcCorePlanetDevBudgetRemaining() <= 0) {
    return { ran: true, planetsCompleted: planetIds.length, investmentsStarted: 0, creditsSpent: 0 };
  }

  const vault = useArcCoreVaultStore.getState();
  if (!vault.hydrated) {
    await vault.hydrate();
  }

  const candidates = pickArcCorePlanetDevCandidatesForTick(planetIds);
  let investmentsStarted = 0;
  let creditsSpent = 0;
  const kstDayKey = planetAttackKstDayKey();

  for (let i = 0; i < candidates.length && investmentsStarted < policy.maxStartsPerTick; i += 1) {
    const candidate = candidates[i]!;
    if (candidate.cost > vault.getBalance()) break;
    if (candidate.cost > getArcCorePlanetDevBudgetRemaining()) break;

    const result = arcCoreExecutePlanetDevCandidate(candidate);
    if (!result.ok) continue;

    investmentsStarted += 1;
    creditsSpent += result.spentCr;
    if (result.spentCr > 0) {
      await recordArcCorePlanetDevActualSpend(kstDayKey, result.spentCr);
    }
  }

  return {
    ran: true,
    planetsCompleted: planetIds.length,
    investmentsStarted,
    creditsSpent,
  };
}
