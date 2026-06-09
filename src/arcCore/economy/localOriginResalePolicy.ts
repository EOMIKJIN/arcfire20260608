// ============================================================
// 생산지 동일 행성 재판매 — 전 행성 범용(구매가 대비 할인)
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import { getTradeRouteLocalOriginResaleBuyRatio } from '../balance/balanceTableRegistry';
import { parseTradeRouteAttrs, resolveTradeRouteRole } from './tradeRouteRegistry';

function resolveReferenceBuyUnit(
  goodId: string,
  inventoryBuyUnitPrice: number,
  marketBuyUnitPrice = 0,
): number {
  if (inventoryBuyUnitPrice > 0) return inventoryBuyUnitPrice;
  if (marketBuyUnitPrice > 0) return marketBuyUnitPrice;
  const attrs = parseTradeRouteAttrs(getItemDef(goodId));
  return attrs?.baseBuyPrice ?? 0;
}

/** 해당 행성에서 생산(supply)되는 교역품인지 — 행성 id·팩션 프로필 기준(범용) */
export function isLocalOriginTradeGoodAtPlanet(planetId: string, goodId: string): boolean {
  return resolveTradeRouteRole(planetId, goodId) === 'supply';
}

/**
 * 교역품이 해당 행성 생산품(supply)일 때 재판매 단가.
 * 동일 생산 팩션의 다른 무역소(예: 아르카디아·솔라)에서도 inventory 구매가 기준 −30%.
 * 구매가 × `local_origin_resale_buy_ratio`(기본 0.70).
 */
export function resolveSamePlanetOriginResaleSellUnit(
  planetId: string,
  goodId: string,
  inventoryBuyUnitPrice: number,
  marketBuyUnitPrice = 0,
): number | null {
  if (!planetId || !goodId) return null;
  if (!isLocalOriginTradeGoodAtPlanet(planetId, goodId)) return null;
  const refBuy = resolveReferenceBuyUnit(goodId, inventoryBuyUnitPrice, marketBuyUnitPrice);
  if (refBuy <= 0) return null;
  const ratio = getTradeRouteLocalOriginResaleBuyRatio();
  return Math.max(1, Math.floor(refBuy * ratio));
}
