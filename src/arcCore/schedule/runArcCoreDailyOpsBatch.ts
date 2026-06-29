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
import { runSynthColonizationAdvancePass } from '../worldExpansionSynthColonization';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { flushDailyOpsObservationsToAabs } from '../userMod/dailyOpsObservationQueue';
import { runIntegratedEngageHpAdjustPass } from '../balance/runIntegratedEngageHpAdjustPass';
import { runPlanetEconomyFabricDailyPass } from '../economy/planetEconomyFabric';
import { runArcCoreConvoyDailySettlementPass } from '../economy/runArcCoreConvoyDailySettlementPass';
import { runArcCorePlanetUpkeepDailyPass } from '../economy/runArcCorePlanetUpkeepDailyPass';
import { runPlanetPgpDailyPass } from '../economy/runPlanetPgpDailyPass';
import { runPlanetCoreStatEquilibriumPass } from '../planetCore/runPlanetCoreStatEquilibriumPass';
import { runLaboratoryRdSpeedPass } from '../planetFacility/runLaboratoryRdSpeedPass';
import { runTavernBountyRefreshPass } from '../planetFacility/runTavernBountyRefreshPass';
import { runArcCoreEconomyLearningDailyPass } from '../learning/runArcCoreEconomyLearningDailyPass';
import { runPlanetFiscalBalanceClosedLoopPass } from '../economy/runPlanetFiscalBalanceClosedLoopPass';
import { runPlanetMineralLedgerDailyPass } from '../planetResource/runPlanetMineralLedgerDailyPass';
import { integrateUnlockedSynthFrontierStatEconomyAsync } from '../planetCore/integrateUnlockedSynthFrontierStatEconomy';
import { pushArcCoreDailyKpiToRtdbIfDue } from '../learning/pushArcCoreDailyKpiToRtdb';
import { isArcCoreRtdbAvailableForSession } from '../../firebase/rtdbRefs';
import { getCurrentUser } from '../../firebase/auth';
import { resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';
import {
  beginPlanetCoreStatOpsTrendSnapshot,
  commitPlanetCoreStatOpsTrendAfterBatch,
} from '../planetCore/planetCoreStatOpsTrend';

export type ArcCoreDailyOpsBatchResult = {
  ran: boolean;
  planetEnergy: boolean;
  planetEnvironment: boolean;
  planetMasterBalance: boolean;
  economyFabric: boolean;
  scenarioEconomy: boolean;
  marketPriceAdjust: boolean;
  simOverlayIngest: boolean;
  tradeRouteDailyMarket: boolean;
  aabsAlignment: boolean;
  worldExpansionUnlock: boolean;
  integratedEngageHpAdjust: boolean;
  planetUpkeep: boolean;
  convoyDailySettlement: boolean;
  facilityStatNudge: boolean;
  laboratoryRdSpeed: boolean;
  tavernBountyRefresh: boolean;
  planetPgp: boolean;
  synthColonizationAdvance: boolean;
  economyLearning: boolean;
  planetFiscalClosedLoop: boolean;
  planetMineralLedger: boolean;
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
    economyFabric: false,
    scenarioEconomy: false,
    marketPriceAdjust: false,
    simOverlayIngest: false,
    tradeRouteDailyMarket: false,
    aabsAlignment: false,
    worldExpansionUnlock: false,
    integratedEngageHpAdjust: false,
    planetUpkeep: false,
    convoyDailySettlement: false,
    facilityStatNudge: false,
    laboratoryRdSpeed: false,
    tavernBountyRefresh: false,
    planetPgp: false,
    synthColonizationAdvance: false,
    economyLearning: false,
    planetFiscalClosedLoop: false,
    planetMineralLedger: false,
  };

  if (!usePlanetCoreRuntimeStore.getState().hydrated) {
    await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }

  beginPlanetCoreStatOpsTrendSnapshot();

  const colonizationEarly = runSynthColonizationAdvancePass();
  result.synthColonizationAdvance = colonizationEarly.advanced > 0;
  if (policy.runWorldExpansionUnlock) {
    result.worldExpansionUnlock = tryArcCoreWorldDailyUnlock();
  }
  await integrateUnlockedSynthFrontierStatEconomyAsync();

  if (policy.runPlanetEnergyPass) {
    runPlanetEnergyCorePass();
    result.planetEnergy = true;
  }
  const mineralLedger = runPlanetMineralLedgerDailyPass();
  result.planetMineralLedger = mineralLedger.ran;
  if (policy.runPlanetEnvironmentPass) {
    runPlanetEnvironmentDiversityPass();
    result.planetEnvironment = true;
  }
  if (policy.runPlanetMasterBalancePass) {
    runGlobalPlanetMasterBalancePass();
    result.planetMasterBalance = true;
  }
  if (policy.runScenarioEconomyPass) {
    const fabric = runPlanetEconomyFabricDailyPass();
    result.economyFabric = fabric.ran;
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
  const convoyDaily = await runArcCoreConvoyDailySettlementPass();
  result.convoyDailySettlement = convoyDaily.ran;

  const upkeep = await runArcCorePlanetUpkeepDailyPass();
  result.planetUpkeep = upkeep.ran;

  const fiscalLoop = await runPlanetFiscalBalanceClosedLoopPass();
  result.planetFiscalClosedLoop = fiscalLoop.ran;

  const statEquilibrium = runPlanetCoreStatEquilibriumPass();
  result.facilityStatNudge = statEquilibrium.ran;
  const labRd = runLaboratoryRdSpeedPass();
  result.laboratoryRdSpeed = labRd.ran;
  const tavernRefresh = runTavernBountyRefreshPass();
  result.tavernBountyRefresh = tavernRefresh.ran;

  const pgpPass = runPlanetPgpDailyPass();
  result.planetPgp = pgpPass.ran;

  try {
    const learningResult = await runArcCoreEconomyLearningDailyPass(result);
    result.economyLearning = true;
    await pushArcCoreDailyKpiToRtdbIfDue({
      localDeviceId: getCurrentUser().uid,
      learningResult,
      rtdbAvailable: isArcCoreRtdbAvailableForSession(),
    });
  } catch {
    /* learning KPI·RTDB push는 비차단 */
  }

  commitPlanetCoreStatOpsTrendAfterBatch();

  return result;
}
