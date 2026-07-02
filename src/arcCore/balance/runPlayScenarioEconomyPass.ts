// ============================================================
// 01_레벨업구조 — 경제 운영·무역소 시나리오 동기
// ============================================================

import { listCoreOpenGameplayPlanetIds } from '../../world/coreOpenGameplayPlanets';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import {
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { getPlanetMasterBalanceDetailForPlanet } from '../planetBalance/planetZoneIndexRegistry';
import { syncTradePortCatalogFromBalance } from './tradePortCatalogPolicy';
import { runTradeRouteMarketPass } from '../economy/runTradeRouteMarketPass';

export type PlayScenarioEconomyPassOpts = {
  /** 부트·행성 lazy warm — 전 무역소 카탈로그 dispatch 생략 */
  skipCatalog?: boolean;
};

/**
 * 플레이 시나리오 — 무역소 카탈로그 + 행성 masterBalance 경제 메타 동기.
 */
export function runPlayScenarioEconomyPass(
  forceCatalog = false,
  opts?: PlayScenarioEconomyPassOpts,
): void {
  if (!opts?.skipCatalog) {
    syncTradePortCatalogFromBalance(forceCatalog);
    runTradeRouteMarketPass(forceCatalog);
  }

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return;

  const updates: Record<
    string,
    { gauge: ReturnType<typeof planetCoreRuntimeToGaugeView>; masterBalance: ReturnType<typeof getPlanetMasterBalanceDetailForPlanet> }
  > = {};

  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;
    const system = resolveStarSystemForPlanetId(planetId);
    if (!system) continue;
    const prev = runtime.detail?.masterBalance;
    const masterBalance = getPlanetMasterBalanceDetailForPlanet(planetId, system);
    const scenarioChanged =
      !prev
      || prev.scenarioTargetItemKo !== masterBalance.scenarioTargetItemKo
      || prev.scenarioRequiredCredits !== masterBalance.scenarioRequiredCredits
      || prev.growthStageKo !== masterBalance.growthStageKo
      || prev.scenarioLocationKo !== masterBalance.scenarioLocationKo
      || prev.zoneIndex !== masterBalance.zoneIndex;
    if (!scenarioChanged) continue;
    updates[planetId] = {
      gauge: planetCoreRuntimeToGaugeView(runtime),
      masterBalance,
    };
  }

  if (Object.keys(updates).length > 0) {
    coreStore.patchPlanetMasterBalanceBulk(updates);
  }
}
