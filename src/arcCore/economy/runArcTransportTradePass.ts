// ============================================================
// 아크코어 수송선단 — tg_* 실거래·임시은행 수익
// ============================================================

import { applyAabsTradeIncomeMultiplier } from '../aabs/aabsPolicyStore';
import { useArcCoreTempBankStore } from '../../store/arcCoreTempBankStore';
import { adjustPlanetTradeMarketStock } from '../../world/planetTradeMarketStore';
import {
  planArcConvoyRouteAtSupply,
  resolveArcConvoyUnloadSettlement,
} from './arcConvoyTradePlanner';
import { getItemDef } from '../../data/goods';
import {
  getPlanetTradeRouteProfile,
  isTradeRouteDestinationPlanet,
  parseTradeRouteAttrs,
  type TradeRouteAttrs,
} from './tradeRouteRegistry';

type ShipCargo = {
  tgId: string;
  qty: number;
  unitBuyPrice: number;
  srcPlanetId: string;
  plannedDestPlanetId: string;
  attrs: TradeRouteAttrs;
};

const shipCargoById = new Map<string, ShipCargo>();

/**
 * 수송선 행성 체류 종료 시 1회 — 적재 또는 하역·수익 정산.
 * `AiNpcSubCore` → `economy_transport_dwell_settled` 명령으로 호출.
 */
export function settleArcTransportDwellTrade(shipId: string, planetId: string): void {
  if (!shipId || !planetId) return;
  if (!getPlanetTradeRouteProfile(planetId)) return;

  const bank = useArcCoreTempBankStore.getState();
  if (!bank.hydrated) return;

  const existing = shipCargoById.get(shipId);
  if (existing) {
    if (isTradeRouteDestinationPlanet(planetId, existing.attrs)) {
      const settlement = resolveArcConvoyUnloadSettlement(
        existing.srcPlanetId,
        planetId,
        existing.tgId,
        existing.qty,
        existing.unitBuyPrice,
      );
      const profit = applyAabsTradeIncomeMultiplier(settlement.netProfitTotal);
      if (profit > 0) {
        bank.appendProfit(profit, {
          tgId: existing.tgId,
          shipId,
          planetId,
          note: [
            `${existing.srcPlanetId}→${planetId}`,
            `qty=${existing.qty}`,
            `buy@${existing.unitBuyPrice}`,
            `sell@${settlement.unitSellPrice}`,
            `ship@${settlement.transportCostPerUnit}/u`,
            `net=${profit}`,
          ].join(' '),
        });
      }
      adjustPlanetTradeMarketStock(planetId, existing.tgId, existing.qty, 'convoy');
      shipCargoById.delete(shipId);
    }
    return;
  }

  const plan = planArcConvoyRouteAtSupply(planetId, shipId, bank.balanceCredits);
  if (!plan) return;

  const def = getItemDef(plan.tgId);
  const attrs = parseTradeRouteAttrs(def);
  if (!attrs) return;

  const cost = plan.unitBuyPrice * plan.qty;
  if (!bank.trySpend(cost, {
    tgId: plan.tgId,
    shipId,
    planetId,
    note: [
      '수송선 적재',
      `${planetId}→${plan.destPlanetId}`,
      `qty=${plan.qty}`,
      `buy@${plan.unitBuyPrice}`,
      `sell@${plan.unitSellPrice}`,
      `estNet=${plan.netProfitPerUnit}/u`,
    ].join(' '),
  })) {
    return;
  }

  adjustPlanetTradeMarketStock(planetId, plan.tgId, -plan.qty);
  shipCargoById.set(shipId, {
    tgId: plan.tgId,
    qty: plan.qty,
    unitBuyPrice: plan.unitBuyPrice,
    srcPlanetId: planetId,
    plannedDestPlanetId: plan.destPlanetId,
    attrs,
  });
}
