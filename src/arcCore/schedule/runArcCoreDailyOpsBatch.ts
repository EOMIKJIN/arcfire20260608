// ============================================================
// 아크코어 일일 운영 배치 — 24h 관측 데이터 기반 1회 재배치·밸런스
// ============================================================

import { runDailyPolicyAlignment } from '../aabs/dailyPolicyAlignment';
import { runPlayScenarioEconomyPass } from '../balance/runPlayScenarioEconomyPass';
import { runGlobalPlanetMasterBalancePass } from '../planetBalance/runGlobalPlanetMasterBalancePass';
import { runPlanetEnergyCorePass } from '../planetEnergy/runPlanetEnergyCorePass';
import { runPlanetEnvironmentDiversityPass } from '../planetEnvironment/runPlanetEnvironmentDiversityPass';
import { tryArcCoreWorldDailyUnlock } from '../worldExpansionDailyUnlock';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { resolveArcCoreDailyOpsPolicy } from './arcCoreDailyOpsPolicy';

export type ArcCoreDailyOpsBatchResult = {
  ran: boolean;
  planetEnergy: boolean;
  planetEnvironment: boolean;
  planetMasterBalance: boolean;
  scenarioEconomy: boolean;
  aabsAlignment: boolean;
  worldExpansionUnlock: boolean;
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
    aabsAlignment: false,
    worldExpansionUnlock: false,
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
  if (policy.runAabsAlignmentPass) {
    await runDailyPolicyAlignment(true);
    result.aabsAlignment = true;
  }
  if (policy.runWorldExpansionUnlock) {
    result.worldExpansionUnlock = tryArcCoreWorldDailyUnlock();
  }

  return result;
}
