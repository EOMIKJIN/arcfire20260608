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
import { runArcCoreCentralBankExpenditurePass } from '../economy/runArcCoreCentralBankExpenditurePass';
import { runArcCorePlanetUpkeepDailyPass } from '../economy/runArcCorePlanetUpkeepDailyPass';
import { runPlanetPgpDailyPass } from '../economy/runPlanetPgpDailyPass';
import { runPlanetOwnershipDeedPricingDailyPass } from '../economy/runPlanetOwnershipDeedPricingDailyPass';
import { runPlanetCoreStatEquilibriumPass } from '../planetCore/runPlanetCoreStatEquilibriumPass';
import { runLaboratoryRdSpeedPass } from '../planetFacility/runLaboratoryRdSpeedPass';
import { runTavernBountyRefreshPass } from '../planetFacility/runTavernBountyRefreshPass';
import { runArcCoreInstanceMissionDailyPass } from '../missions/runArcCoreInstanceMissionDailyPass';
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
import { beginPlanetCoreGaugeIntentBatch } from '../planetCore/planetCoreGaugeIntent';
import { runPlanetCoreGaugeCompositionApplyPass } from '../planetCore/runPlanetCoreGaugeCompositionApplyPass';
import { runContestedZoneAftermathDailyPass } from '../planetCore/runContestedZoneAftermathDailyPass';
import { yieldJsThread } from './yieldJsThread';
import { runPlanetWealthDisparityDailyPass } from '../planetCore/runPlanetWealthDisparityDailyPass';
import { runPlanetRebellionResolutionDailyPass } from '../planetCore/runPlanetRebellionResolutionDailyPass';

/**
 * 개별 패스 격리 — 패스 하나가 던지면 이후 전부(트렌드 커밋·완료 마크 포함)가 멈춰
 * "시작 마킹만 매일 갱신되고 실제로는 2026-07-18 이후 한 번도 완료 못 함" 회귀가 있었다
 * (task_id=daily-ops-batch-step-isolation-20260803, 실기 세이브로 재현 확인).
 * 패스 1개 실패해도 나머지 패스·트렌드 커밋·완료 마크는 계속 진행 — 실패만 로그로 격리.
 */
function reportDailyOpsStepFailure(step: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[ArcCore/DailyOps] step=${step} threw — isolated, batch continues`, err);
}

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
  centralBankExpenditure: boolean;
  facilityStatNudge: boolean;
  contestedZoneAftermath: boolean;
  wealthDisparity: boolean;
  rebellionResolution: boolean;
  planetCoreGaugeComposition: boolean;
  laboratoryRdSpeed: boolean;
  tavernBountyRefresh: boolean;
  arcCoreInstanceMissionDaily: boolean;
  planetPgp: boolean;
  synthColonizationAdvance: boolean;
  economyLearning: boolean;
  planetFiscalClosedLoop: boolean;
  planetMineralLedger: boolean;
  planetOwnershipDeedPricing: boolean;
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
    centralBankExpenditure: false,
    facilityStatNudge: false,
    contestedZoneAftermath: false,
    wealthDisparity: false,
    rebellionResolution: false,
    planetCoreGaugeComposition: false,
    laboratoryRdSpeed: false,
    tavernBountyRefresh: false,
    arcCoreInstanceMissionDaily: false,
    planetPgp: false,
    synthColonizationAdvance: false,
    economyLearning: false,
    planetFiscalClosedLoop: false,
    planetMineralLedger: false,
    planetOwnershipDeedPricing: false,
  };

  if (!usePlanetCoreRuntimeStore.getState().hydrated) {
    await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }

  beginPlanetCoreStatOpsTrendSnapshot();
  beginPlanetCoreGaugeIntentBatch();

  // 각 전-행성 동기 패스 사이에 매크로태스크 yield — 정오 이후 첫 부팅에서 이 배치가
  // 타이틀 버튼 활성화 직후 실행될 때, 탭 등 사용자 입력이 수 초간 막히지 않게 한다(2026-07-19).
  try {
    const colonizationEarly = runSynthColonizationAdvancePass();
    result.synthColonizationAdvance = colonizationEarly.advanced > 0;
  } catch (err) {
    reportDailyOpsStepFailure('synthColonizationAdvance', err);
  }
  if (policy.runWorldExpansionUnlock) {
    try {
      result.worldExpansionUnlock = tryArcCoreWorldDailyUnlock();
    } catch (err) {
      reportDailyOpsStepFailure('worldExpansionUnlock', err);
    }
  }
  try {
    await integrateUnlockedSynthFrontierStatEconomyAsync();
  } catch (err) {
    reportDailyOpsStepFailure('integrateUnlockedSynthFrontierStatEconomy', err);
  }
  await yieldJsThread();

  if (policy.runPlanetEnergyPass) {
    try {
      runPlanetEnergyCorePass();
      result.planetEnergy = true;
    } catch (err) {
      reportDailyOpsStepFailure('planetEnergy', err);
    }
    await yieldJsThread();
  }
  try {
    const mineralLedger = runPlanetMineralLedgerDailyPass();
    result.planetMineralLedger = mineralLedger.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetMineralLedger', err);
  }
  await yieldJsThread();
  if (policy.runPlanetEnvironmentPass) {
    try {
      runPlanetEnvironmentDiversityPass();
      result.planetEnvironment = true;
    } catch (err) {
      reportDailyOpsStepFailure('planetEnvironment', err);
    }
    await yieldJsThread();
  }
  try {
    const contestedAftermath = runContestedZoneAftermathDailyPass();
    result.contestedZoneAftermath = contestedAftermath.ran;
  } catch (err) {
    reportDailyOpsStepFailure('contestedZoneAftermath', err);
  }

  try {
    const wealthDisparity = runPlanetWealthDisparityDailyPass();
    result.wealthDisparity = wealthDisparity.ran;
  } catch (err) {
    reportDailyOpsStepFailure('wealthDisparity', err);
  }

  try {
    const rebellionResolution = runPlanetRebellionResolutionDailyPass();
    result.rebellionResolution = rebellionResolution.ran;
  } catch (err) {
    reportDailyOpsStepFailure('rebellionResolution', err);
  }
  await yieldJsThread();

  if (policy.runPlanetMasterBalancePass) {
    try {
      runGlobalPlanetMasterBalancePass();
      result.planetMasterBalance = true;
    } catch (err) {
      reportDailyOpsStepFailure('planetMasterBalance', err);
    }
    await yieldJsThread();
  }
  if (policy.runScenarioEconomyPass) {
    try {
      const fabric = runPlanetEconomyFabricDailyPass();
      result.economyFabric = fabric.ran;
    } catch (err) {
      reportDailyOpsStepFailure('economyFabric', err);
    }
    await yieldJsThread();
    try {
      runPlayScenarioEconomyPass(true);
      result.scenarioEconomy = true;
    } catch (err) {
      reportDailyOpsStepFailure('scenarioEconomy', err);
    }
    await yieldJsThread();
  }
  if (policy.runMarketPricePass) {
    try {
      const ingest = await ingestBalanceOverlayDeltaIfPending();
      result.simOverlayIngest = ingest.ran;
    } catch (err) {
      reportDailyOpsStepFailure('simOverlayIngest', err);
    }
    try {
      await runMarketMicroAdjustPass();
      result.marketPriceAdjust = true;
    } catch (err) {
      reportDailyOpsStepFailure('marketPriceAdjust', err);
    }
    try {
      const tradeRouteDaily = runTradeRouteDailyMarketPass();
      result.tradeRouteDailyMarket = tradeRouteDaily.ran;
    } catch (err) {
      reportDailyOpsStepFailure('tradeRouteDailyMarket', err);
    }
    await yieldJsThread();
  }
  if (policy.runAabsAlignmentPass) {
    try {
      await flushDailyOpsObservationsToAabs();
      await runDailyPolicyAlignment(true);
      result.aabsAlignment = true;
    } catch (err) {
      reportDailyOpsStepFailure('aabsAlignment', err);
    }
    try {
      const engageAdjust = await runIntegratedEngageHpAdjustPass();
      result.integratedEngageHpAdjust = engageAdjust.ran;
    } catch (err) {
      reportDailyOpsStepFailure('integratedEngageHpAdjust', err);
    }
    await yieldJsThread();
  }
  try {
    const convoyDaily = await runArcCoreConvoyDailySettlementPass();
    result.convoyDailySettlement = convoyDaily.ran;
  } catch (err) {
    reportDailyOpsStepFailure('convoyDailySettlement', err);
  }
  await yieldJsThread();

  try {
    const upkeep = await runArcCorePlanetUpkeepDailyPass();
    result.planetUpkeep = upkeep.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetUpkeep', err);
  }
  await yieldJsThread();

  try {
    const centralBank = await runArcCoreCentralBankExpenditurePass();
    result.centralBankExpenditure = centralBank.ran;
  } catch (err) {
    reportDailyOpsStepFailure('centralBankExpenditure', err);
  }

  try {
    const fiscalLoop = await runPlanetFiscalBalanceClosedLoopPass();
    result.planetFiscalClosedLoop = fiscalLoop.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetFiscalClosedLoop', err);
  }
  await yieldJsThread();

  try {
    const statEquilibrium = runPlanetCoreStatEquilibriumPass();
    result.facilityStatNudge = statEquilibrium.ran;
  } catch (err) {
    reportDailyOpsStepFailure('facilityStatNudge', err);
  }
  try {
    const labRd = runLaboratoryRdSpeedPass();
    result.laboratoryRdSpeed = labRd.ran;
  } catch (err) {
    reportDailyOpsStepFailure('laboratoryRdSpeed', err);
  }
  try {
    const tavernRefresh = runTavernBountyRefreshPass();
    result.tavernBountyRefresh = tavernRefresh.ran;
  } catch (err) {
    reportDailyOpsStepFailure('tavernBountyRefresh', err);
  }
  await yieldJsThread();

  try {
    const instanceMissionPass = runArcCoreInstanceMissionDailyPass();
    result.arcCoreInstanceMissionDaily = instanceMissionPass.ran;
  } catch (err) {
    reportDailyOpsStepFailure('arcCoreInstanceMissionDaily', err);
  }

  try {
    const pgpPass = runPlanetPgpDailyPass();
    result.planetPgp = pgpPass.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetPgp', err);
  }

  try {
    const ownershipPricingPass = runPlanetOwnershipDeedPricingDailyPass();
    result.planetOwnershipDeedPricing = ownershipPricingPass.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetOwnershipDeedPricing', err);
  }
  await yieldJsThread();

  try {
    const learningResult = await runArcCoreEconomyLearningDailyPass(result);
    result.economyLearning = true;
    await pushArcCoreDailyKpiToRtdbIfDue({
      localDeviceId: getCurrentUser().uid,
      learningResult,
      rtdbAvailable: isArcCoreRtdbAvailableForSession(),
    });
  } catch (err) {
    reportDailyOpsStepFailure('economyLearning', err);
    /* learning KPI·RTDB push는 비차단 — 기존 계약 유지 */
  }

  try {
    const gaugeComposition = runPlanetCoreGaugeCompositionApplyPass();
    result.planetCoreGaugeComposition = gaugeComposition.ran;
  } catch (err) {
    reportDailyOpsStepFailure('planetCoreGaugeComposition', err);
  }

  try {
    commitPlanetCoreStatOpsTrendAfterBatch();
  } catch (err) {
    reportDailyOpsStepFailure('commitPlanetCoreStatOpsTrendAfterBatch', err);
  }

  return result;
}
