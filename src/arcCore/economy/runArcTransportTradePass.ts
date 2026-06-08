// ============================================================
// 아크코어 수송선단 — tg_* 실거래·임시은행 수익
// ============================================================

import { applyAabsTradeIncomeMultiplier } from '../aabs/aabsPolicyStore';
import {
  getTradeRouteConvoyCargoBounds,
} from '../balance/balanceTableRegistry';
import { useArcCoreTempBankStore } from '../../store/arcCoreTempBankStore';
import { adjustPlanetTradeMarketStock } from '../../world/planetTradeMarketStore';
import {
  getPlanetTradeRouteProfile,
  isTradeRouteDestinationPlanet,
  listConvoySourceRoutesAtPlanet,
  parseTradeRouteAttrs,
  type TradeRouteAttrs,
} from './tradeRouteRegistry';
import { getItemDef } from '../../data/goods';

type ShipCargo = {
  tgId: string;
  qty: number;
  unitBuyPrice: number;
  srcPlanetId: string;
  attrs: TradeRouteAttrs;
};

const shipCargoById = new Map<string, ShipCargo>();

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function sampleConvoyQty(shipId: string, planetId: string): number {
  const bounds = getTradeRouteConvoyCargoBounds();
  const span = bounds.max - bounds.min;
  const seed = shipId.length * 17 + planetId.length * 31;
  return bounds.min + Math.floor(pseudoRandom(seed) * (span + 1));
}

function pickRouteForShip(planetId: string, shipId: string) {
  const routes = listConvoySourceRoutesAtPlanet(planetId);
  if (routes.length === 0) return null;
  let hash = 0;
  const key = `${shipId}:${planetId}`;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 33 + key.charCodeAt(i)) | 0;
  return routes[Math.abs(hash) % routes.length] ?? null;
}

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
      const gross = (existing.attrs.baseSellPrice - existing.unitBuyPrice) * existing.qty;
      const profit = applyAabsTradeIncomeMultiplier(Math.max(0, gross));
      bank.appendProfit(profit, {
        tgId: existing.tgId,
        shipId,
        planetId,
        note: `${existing.srcPlanetId}→${planetId}`,
      });
      adjustPlanetTradeMarketStock(planetId, existing.tgId, existing.qty);
      shipCargoById.delete(shipId);
    }
    return;
  }

  const route = pickRouteForShip(planetId, shipId);
  if (!route) return;

  const def = getItemDef(route.tgId);
  const attrs = parseTradeRouteAttrs(def);
  if (!attrs) return;

  const qty = sampleConvoyQty(shipId, planetId);
  const unitBuyPrice = attrs.baseBuyPrice;
  const cost = unitBuyPrice * qty;
  if (!bank.trySpend(cost, { tgId: route.tgId, shipId, planetId, note: '수송선 적재' })) return;

  adjustPlanetTradeMarketStock(planetId, route.tgId, -qty);
  shipCargoById.set(shipId, {
    tgId: route.tgId,
    qty,
    unitBuyPrice,
    srcPlanetId: planetId,
    attrs,
  });
}
