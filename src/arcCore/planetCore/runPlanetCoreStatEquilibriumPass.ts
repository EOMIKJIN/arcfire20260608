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
import { listCoreOpenGameplayPlanetIds, resolveCoreOpenGameplayPlanetRef } from '../../world/coreOpenGameplayPlanets';
import type { Planet } from '../../types';
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
import { resolvePlanetCoreStatAuthority } from '../balance/planetCoreStatAuthorityPolicy';
import {
  isPlayerOwnedHold,
  resolvePlanetCoreStatAuthorityContext,
} from './resolvePlanetCoreStatContext';
import { clampResourceToOperatingBand } from '../planetResource/planetResourceEcosystemPolicy';
import {
  isPlanetCoreGaugeIntentBatchActive,
  pushPlanetCoreGaugeIntent,
} from './planetCoreGaugeIntent';

export type PlanetCoreStatEquilibriumPassResult = {
  ran: boolean;
  planetsProcessed: number;
  planetsDrifted: number;
  planetsDecayed: number;
  npcEconomyDecayed: number;
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

function findPlanetInWorld(planetId: string): Planet | undefined {
  return resolveCoreOpenGameplayPlanetRef(planetId)?.planet;
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

function isFiscalDeficitForPlanet(
  planetId: string,
  fiscalByPlanet: FiscalStatusByPlanet,
): boolean {
  const fiscalStatus = fiscalByPlanet.get(planetId);
  if (fiscalStatus === 'deficit') return true;
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
  return upkeep > 0 && fees < upkeep;
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
    npcEconomyDecayed: 0,
  };
  if (!policy.enabled) return empty;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const fiscalByPlanet = buildFiscalStatusMap();
  const planetIds = new Set(listCoreOpenGameplayPlanetIds());

  let planetsProcessed = 0;
  let planetsDrifted = 0;
  let planetsDecayed = 0;
  let npcEconomyDecayed = 0;

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
    const authority = resolvePlanetCoreStatAuthority(
      resolvePlanetCoreStatAuthorityContext(planetId),
    );

    const before = { ...gauge };
    let devEnd = before;

    if (authority.equilibriumDev && devWeightTotal > 0) {
      devEnd = applyDriftTowardTarget(
        gauge,
        target,
        policy.devDriftRatePerDay,
        policy.maxDailyStatGainPerMetric,
      );
      gauge = devEnd;
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

    if (playerOwned && authority.economyDecay) {
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
    } else if (
      authority.economyDecay &&
      authority.npcEconomyDecayMul > 0 &&
      isFiscalDeficitForPlanet(planetId, fiscalByPlanet)
    ) {
      const mul = authority.npcEconomyDecayMul;
      gauge = applyDecayAboveBaseline(
        gauge,
        baseline,
        {
          population: policy.fiscalDeficitPopulationDecay * mul,
          resource: policy.fiscalDeficitResourceDecay * mul,
          environment: policy.fiscalDeficitEnvironmentDecay * mul,
          technology: policy.fiscalDeficitTechnologyDecay * mul,
        },
        policy.maxDailyStatDropPerMetric,
      );
      planetsDecayed += 1;
      npcEconomyDecayed += 1;
    }

    gauge = clampGauge(gauge);

    if (playerOwned) {
      gauge = { ...gauge, resource: clampResourceToOperatingBand(gauge.resource) };
    }

    const changed = GAUGE_KEYS.some((k) => gauge[k] !== before[k]);
    if (!changed) continue;

    planetsProcessed += 1;
    if (devWeightTotal > 0 && authority.equilibriumDev) planetsDrifted += 1;

    if (isPlanetCoreGaugeIntentBatchActive()) {
      const devDelta: Partial<PlanetCoreGaugeView> = {};
      for (const k of GAUGE_KEYS) {
        const d = devEnd[k] - before[k];
        if (d !== 0) devDelta[k] = d;
      }
      if (Object.keys(devDelta).length > 0) {
        pushPlanetCoreGaugeIntent(planetId, devDelta, 'player_dev');
      }
      const arcDelta: Partial<PlanetCoreGaugeView> = {};
      for (const k of GAUGE_KEYS) {
        const d = gauge[k] - devEnd[k];
        if (d !== 0) arcDelta[k] = d;
      }
      if (Object.keys(arcDelta).length > 0) {
        pushPlanetCoreGaugeIntent(planetId, arcDelta, 'arc_core');
      }
    } else {
      coreStore.patchPlanetCore(planetId, gauge);
    }
  }

  return {
    ran: planetsProcessed > 0,
    planetsProcessed,
    planetsDrifted,
    planetsDecayed,
    npcEconomyDecayed,
  };
}
