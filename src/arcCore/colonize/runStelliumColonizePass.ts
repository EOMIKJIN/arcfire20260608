import { useStelliumColonizeStore, ensureStelliumColonizeHydrated } from '../../store/stelliumColonizeStore';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { applyStelliumColonizeTickResult } from './applyStelliumColonizeTick';
import { tickStelliumColonizeDay } from './stelliumColonizeEngine';
import { resolveStelliumColonizeFleet } from './stelliumColonizeFleet';
import {
  applyStelliumColonizeDailyOpex,
  bindStelliumColonizeRuntimeFiscal,
  ensureStelliumColonizeFiscalReady,
  repayStelliumColonizeLoanDaily,
} from './stelliumColonizeFiscal';
import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';
import { backfillStelliumColonizeFromInspected } from './tryEnqueueStelliumColonize';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { StelliumColonizeCoreGauges } from './stelliumColonizeTypes';

export type StelliumColonizePassResult = {
  ran: boolean;
  enqueued: number;
  departed: number;
  succeeded: number;
  failed: number;
  loanRepaid: number;
};

function resolveGauges(planetId: string): StelliumColonizeCoreGauges {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (runtime) {
    return {
      resource: runtime.resource,
      population: runtime.population,
      defense: runtime.defense,
      technology: runtime.technology,
      environment: runtime.environment,
    };
  }
  return { resource: 50, population: 50, defense: 50, technology: 50, environment: 50 };
}

export async function runStelliumColonizePass(): Promise<StelliumColonizePassResult> {
  const empty: StelliumColonizePassResult = {
    ran: false,
    enqueued: 0,
    departed: 0,
    succeeded: 0,
    failed: 0,
    loanRepaid: 0,
  };
  const policy = resolveStelliumColonizePolicy();
  if (!policy.enabled) return empty;

  await ensureStelliumColonizeHydrated();
  await ensureStelliumColonizeFiscalReady(policy);
  const enqueued = backfillStelliumColonizeFromInspected();
  const fleet = resolveStelliumColonizeFleet(policy);
  const store = useStelliumColonizeStore.getState();
  const todayKey = planetAttackKstDayKey();
  const fiscal = bindStelliumColonizeRuntimeFiscal(policy);
  const preOpex = applyStelliumColonizeDailyOpex(store.byPlanetId, todayKey, policy);
  const ticked = tickStelliumColonizeDay({
    records: preOpex,
    todayKey,
    policy,
    resolveGauges,
    nowMs: Date.now(),
    outpostArriveSec: fleet.outpostArriveSec,
    fleetReadyAtMs: store.fleetReadyAtMs,
    handoffSec: fleet.handoffSec,
    operationalCap: fleet.operationalCap,
    fiscal,
  });
  const records = applyStelliumColonizeDailyOpex(ticked.records, todayKey, policy);

  let departed = 0;
  for (let i = 0; i < ticked.events.length; i += 1) {
    if (ticked.events[i]?.kind === 'departed') departed += 1;
  }
  const applied = applyStelliumColonizeTickResult({
    records,
    events: ticked.events,
    policy,
    persistNow: true,
    presentHqAlert: true,
    fleetReadyAtMs: ticked.fleetReadyAtMs,
    todayKey,
    applySuccessBond: true,
  });
  const loan = repayStelliumColonizeLoanDaily(todayKey, policy);
  try {
    const {
      scheduleStelliumColonizeHandoffWatch,
      scheduleStelliumColonizeOutpostWatches,
    } =
      require('./tickStelliumColonizeRealtime') as typeof import('./tickStelliumColonizeRealtime');
    scheduleStelliumColonizeHandoffWatch();
    scheduleStelliumColonizeOutpostWatches();
  } catch {
    /* 타이틀·일일 배치에서 워치 미기동 가능 */
  }
  return {
    ran: enqueued > 0 || ticked.events.length > 0 || loan.repaid > 0,
    enqueued,
    departed,
    succeeded: applied.succeeded,
    failed: applied.failed,
    loanRepaid: loan.repaid,
  };
}
