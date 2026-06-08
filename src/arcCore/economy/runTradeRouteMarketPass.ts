// ============================================================
// 교역품 시장 — 전 무역소 행성 tg_* 수요·공급 재동기
// ============================================================

import { listPlanetIdsWithTradePort } from '../../world/planetTradePortDb';
import { rebuildAllPlanetTradeMarkets } from '../../world/planetTradeMarketStore';

/** 아크코어 — 행성별 교역품 시장(재고·가격·수요) 갱신 */
export function runTradeRouteMarketPass(force = false): void {
  const planetIds = listPlanetIdsWithTradePort();
  rebuildAllPlanetTradeMarkets(planetIds, force);
}
