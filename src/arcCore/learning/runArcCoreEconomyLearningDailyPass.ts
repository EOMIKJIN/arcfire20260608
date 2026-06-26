// ============================================================
// 경제 학습 일일 패스 — 일 1회 배치 tail 전용 (hot path·Observation flush 없음)
// @see docs/ecosystem/ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md Tier 1 C-1
// ============================================================

import { EconomySimOverlayDelta_FROM_SIM } from '../../data/balance/generated/economySimOverlayDelta';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { ArcCoreDailyOpsBatchResult } from '../schedule/runArcCoreDailyOpsBatch';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { appendOrUpdateKpiTimeline } from './arcCoreLearningStore';

export type ArcCoreEconomyLearningDailyPassResult = {
  kpiDayKey: string;
  planetsReconciled: number;
  windowTradeGross: number;
  windowConvoyTrips: number;
  windowConvoyProfit: number;
};

function aggregateFabricWindowTotals(): {
  planetsReconciled: number;
  windowTradeGross: number;
  windowConvoyTrips: number;
  windowConvoyProfit: number;
} {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) {
    return { planetsReconciled: 0, windowTradeGross: 0, windowConvoyTrips: 0, windowConvoyProfit: 0 };
  }

  let planetsReconciled = 0;
  let windowTradeGross = 0;
  let windowConvoyTrips = 0;
  let windowConvoyProfit = 0;

  for (const planetId of Object.keys(core.byPlanetId)) {
    const runtime = core.getPlanetCoreRuntime(planetId);
    const reconcile = runtime?.detail?.economyFabric?.lastDailyReconcile;
    if (!reconcile) continue;
    planetsReconciled += 1;
    windowTradeGross += reconcile.windowPlayerTradeGross ?? reconcile.windowSummary?.playerTradeGrossCredits ?? 0;
    windowConvoyTrips += reconcile.windowConvoyTrips ?? reconcile.windowSummary?.convoyTrips ?? 0;
    windowConvoyProfit += reconcile.windowConvoyProfit ?? reconcile.windowSummary?.convoyProfitCredits ?? 0;
  }

  return { planetsReconciled, windowTradeGross, windowConvoyTrips, windowConvoyProfit };
}

/**
 * 일일 배치 직후 — KPI 타임라인 1회 갱신 (AsyncStorage 1 persist/day).
 * Observation bus flush·부트 hydrate·hot path publish 없음.
 */
export async function runArcCoreEconomyLearningDailyPass(
  batchResult: ArcCoreDailyOpsBatchResult,
): Promise<ArcCoreEconomyLearningDailyPassResult> {
  const kpiDayKey = planetAttackKstDayKey();
  const fabricTotals = aggregateFabricWindowTotals();
  const simKpi = EconomySimOverlayDelta_FROM_SIM.kpi;

  const core = usePlanetCoreRuntimeStore.getState();
  const globalEngageHpMul = core.hydrated ? core.getGlobalEngageHpMul() : undefined;

  await appendOrUpdateKpiTimeline({
    dayKey: kpiDayKey,
    economy: {
      f2pWhaleRatio: simKpi?.whaleToF2pPowerRatio,
      simKpiStatus: simKpi?.status,
      deltaId: batchResult.simOverlayIngest ? EconomySimOverlayDelta_FROM_SIM.deltaId : null,
      planetsReconciled: batchResult.economyFabric ? fabricTotals.planetsReconciled : fabricTotals.planetsReconciled,
      windowTradeGross: fabricTotals.windowTradeGross,
      windowConvoyTrips: fabricTotals.windowConvoyTrips,
    },
    combat: {
      globalEngageHpMul,
    },
  });

  if (__DEV__) {
    console.log(
      `[ArcCore/Learning] economy daily pass day=${kpiDayKey} planets=${fabricTotals.planetsReconciled} tradeGross=${fabricTotals.windowTradeGross} convoyProfit=${fabricTotals.windowConvoyProfit}`,
    );
  }

  return {
    kpiDayKey,
    planetsReconciled: fabricTotals.planetsReconciled,
    windowTradeGross: fabricTotals.windowTradeGross,
    windowConvoyTrips: fabricTotals.windowConvoyTrips,
    windowConvoyProfit: fabricTotals.windowConvoyProfit,
  };
}
