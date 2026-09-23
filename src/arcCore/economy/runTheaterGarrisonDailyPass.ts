// ============================================================
// 일 1회 — 전선 주둔 유지·재건 (내정 800과 별축)
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { resolveFactionVaultForPlanetId } from './resolveFactionVault';
import { getArcCoreTheaterGarrisonPolicy } from '../territorial/arcCoreTheaterGarrisonPolicy';
import { planTheaterRebuildSpend } from '../territorial/applyTheaterGarrisonAdjustments';
import {
  dropTheaterGarrisonIfNotInRotation,
  getTheaterGarrisonPct,
  hydrateTheaterGarrisonStore,
  listTheaterGarrisonPlanetIds,
  setTheaterGarrisonPct,
} from '../territorial/theaterGarrisonStore';
import { hydrateTerritorialPassObservation } from '../territorial/territorialPassObservation';
import {
  isPlanetInActiveTerritorialRotation,
  resolveWarTheaterState,
} from '../territorial/resolveWarTheaterState';
import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';
import { listTerritorialCombatPolicies } from '../territorial/arcCoreTerritorialCombatPolicy';

export type TheaterGarrisonDailyPassResult = {
  ran: boolean;
  planetsProcessed: number;
  upkeepSpent: number;
  rebuildSpent: number;
};

export async function runTheaterGarrisonDailyPass(): Promise<TheaterGarrisonDailyPassResult> {
  const policy = getArcCoreTheaterGarrisonPolicy();
  const empty: TheaterGarrisonDailyPassResult = {
    ran: false,
    planetsProcessed: 0,
    upkeepSpent: 0,
    rebuildSpent: 0,
  };
  if (!policy.enabled) return empty;

  await hydrateTheaterGarrisonStore();
  await hydrateTerritorialPassObservation();
  const war = useClanWarFoundationStore.getState();
  if (!war.hydrated) await war.loadLocalClanWarFoundation();
  const ledger = usePlanetTradeFeeLedgerStore.getState();
  if (!ledger.hydrated) await ledger.hydrate();
  ledger.ensureDay(planetAttackKstDayKey());

  const holds = war.planetHolds;
  const policies = listTerritorialCombatPolicies();
  const planetIds = new Set<string>();
  const policyByPlanetId = new Map<string, (typeof policies)[number]>();
  for (let i = 0; i < policies.length; i += 1) {
    const p = policies[i]!;
    if (p.enabled && p.contestedZone) {
      planetIds.add(p.planetId);
      policyByPlanetId.set(p.planetId, p);
    }
  }
  const stored = listTheaterGarrisonPlanetIds();
  for (let i = 0; i < stored.length; i += 1) planetIds.add(stored[i]!);

  let planetsProcessed = 0;
  let upkeepSpent = 0;
  let rebuildSpent = 0;

  for (const planetId of planetIds) {
    if (!isPlanetInActiveTerritorialRotation(planetId)) {
      dropTheaterGarrisonIfNotInRotation(planetId);
      continue;
    }
    const policyRow = policyByPlanetId.get(planetId);
    const systemId = policyRow?.systemId ?? holds[planetId]?.systemId ?? '';
    if (!systemId) continue;
    const holdSide = resolveHoldFactionSide(holds[planetId]?.occupierClanId);
    const theater = resolveWarTheaterState({ planetId, systemId, holdSide, holds });
    if (!theater.garrisonEligible) {
      dropTheaterGarrisonIfNotInRotation(planetId);
      continue;
    }

    const vault = resolveFactionVaultForPlanetId(planetId);
    if (vault) await vault.ensureHydrated();

    const current = getTheaterGarrisonPct(planetId);
    const localAvail = ledger.getBucket(planetId).arcFeeCredits;
    const plan = planTheaterRebuildSpend({
      currentPct: current,
      localFeeAvailable: localAvail,
    });

    if (vault && plan.upkeepCredits > 0) {
      const paid = vault.spendUpToBalance(plan.upkeepCredits, {
        kind: 'theater_garrison_upkeep',
        planetId,
      });
      upkeepSpent += paid.spent;
    }

    let nationPaid = 0;
    if (plan.rebuildLocalSpend > 0) {
      ledger.spendArcFeeCredits(planetId, plan.rebuildLocalSpend);
    }
    if (vault && plan.rebuildNationSpend > 0) {
      const paid = vault.spendUpToBalance(plan.rebuildNationSpend, {
        kind: 'theater_garrison_rebuild',
        planetId,
      });
      nationPaid = paid.spent;
    }
    const funded = plan.rebuildLocalSpend + nationPaid;
    const costPerPct = policy.theaterDailyUpkeepCredits / 100;
    const gained = costPerPct > 0 ? Math.floor(funded / costPerPct) : 0;
    const nextPct = Math.min(100, current + gained);
    setTheaterGarrisonPct(planetId, nextPct);
    rebuildSpent += funded;
    planetsProcessed += 1;
  }

  return { ran: true, planetsProcessed, upkeepSpent, rebuildSpent };
}
