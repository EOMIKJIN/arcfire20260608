// ============================================================
// 교역품 — 일 1회 행성별 시장 미세조정(거리·재고·가상수요)
// ============================================================

import { runTradeRouteDailyMarketMicroAdjustAll } from '../../world/planetTradeMarketStore';
import { getEconomyCategoryPriceMul } from './economyPriceOverlayStore';
import { runVirtualMarketDemandSim } from './simMarketDemandEngine';

export type TradeRouteDailyMarketPassResult = {
  ran: boolean;
  planetCount: number;
  entryCount: number;
  tradeRoutePressure: number;
  tradeRouteCategoryMul: number;
};

/**
 * 카테고리 가격 오버레이(`runMarketMicroAdjustPass`) 이후 호출.
 * 생산지 재고·수요지 수입(수송/플레이어) 재고와 행성 간 거리 프리미엄을 반영한다.
 */
export function runTradeRouteDailyMarketPass(): TradeRouteDailyMarketPassResult {
  const sim = runVirtualMarketDemandSim();
  const tradeRoutePressure = sim.categoryPressures.trade_route;
  const tradeRouteCategoryMul = getEconomyCategoryPriceMul('trade_route');

  const result = runTradeRouteDailyMarketMicroAdjustAll(
    tradeRoutePressure,
    tradeRouteCategoryMul,
  );

  if (__DEV__) {
    console.log(
      `[ArcCore/Economy] trade-route daily market planets=${result.planetCount} entries=${result.entryCount}`,
      `pressure=${tradeRoutePressure.toFixed(3)} mul=${tradeRouteCategoryMul.toFixed(3)}`,
    );
  }

  return {
    ran: result.ran,
    planetCount: result.planetCount,
    entryCount: result.entryCount,
    tradeRoutePressure: result.tradeRoutePressure,
    tradeRouteCategoryMul: result.tradeRouteCategoryMul,
  };
}
