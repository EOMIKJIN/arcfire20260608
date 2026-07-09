// ============================================================
// 빈부격차·WDI — 일 1회 ArcCore 배치
// ============================================================

import {
  planetCoreRuntimeToGaugeView,
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { resolveCoreOpenGameplayPlanetRef } from '../../world/coreOpenGameplayPlanets';
import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import {
  resolvePopulationDomeWdiReductionPerDay,
  resolveWealthDisparityGlobalPolicy,
} from '../balance/wealthDisparityPolicy';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  applyWealthDisparityDailyDelta,
  computePlanetWealthDisparityDailyDelta,
  resolveWealthDisparityTierFromWdi,
} from '../rebellion/computePlanetWealthDisparityDailyDelta';
import {
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
} from '../../game/planetDevelopment/planetPopulationDomeListing';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { computePlanetDevelopmentUpkeepBreakdown } from '../economy/planetDevelopmentUpkeep';
import {
  computePlanetDailyUpkeepCredits,
  resolvePlanetUpkeepPolicy,
} from '../economy/planetUpkeepPolicy';
import type { PlanetWealthDisparityDetail } from '../../store/planetCoreMetricTypes';
import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';
import { notifyPlanetRebellionOperatorAlert } from '../rebellion/notifyPlanetRebellionOperatorAlert';

export type PlanetWealthDisparityDailyPassResult = {
  ran: boolean;
  planetsProcessed: number;
};

function resolveFiscalDeficit(planetId: string): boolean {
  const bucket = usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId];
  const upkeepPolicy = resolvePlanetUpkeepPolicy();
  if (!upkeepPolicy.enabled) return false;
  const devUpkeep = computePlanetDevelopmentUpkeepBreakdown(planetId).totalCredits;
  const dailyUpkeepCredits = computePlanetDailyUpkeepCredits(
    devUpkeep,
    upkeepPolicy,
    bucket?.arcFeeCredits ?? 0,
  );
  const fee = bucket?.arcFeeCredits ?? 0;
  return dailyUpkeepCredits > 0 && fee < dailyUpkeepCredits * 0.85;
}

/**
 * 일 1회 — contestedAftermath 직후 · rebellionResolution 직전.
 */
export function runPlanetWealthDisparityDailyPass(): PlanetWealthDisparityDailyPassResult {
  const policy = resolveWealthDisparityGlobalPolicy();
  const empty: PlanetWealthDisparityDailyPassResult = { ran: false, planetsProcessed: 0 };
  if (!policy.enabled) return empty;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const kstDayKey = planetAttackKstDayKey();
  let planetsProcessed = 0;

  forEachCoreOpenGameplayPlanet(({ planetId, planet }) => {
    if (isPlanetContestedZone(planetId)) return;

    const ref = resolveCoreOpenGameplayPlanetRef(planetId);
    if (!ref) return;

    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) return;

    const prev = runtime.detail?.wealthDisparity;
    const prevWdi = prev?.wdi ?? 0;
    const rebellionPhase = prev?.rebellionPhase ?? 'none';

    const baseline = planetCsvBaselineToRuntime(ref.planet);
    const gauge = planetCoreRuntimeToGaugeView(runtime);
    const attackDaily = runtime.detail?.attackDamage?.daily;
    const attackByKind =
      attackDaily?.kstDayKey === kstDayKey ? (attackDaily.byKind ?? {}) : {};

    const popGap = runtime.detail?.contestedAftermath?.gapVsGalaxyAvg?.population;
    const domeLevel =
      isPlanetPopulationDomeInstalled(planetId)
        ? readPlanetPopulationDomeDetail(planetId).level
        : 0;

    const { delta } = computePlanetWealthDisparityDailyDelta(
      {
        currentWdi: prevWdi,
        rebellionPhase,
        baselinePopulation: baseline.population,
        runtimePopulation: gauge.population,
        attackDailyByKind: attackByKind,
        contestedAftermathPopGap: popGap,
        populationDomeLevel: domeLevel,
        fiscalDeficit: resolveFiscalDeficit(planetId),
        domeWdiReductionPerDay: resolvePopulationDomeWdiReductionPerDay(domeLevel),
      },
      policy,
    );

    const nextWdi = applyWealthDisparityDailyDelta(prevWdi, delta);
    let nextPhase = rebellionPhase;

    if (rebellionPhase === 'simmering' && nextWdi <= policy.simmeringRecoveryWdiMax) {
      nextPhase = 'none';
    }

    const prevTier =
      prev?.version === 1 && prev.rebellionPhase !== 'overthrow'
        ? prev.tier
        : resolveWealthDisparityTierFromWdi(prevWdi, policy);

    const tier =
      nextPhase === 'overthrow'
        ? 'danger'
        : resolveWealthDisparityTierFromWdi(nextWdi, policy);

    if (nextPhase !== 'overthrow' && prevTier !== tier) {
      if (tier === 'unrest' && prevTier === 'stable') {
        notifyPlanetRebellionOperatorAlert({
          planetId,
          planetLabel: planet.name ?? planetId,
          kind: 'wdi_unrest',
          wdi: nextWdi,
          kstDayKey,
        });
      } else if (tier === 'danger' && (prevTier === 'stable' || prevTier === 'unrest')) {
        notifyPlanetRebellionOperatorAlert({
          planetId,
          planetLabel: planet.name ?? planetId,
          kind: 'wdi_danger',
          wdi: nextWdi,
          kstDayKey,
        });
      }
    }

    const unchanged =
      prev?.version === 1
      && prev.wdi === nextWdi
      && prev.tier === tier
      && prev.rebellionPhase === nextPhase
      && prev.kstDayKey === kstDayKey;

    if (unchanged) return;

    const detail: PlanetWealthDisparityDetail = {
      version: 1,
      wdi: nextWdi,
      tier,
      rebellionPhase: nextPhase,
      kstDayKey,
      updatedAtMs: Date.now(),
    };

    coreStore.patchPlanetCore(planetId, {
      detail: {
        ...runtime.detail,
        wealthDisparity: detail,
      },
    });
    planetsProcessed += 1;
  });

  return { ran: planetsProcessed > 0, planetsProcessed };
}
