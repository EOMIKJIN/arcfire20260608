// ============================================================
// 아크 수송선단 — 시장 정본 기반 교역로·운송량 산정
// ============================================================

import { getTradeRouteConvoyCargoBounds } from '../balance/balanceTableRegistry';
import {
  getPlanetTradeMarketEntry,
  resolveTradeRouteMarketListing,
} from '../../world/planetTradeMarketStore';
import {
  resolveDemandPlanetSellUnit,
  resolveSupplyPlanetBuyUnit,
} from './tradeRouteMarketQuotes';
import {
  applyTradeRouteNetProfitPerUnit,
  computeTradeRouteTransportCostPerUnit,
} from './tradeRouteTransportCost';
import {
  listConvoySourceRoutesAtPlanet,
  listDemandPlanetIdsForTradeGood,
  resolveTradeRouteRole,
  type TradeRouteAttrs,
} from './tradeRouteRegistry';

export type ArcConvoyRoutePlan = {
  tgId: string;
  attrs: TradeRouteAttrs;
  srcPlanetId: string;
  destPlanetId: string;
  unitBuyPrice: number;
  unitSellPrice: number;
  transportCostPerUnit: number;
  netProfitPerUnit: number;
  qty: number;
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function sampleConvoyQtyCap(shipId: string, planetId: string): number {
  const bounds = getTradeRouteConvoyCargoBounds();
  const span = bounds.max - bounds.min;
  const seed = shipId.length * 17 + planetId.length * 31;
  return bounds.min + Math.floor(pseudoRandom(seed) * (span + 1));
}

function resolveSupplyMarketStock(supplyPlanetId: string, tgId: string): number {
  resolveTradeRouteMarketListing(supplyPlanetId, tgId);
  return getPlanetTradeMarketEntry(supplyPlanetId, tgId)?.stock ?? 0;
}

/** 생산지 시장 재고·시세·수요지 순차익 기준 최적 교역 계획 */
export function planArcConvoyRouteAtSupply(
  supplyPlanetId: string,
  shipId: string,
  bankBalance: number,
  opts?: { ignoreBankAffordability?: boolean; minQty?: number; forceDestPlanetId?: string },
): ArcConvoyRoutePlan | null {
  const routes = listConvoySourceRoutesAtPlanet(supplyPlanetId);
  if (routes.length === 0) return null;

  const candidates: ArcConvoyRoutePlan[] = [];

  for (const route of routes) {
    if (resolveTradeRouteRole(supplyPlanetId, route.tgId) !== 'supply') continue;

    const unitBuyPrice = resolveSupplyPlanetBuyUnit(supplyPlanetId, route.tgId);
    if (unitBuyPrice <= 0) continue;

    const supplyStock = resolveSupplyMarketStock(supplyPlanetId, route.tgId);
    if (supplyStock <= 0) continue;

    const qtyCap = sampleConvoyQtyCap(shipId, supplyPlanetId);
    const affordQty = opts?.ignoreBankAffordability
      ? supplyStock
      : Math.floor(bankBalance / unitBuyPrice);
    let maxQty = Math.min(qtyCap, supplyStock, Math.max(0, affordQty));
    if (opts?.minQty != null) {
      maxQty = Math.max(maxQty, Math.min(opts.minQty, supplyStock));
    }
    if (maxQty <= 0) continue;

    for (const destPlanetId of listDemandPlanetIdsForTradeGood(route.tgId)) {
      if (opts?.forceDestPlanetId && destPlanetId !== opts.forceDestPlanetId) continue;
      const unitSellPrice = resolveDemandPlanetSellUnit(destPlanetId, route.tgId);
      if (unitSellPrice <= 0) continue;

      const grossPerUnit = unitSellPrice - unitBuyPrice;
      if (grossPerUnit <= 0) continue;

      const transportCostPerUnit = computeTradeRouteTransportCostPerUnit(
        supplyPlanetId,
        destPlanetId,
        route.tgId,
      );
      const netProfitPerUnit = applyTradeRouteNetProfitPerUnit(
        grossPerUnit,
        supplyPlanetId,
        destPlanetId,
        route.tgId,
      );
      if (netProfitPerUnit <= 0) continue;

      candidates.push({
        tgId: route.tgId,
        attrs: route.attrs,
        srcPlanetId: supplyPlanetId,
        destPlanetId,
        unitBuyPrice,
        unitSellPrice,
        transportCostPerUnit,
        netProfitPerUnit,
        qty: maxQty,
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const profitDelta = b.netProfitPerUnit * b.qty - a.netProfitPerUnit * a.qty;
    if (profitDelta !== 0) return profitDelta > 0 ? 1 : -1;
    return b.netProfitPerUnit - a.netProfitPerUnit;
  });

  const top = candidates[0]!;
  const nearBest = candidates.filter(
    (c) => c.netProfitPerUnit >= top.netProfitPerUnit * 0.92,
  );
  if (nearBest.length <= 1) return top;

  let hash = 0;
  const key = `${shipId}:${supplyPlanetId}`;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 33 + key.charCodeAt(i)) | 0;
  return nearBest[Math.abs(hash) % nearBest.length] ?? top;
}

/** 하역지 실거래 순이익(적재 단가·당일 시세·운송비) */
export function resolveArcConvoyUnloadSettlement(
  srcPlanetId: string,
  destPlanetId: string,
  tgId: string,
  qty: number,
  unitBuyPrice: number,
): {
  unitSellPrice: number;
  transportCostPerUnit: number;
  netProfitTotal: number;
} {
  const unitSellPrice = resolveDemandPlanetSellUnit(destPlanetId, tgId);
  const transportCostPerUnit = computeTradeRouteTransportCostPerUnit(
    srcPlanetId,
    destPlanetId,
    tgId,
  );
  const grossPerUnit = Math.max(0, unitSellPrice - unitBuyPrice);
  const netPerUnit = applyTradeRouteNetProfitPerUnit(
    grossPerUnit,
    srcPlanetId,
    destPlanetId,
    tgId,
  );
  return {
    unitSellPrice,
    transportCostPerUnit,
    netProfitTotal: Math.max(0, netPerUnit * qty),
  };
}
