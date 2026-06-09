// ============================================================
// 교역품(tg_*) 플레이어 거래 범용 정책
// ============================================================
//
// 1. 구매: 생산지 무역소만 — trade_route_planet_supply_assignments 행성별 1:1.
//    동일 생산 팩션 내 재판매 −30%는 srcFaction 일치 무역소 공통.
// 2. 수요지 수입 재고(convoy/playerResale)는 플레이어 구매 탭에 노출하지 않음.
// 3. 재판매: 현재 행성이 생산지이면 inventory 구매가 × local_origin_resale_buy_ratio(−30%).
//    다른 생산 무역소에서 산 재고도 동일(구매 행성 id 저장 불필요).
// 4. 수요지 판매: NPC 수요 매입가(생산지→수요지 운송 차익).

import { resolveSamePlanetOriginResaleSellUnit } from './localOriginResalePolicy';
import { resolveDemandPlanetSellUnit } from './tradeRouteMarketQuotes';
import { listTradeRouteSupplyBuyItemIdsForPlanet, resolveTradeRouteRole } from './tradeRouteRegistry';

/** 플레이어 무역소 구매 탭 — 생산지 교역품 id만 */
export function listTradeRoutePlayerBuyItemIds(planetId: string): string[] {
  return listTradeRouteSupplyBuyItemIdsForPlanet(planetId);
}

/** 플레이어 판매 단가 — 생산지 재판매(−30%) 우선, 수요지는 NPC 매입가 */
export function resolveTradeRoutePlayerSellUnit(
  planetId: string,
  goodId: string,
  inventoryBuyUnitPrice: number,
): number {
  const localOriginSell = resolveSamePlanetOriginResaleSellUnit(
    planetId,
    goodId,
    inventoryBuyUnitPrice,
  );
  if (localOriginSell != null) return localOriginSell;
  if (resolveTradeRouteRole(planetId, goodId) === 'demand') {
    const demandUnit = resolveDemandPlanetSellUnit(planetId, goodId);
    if (demandUnit > 0) return demandUnit;
  }
  return 0;
}
