// ============================================================
// tg_* 교역로 — 공급·수요 행성 견적(아크코어 시장 정본)
// ============================================================

import { getBuyPrice, getSellPrice } from '../../engine/marketListingPrices';
import { getItemDef } from '../../data/itemRegistry';
import {
  getPlanetTradeMarketEntry,
  resolveTradeRouteMarketListing,
  resolveTradeRouteNpcSellUnit,
} from '../../world/planetTradeMarketStore';
import {
  parseTradeRouteAttrs,
  resolveTradeRouteRole,
  type TradeRouteRole,
} from './tradeRouteRegistry';
import { resolveDistanceScaledTradeRouteGrossProfit } from './tradeRouteDistanceProfit';
import { applyTradeRouteNetProfitPerUnit } from './tradeRouteTransportCost';
import { resolveTradeRouteAssignedSupplyPlanetId } from './tradeRoutePlanetAssignmentRegistry';

function listingBuyUnit(planetId: string, goodId: string, role: TradeRouteRole): number {
  if (resolveTradeRouteRole(planetId, goodId) !== role) return 0;
  const listing = resolveTradeRouteMarketListing(planetId, goodId);
  if (!listing) return 0;
  return getBuyPrice(listing);
}

function listingSellUnit(planetId: string, goodId: string, role: TradeRouteRole): number {
  if (resolveTradeRouteRole(planetId, goodId) !== role) return 0;
  if (role === 'demand') {
    return resolveTradeRouteNpcSellUnit(planetId, goodId);
  }
  const listing = resolveTradeRouteMarketListing(planetId, goodId);
  if (!listing) return 0;
  return getSellPrice(listing, { planetId, goodId });
}

export function resolveSupplyPlanetBuyUnit(planetId: string, goodId: string): number {
  return listingBuyUnit(planetId, goodId, 'supply');
}

export function resolveDemandPlanetSellUnit(planetId: string, goodId: string): number {
  return listingSellUnit(planetId, goodId, 'demand');
}

function resolveGrossTradeRouteProfitPerUnit(
  goodId: string,
  supplyPlanetId: string,
  demandPlanetId: string,
): number {
  const buyUnit = resolveSupplyPlanetBuyUnit(supplyPlanetId, goodId);
  const sellUnit = resolveDemandPlanetSellUnit(demandPlanetId, goodId);
  if (buyUnit > 0 && sellUnit > 0) {
    return Math.max(0, sellUnit - buyUnit);
  }
  const attrs = parseTradeRouteAttrs(getItemDef(goodId));
  if (!attrs) return 0;
  const assignedSupply = resolveTradeRouteAssignedSupplyPlanetId(goodId) ?? supplyPlanetId;
  if (!assignedSupply) return Math.max(0, attrs.baseProfit);
  return resolveDistanceScaledTradeRouteGrossProfit(attrs, assignedSupply, demandPlanetId);
}

/** 공급→수요 canonical 순차익(운송비·거리 스케일 반영) */
export function estimateCanonicalTradeRouteProfitPerUnit(
  goodId: string,
  supplyPlanetId: string,
  demandPlanetId: string,
): number {
  const gross = resolveGrossTradeRouteProfitPerUnit(goodId, supplyPlanetId, demandPlanetId);
  if (gross <= 0) return 0;
  return applyTradeRouteNetProfitPerUnit(gross, supplyPlanetId, demandPlanetId, goodId);
}

/** estimateTradeRouteProfit — 시장 엔트리 role 검증 포함 */
export function estimateTradeRouteProfitPerUnit(
  tgId: string,
  buyPlanetId: string,
  sellPlanetId: string,
): number {
  const buyEntry = getPlanetTradeMarketEntry(buyPlanetId, tgId);
  const sellEntry = getPlanetTradeMarketEntry(sellPlanetId, tgId);
  if (buyEntry?.role === 'supply' && sellEntry?.role === 'demand') {
    const buyUnit = resolveSupplyPlanetBuyUnit(buyPlanetId, tgId);
    const sellUnit = resolveDemandPlanetSellUnit(sellPlanetId, tgId);
    if (buyUnit > 0 && sellUnit > 0) {
      const gross = Math.max(0, sellUnit - buyUnit);
      return applyTradeRouteNetProfitPerUnit(gross, buyPlanetId, sellPlanetId, tgId);
    }
  }
  return estimateCanonicalTradeRouteProfitPerUnit(tgId, buyPlanetId, sellPlanetId);
}
