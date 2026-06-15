// ============================================================
// 아크코어 일일 운영 배치 — 24h 관측 데이터 기반 1회 재배치·밸런스
// ============================================================

import { runDailyPolicyAlignment } from '../aabs/dailyPolicyAlignment';
import { runPlayScenarioEconomyPass } from '../balance/runPlayScenarioEconomyPass';
import { runGlobalPlanetMasterBalancePass } from '../planetBalance/runGlobalPlanetMasterBalancePass';
import { runPlanetEnergyCorePass } from '../planetEnergy/runPlanetEnergyCorePass';
import { runPlanetEnvironmentDiversityPass } from '../planetEnvironment/runPlanetEnvironmentDiversityPass';
import { ingestBalanceOverlayDeltaIfPending } from '../economy/ingestBalanceOverlayDelta';
import { runMarketMicroAdjustPass } from '../economy/runMarketMicroAdjustPass';
import { runTradeRouteDailyMarketPass } from '../economy/runTradeRouteDailyMarketPass';
import { tryArcCoreWorldDailyUnlock } from '../worldExpansionDailyUnlock';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { flushDailyOpsObservationsToAabs } from '../userMod/dailyOpsObservationQueue';
import { runIntegratedEngageHpAdjustPass } from '../balance/runIntegratedEngageHpAdjustPass';
import { resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';

export type ArcCoreDailyOpsBatchResult = {
  ran: boolean;
  planetEnergy: boolean;
  planetEnvironment: boolean;
  planetMasterBalance: boolean;
  scenarioEconomy: boolean;
  marketPriceAdjust: boolean;
  simOverlayIngest: boolean;
  tradeRouteDailyMarket: boolean;
  aabsAlignment: boolean;
  worldExpansionUnlock: boolean;
  integratedEngageHpAdjust: boolean;
};

/**
 * 정책(`arc_core_daily_ops_policy.csv`)에 따라 하루 1회 분석·재배치를 실행한다.
 * 관측(수송 누적·궤도 시뮬 등)은 벽시계 틱 동안 누적되고, 본 배치에서만 코어·경제·AABS에 반영한다.
 */
export async function runArcCoreDailyOpsBatch(): Promise<ArcCoreDailyOpsBatchResult> {
  const policy = resolveArcCoreDailyOpsPolicy();
  const result: ArcCoreDailyOpsBatchResult = {
    ran: true,
    planetEnergy: false,
    planetEnvironment: false,
    planetMasterBalance: false,
    scenarioEconomy: false,
    marketPriceAdjust: false,
    simOverlayIngest: false,
    tradeRouteDailyMarket: false,
    aabsAlignment: false,
    worldExpansionUnlock: false,
    integratedEngageHpAdjust: false,
  };

  if (!usePlanetCoreRuntimeStore.getState().hydrated) {
    await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }

  if (policy.runPlanetEnergyPass) {
    runPlanetEnergyCorePass();
    result.planetEnergy = true;
  }
  if (policy.runPlanetEnvironmentPass) {
    runPlanetEnvironmentDiversityPass();
    result.planetEnvironment = true;
  }
  if (policy.runPlanetMasterBalancePass) {
    runGlobalPlanetMasterBalancePass();
    result.planetMasterBalance = true;
  }
  if (policy.runScenarioEconomyPass) {
    runPlayScenarioEconomyPass(true);
    result.scenarioEconomy = true;
  }
  if (policy.runMarketPricePass) {
    const ingest = await ingestBalanceOverlayDeltaIfPending();
    result.simOverlayIngest = ingest.ran;
    await runMarketMicroAdjustPass();
    result.marketPriceAdjust = true;
    const tradeRouteDaily = runTradeRouteDailyMarketPass();
    result.tradeRouteDailyMarket = tradeRouteDaily.ran;
  }
  if (policy.runAabsAlignmentPass) {
    await flushDailyOpsObservationsToAabs();
    await runDailyPolicyAlignment(true);
    result.aabsAlignment = true;
    const engageAdjust = await runIntegratedEngageHpAdjustPass();
    result.integratedEngageHpAdjust = engageAdjust.ran;
  }
  if (policy.runWorldExpansionUnlock) {
    result.worldExpansionUnlock = tryArcCoreWorldDailyUnlock();
  }

  return result;
}
