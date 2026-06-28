// ============================================================
// 행성 재정 closed loop — 일 1회 KPI 기록 + 지속 WARN → trade_route 미세조정
// hot path·부트 금지 · AsyncStorage persist는 learning/overlay 각 1회
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { getEconomyPriceMicroPolicyNum } from '../balance/balanceTableRegistry';
import {
  appendOrUpdateKpiTimeline,
  getArcCoreLearningStoreSnapshot,
  hydrateArcCoreLearningStore,
} from '../learning/arcCoreLearningStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { listConvoyDemandPlanetIds } from './tradeRouteRegistry';
import { computePlanetDevelopmentUpkeepBreakdown } from './planetDevelopmentUpkeep';
import {
  computePlanetDailyUpkeepCredits,
  getFiscalClosedLoopTradeRouteStepPct,
  getFiscalClosedLoopWarnStreakDays,
  resolvePlanetFiscalPolicy,
  resolvePlanetUpkeepPolicy,
} from './planetUpkeepPolicy';
import { buildPlanetFiscalSnapshot } from './planetFiscalKpi';
import { useEconomyPriceOverlayStore } from './economyPriceOverlayStore';

export type PlanetFiscalBalanceClosedLoopResult = {
  ran: boolean;
  kstDayKey: string;
  fiscalOverall: 'ok' | 'warn' | 'fail';
  maxFeeUpkeepRatio: number;
  gini: number;
  warnStreak: number;
  tradeRouteAdjusted: boolean;
};

export async function runPlanetFiscalBalanceClosedLoopPass(): Promise<PlanetFiscalBalanceClosedLoopResult> {
  const kstDayKey = planetAttackKstDayKey();
  const empty: PlanetFiscalBalanceClosedLoopResult = {
    ran: false,
    kstDayKey,
    fiscalOverall: 'ok',
    maxFeeUpkeepRatio: 0,
    gini: 0,
    warnStreak: 0,
    tradeRouteAdjusted: false,
  };

  const upkeepPolicy = resolvePlanetUpkeepPolicy();
  if (!upkeepPolicy.enabled) return empty;

  if (!usePlanetTradeFeeLedgerStore.getState().hydrated) {
    await usePlanetTradeFeeLedgerStore.getState().hydrate();
  }

  const fiscalPolicy = resolvePlanetFiscalPolicy();
  const planetIds = listConvoyDemandPlanetIds();
  const inputs = planetIds.map((planetId) => {
    const bucket = usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId];
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

  await hydrateArcCoreLearningStore();
  const timeline = getArcCoreLearningStoreSnapshot().kpiTimeline;
  const streakDays = getFiscalClosedLoopWarnStreakDays();

  let priorStreak = 0;
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const o = timeline[i]?.economy?.fiscalOverall;
    if (o === 'warn' || o === 'fail') priorStreak += 1;
    else break;
  }
  const todayWarn = snapshot.overall === 'warn' || snapshot.overall === 'fail';
  const effectiveStreak = todayWarn ? priorStreak + 1 : 0;

  let tradeRouteAdjusted = false;
  if (
    effectiveStreak >= streakDays
    && (snapshot.overall === 'warn' || snapshot.overall === 'fail')
  ) {
    const overlay = useEconomyPriceOverlayStore.getState();
    if (!overlay.hydrated) await overlay.loadAsync();
    const stepPct = getFiscalClosedLoopTradeRouteStepPct() / 100;
    const maxDrift = getEconomyPriceMicroPolicyNum('max_cumulative_price_drift_pct', 12) / 100;
    const current = overlay.getCategoryMul('trade_route');
    const target = Math.max(1 - maxDrift, current - stepPct);
    overlay.applyCategoryStep('trade_route', target, stepPct, maxDrift);
    overlay.markAdjust(0);
    await overlay.persistAsync();
    tradeRouteAdjusted = true;
  }

  await appendOrUpdateKpiTimeline({
    dayKey: kstDayKey,
    economy: {
      fiscalMaxFeeUpkeepRatio: snapshot.maxFeeUpkeepRatio,
      fiscalGini: snapshot.gini,
      fiscalOverall: snapshot.overall,
      fiscalWarnStreak: effectiveStreak,
      fiscalFailPlanets: snapshot.failCount,
      fiscalTradeRouteAdjusted: tradeRouteAdjusted,
    },
    combat: {},
  });

  if (__DEV__) {
    console.log(
      `[ArcCore/Fiscal] day=${kstDayKey} overall=${snapshot.overall} maxRatio=${snapshot.maxFeeUpkeepRatio} gini=${snapshot.gini} streak=${effectiveStreak} adjust=${tradeRouteAdjusted}`,
    );
  }

  return {
    ran: true,
    kstDayKey,
    fiscalOverall: snapshot.overall,
    maxFeeUpkeepRatio: snapshot.maxFeeUpkeepRatio,
    gini: snapshot.gini,
    warnStreak: effectiveStreak,
    tradeRouteAdjusted,
  };
}
