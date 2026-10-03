// ============================================================
// 일 1회 convoy 실패 진단 — 시세/재고 CSV 변경 없음
// ============================================================

import { getPlanetTradeMarketEntry, resolveTradeRouteMarketListing } from '../../world/planetTradeMarketStore';
import { resolveDemandPlanetSellUnit, resolveSupplyPlanetBuyUnit } from './tradeRouteMarketQuotes';
import {
  applyTradeRouteNetProfitPerUnit,
  computeTradeRouteTransportCostPerUnit,
} from './tradeRouteTransportCost';
import { resolveConvoyDemandGrossRoomCredits } from './convoyDemandGrossRoom';
import { isPlanetConvoyTradeEnabled } from './synthFrontierConvoyTradeBridge';
import {
  isTradeRouteDestinationPlanet,
  listConvoySourceRoutesAtPlanet,
  listDemandPlanetIdsForTradeGood,
  resolveTradeRouteRole,
} from './tradeRouteRegistry';
import {
  formatArcConvoyMissLog,
  pickDominantSkipReason,
  type ArcConvoyMissDiagnosis,
} from './arcConvoyMissLog';

export { formatArcConvoyMissLog, pickDominantSkipReason };
export type { ArcConvoyMissDiagnosis };

function bump(counts: Record<string, number>, reason: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}

function supplyStock(supplyPlanetId: string, tgId: string): number {
  resolveTradeRouteMarketListing(supplyPlanetId, tgId);
  return getPlanetTradeMarketEntry(supplyPlanetId, tgId)?.stock ?? 0;
}

/** 플래너와 동일 게이트를 세어 왜 후보가 0인지 남긴다. */
export function diagnoseArcConvoyRouteMiss(
  supplyPlanetId: string,
  opts?: { minQty?: number; forceDestPlanetId?: string },
): ArcConvoyMissDiagnosis {
  const skipCounts: Record<string, number> = {};
  if (!isPlanetConvoyTradeEnabled(supplyPlanetId)) {
    bump(skipCounts, 'trade_disabled');
    return { planetId: supplyPlanetId, dominantReason: 'trade_disabled', skipCounts, candidateCount: 0 };
  }
  const routes = listConvoySourceRoutesAtPlanet(supplyPlanetId);
  if (routes.length === 0) {
    bump(skipCounts, 'no_source_routes');
    return { planetId: supplyPlanetId, dominantReason: 'no_source_routes', skipCounts, candidateCount: 0 };
  }

  let candidateCount = 0;
  const minQty = opts?.minQty ?? 1;

  for (let r = 0; r < routes.length; r += 1) {
    const route = routes[r]!;
    if (resolveTradeRouteRole(supplyPlanetId, route.tgId) !== 'supply') {
      bump(skipCounts, 'role_not_supply');
      continue;
    }
    const unitBuyPrice = resolveSupplyPlanetBuyUnit(supplyPlanetId, route.tgId);
    if (unitBuyPrice <= 0) {
      bump(skipCounts, 'buy_price_le_0');
      continue;
    }
    const stock = supplyStock(supplyPlanetId, route.tgId);
    if (stock <= 0) {
      bump(skipCounts, 'stock_le_0');
      continue;
    }
    const dests = listDemandPlanetIdsForTradeGood(route.tgId);
    if (dests.length === 0) {
      bump(skipCounts, 'no_dest');
      continue;
    }
    for (let d = 0; d < dests.length; d += 1) {
      const destPlanetId = dests[d]!;
      if (opts?.forceDestPlanetId && destPlanetId !== opts.forceDestPlanetId) {
        bump(skipCounts, 'force_dest_mismatch');
        continue;
      }
      if (!isPlanetConvoyTradeEnabled(destPlanetId)) {
        bump(skipCounts, 'dest_disabled');
        continue;
      }
      if (!isTradeRouteDestinationPlanet(destPlanetId, route.attrs)) {
        bump(skipCounts, 'dest_not_route');
        continue;
      }
      const unitSellPrice = resolveDemandPlanetSellUnit(destPlanetId, route.tgId);
      if (unitSellPrice <= 0) {
        bump(skipCounts, 'sell_price_le_0');
        continue;
      }
      const grossPerUnit = unitSellPrice - unitBuyPrice;
      if (grossPerUnit <= 0) {
        bump(skipCounts, 'gross_le_0');
        continue;
      }
      const netProfitPerUnit = applyTradeRouteNetProfitPerUnit(
        grossPerUnit,
        supplyPlanetId,
        destPlanetId,
        route.tgId,
      );
      if (netProfitPerUnit <= 0) {
        bump(skipCounts, 'net_le_0');
        continue;
      }
      const demandRoom = resolveConvoyDemandGrossRoomCredits(destPlanetId);
      if (demandRoom <= 0) {
        bump(skipCounts, 'demand_room_le_0');
        continue;
      }
      let qty = stock;
      const estSellGross = unitSellPrice * qty;
      if (estSellGross > demandRoom) {
        qty = Math.max(0, Math.floor(demandRoom / unitSellPrice));
      }
      if (qty < minQty) {
        bump(skipCounts, 'qty_below_min');
        continue;
      }
      computeTradeRouteTransportCostPerUnit(supplyPlanetId, destPlanetId, route.tgId);
      candidateCount += 1;
    }
  }

  const dominantReason = candidateCount > 0 ? 'has_candidate' : pickDominantSkipReason(skipCounts);
  return { planetId: supplyPlanetId, dominantReason, skipCounts, candidateCount };
}
