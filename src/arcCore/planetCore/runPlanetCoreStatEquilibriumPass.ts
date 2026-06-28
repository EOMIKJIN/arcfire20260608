// ============================================================
// 행성 5대 스탯 일 1회 균형 — 개발 목표 수렴 · 재정 압력 · 자연 도태
// runFacilityStatNudgePass 대체 (v2.4)
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  planetCsvBaselineToRuntime,
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { useWorldStore } from '../../store/worldStore';
import type { Planet, PlanetClanHold, StarSystem } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { resolvePlanetCoreStatEquilibriumPolicy } from '../balance/planetCoreStatEquilibriumPolicy';
import {
  computePlanetDevelopmentStatTargets,
  resolvePlanetDevelopmentStatWeights,
  sumPlanetDevelopmentStatWeightTotal,
} from './computePlanetDevelopmentStatTargets';
import {
  resolvePlanetDevelopmentAggregateLevelSum,
  applyPlanetDevUpkeepEfficiency,
} from '../planetDevelopment/planetDevelopmentLevelBenefits';
import {
  computePlanetDevelopmentDailyUpkeepCredits,
  computePlanetDevelopmentUpkeepBreakdown,
} from '../economy/planetDevelopmentUpkeep';
import {
  computePlanetDailyUpkeepCredits,
  resolvePlanetFiscalPolicy,
  resolvePlanetUpkeepPolicy,
} from '../economy/planetUpkeepPolicy';
import { buildPlanetFiscalSnapshot } from '../economy/planetFiscalKpi';
import { listConvoyDemandPlanetIds } from '../economy/tradeRouteRegistry';

export type PlanetCoreStatEquilibriumPassResult = {
  ran: boolean;
  planetsProcessed: number;
  planetsDrifted: number;
  planetsDecayed: number;
};

const GAUGE_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;

function clampGauge(g: PlanetCoreGaugeView): PlanetCoreGaugeView {
  return {
    resource: Math.max(0, Math.min(100, Math.round(g.resource))),
    population: Math.max(0, Math.min(100, Math.round(g.population))),
    defense: Math.max(0, Math.min(100, Math.round(g.defense))),
    technology: Math.max(0, Math.min(100, Math.round(g.technology))),
    environment: Math.max(0, Math.min(100, Math.round(g.environment))),
  };
}

function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  if (hold.homePlayerUid === playerUid) return true;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  return false;
}

function findPlanetInWorld(planetId: string): Planet | undefined {
  for (const sys of Object.values(useWorldStore.getState().systems)) {
    const p = sys.planets.find((x) => x.id === planetId);
    if (p) return p;
  }
  return undefined;
}

function csvBaselineGauge(planet: Planet): PlanetCoreGaugeView {
  return planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(planet));
}

function applyDriftTowardTarget(
  current: PlanetCoreGaugeView,
  target: PlanetCoreGaugeView,
  rate: number,
  maxGain: number,
): PlanetCoreGaugeView {
  const next = { ...current };
  for (const k of GAUGE_KEYS) {
    const delta = (target[k] - current[k]) * rate;
    const clamped = Math.max(-maxGain, Math.min(maxGain, delta));
    next[k] = current[k] + clamped;
  }
  return next;
}

function applyDecayAboveBaseline(
  gauge: PlanetCoreGaugeView,
  baseline: PlanetCoreGaugeView,
  decayPts: Partial<PlanetCoreGaugeView>,
  maxDrop: number,
): PlanetCoreGaugeView {
  const next = { ...gauge };
  for (const k of GAUGE_KEYS) {
    const d = decayPts[k] ?? 0;
    if (d <= 0) continue;
    const floor = baseline[k];
    if (next[k] <= floor) continue;
    next[k] = Math.max(floor, next[k] - Math.min(maxDrop, d));
  }
  return next;
}

function applyBonus(
  gauge: PlanetCoreGaugeView,
  bonus: Partial<PlanetCoreGaugeView>,
  maxGain: number,
): PlanetCoreGaugeView {
  const next = { ...gauge };
  for (const k of GAUGE_KEYS) {
    const b = bonus[k] ?? 0;
    if (b <= 0) continue;
    next[k] = Math.min(100, next[k] + Math.min(maxGain, b));
  }
  return next;
}

type FiscalStatusByPlanet = Map<string, 'ok' | 'warn' | 'fail' | 'deficit'>;

function buildFiscalStatusMap(): FiscalStatusByPlanet {
  const map: FiscalStatusByPlanet = new Map();
  const upkeepPolicy = resolvePlanetUpkeepPolicy();
  if (!upkeepPolicy.enabled) return map;

  const fiscalPolicy = resolvePlanetFiscalPolicy();
  const ledger = usePlanetTradeFeeLedgerStore.getState();
  const inputs = listConvoyDemandPlanetIds().map((planetId) => {
    const bucket = ledger.byPlanetId[planetId];
    const devUpkeep = computePlanetDevelopmentUpkeepBreakdown(planetId).totalCredits;
    const dailyUpkeepCredits = computePlanetDailyUpkeepCredits(
      devUpkeep,
      upkeepPolicy,
      bucket?.arcFeeCredits ?? 0,
    );
    return {
      planetId,
      dailyArcFeeCredits: bucket?.arcFeeCredits ?? 0,
      dailyUpkeepCredits,
    };
  });

  const snapshot = buildPlanetFiscalSnapshot(inputs, fiscalPolicy);
  for (const row of snapshot.rows) {
    map.set(row.planetId, row.status);
  }
  return map;
}

/**
 * 일 1회 — upkeep·fiscal 직후 호출.
 * 개발 → 목표(50→87) 수렴, deficit/미납 → P·R·E 하락, 미개발 → 자연 도태.
 */
export function runPlanetCoreStatEquilibriumPass(): PlanetCoreStatEquilibriumPassResult {
  const policy = resolvePlanetCoreStatEquilibriumPolicy();
  const empty: PlanetCoreStatEquilibriumPassResult = {
    ran: false,
    planetsProcessed: 0,
    planetsDrifted: 0,
    planetsDecayed: 0,
  };
  if (!policy.enabled) return empty;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const fiscalByPlanet = buildFiscalStatusMap();
  const systems = useWorldStore.getState().systems;
  const planetIds = new Set<string>();

  for (const sys of Object.values(systems) as StarSystem[]) {
    for (const p of sys.planets) planetIds.add(p.id);
  }
  for (const id of Object.keys(coreStore.byPlanetId)) planetIds.add(id);

  let planetsProcessed = 0;
  let planetsDrifted = 0;
  let planetsDecayed = 0;

  for (const planetId of planetIds) {
    const planet = findPlanetInWorld(planetId);
    const baseline = planet ? csvBaselineGauge(planet) : {
      resource: policy.baselineStatPct,
      population: policy.baselineStatPct,
      defense: policy.baselineStatPct,
      technology: policy.baselineStatPct,
      environment: policy.baselineStatPct,
    };

    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;

    let gauge = planetCoreRuntimeToGaugeView(runtime);
    const devLevelSum = resolvePlanetDevelopmentAggregateLevelSum(planetId);
    const devWeightTotal = sumPlanetDevelopmentStatWeightTotal(
      resolvePlanetDevelopmentStatWeights(planetId),
    );
    const target = computePlanetDevelopmentStatTargets(planetId, baseline);
    const hold = holds[planetId];
    const playerOwned = hold ? isPlayerOwnedHold(hold, playerUid) : false;

    const before = { ...gauge };

    if (devWeightTotal > 0) {
      gauge = applyDriftTowardTarget(
        gauge,
        target,
        policy.devDriftRatePerDay,
        policy.maxDailyStatGainPerMetric,
      );
    }

    const lowDevelopment =
      devLevelSum <= policy.naturalDecayMinDevLevelSum || devWeightTotal <= 0;
    if (lowDevelopment) {
      gauge = applyDecayAboveBaseline(
        gauge,
        baseline,
        {
          population: policy.naturalDecayPerDay,
          environment: policy.naturalDecayPerDay * 0.85,
          resource: policy.naturalDecayPerDay * 0.65,
          technology: policy.naturalDecayPerDay * 0.45,
        },
        policy.maxDailyStatDropPerMetric,
      );
      planetsDecayed += 1;
    }

    if (playerOwned) {
      const fiscalStatus = fiscalByPlanet.get(planetId) ?? 'ok';
      const upkeepDetail = runtime.detail?.lastDailyUpkeep;
      const upkeepFailed = upkeepDetail?.paid === false;

      const fees = usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId]?.arcFeeCredits ?? 0;
      const devUpkeep = applyPlanetDevUpkeepEfficiency(
        planetId,
        computePlanetDevelopmentDailyUpkeepCredits(planetId),
      );
      const upkeep = computePlanetDailyUpkeepCredits(
        devUpkeep,
        resolvePlanetUpkeepPolicy(),
        fees,
      );

      if (fiscalStatus === 'deficit' || (upkeep > 0 && fees < upkeep)) {
        gauge = applyDecayAboveBaseline(
          gauge,
          baseline,
          {
            population: policy.fiscalDeficitPopulationDecay,
            resource: policy.fiscalDeficitResourceDecay,
            environment: policy.fiscalDeficitEnvironmentDecay,
            technology: policy.fiscalDeficitTechnologyDecay,
          },
          policy.maxDailyStatDropPerMetric,
        );
        planetsDecayed += 1;
      } else if (upkeep > 0 && fees >= upkeep * 1.15 && !upkeepFailed) {
        gauge = applyBonus(
          gauge,
          {
            population: policy.fiscalSurplusPopulationNudge,
            resource: policy.fiscalSurplusResourceNudge,
          },
          policy.maxDailyStatGainPerMetric,
        );
      }

      if (upkeepFailed) {
        gauge = applyDecayAboveBaseline(
          gauge,
          baseline,
          {
            population:
              policy.playerUpkeepFailPopulationDecay + policy.playerUpkeepFailExtraDecay,
            resource: policy.playerUpkeepFailExtraDecay * 0.7,
            defense: policy.playerUpkeepFailExtraDecay * 0.4,
          },
          policy.maxDailyStatDropPerMetric,
        );
        planetsDecayed += 1;
      }
    }

    gauge = clampGauge(gauge);

    const changed = GAUGE_KEYS.some((k) => gauge[k] !== before[k]);
    if (!changed) continue;

    planetsProcessed += 1;
    if (devWeightTotal > 0) planetsDrifted += 1;

    coreStore.patchPlanetCore(planetId, gauge);
  }

  return {
    ran: planetsProcessed > 0,
    planetsProcessed,
    planetsDrifted,
    planetsDecayed,
  };
}
