// ============================================================
// 무역 구매 — 현재 구매처 기준 타 행성 재판매 차익 Tips (최대 1건)
// ============================================================

import { applyTradeRouteNetProfitPerUnit } from '../arcCore/economy/tradeRouteTransportCost';
import { resolveDemandPlanetSellUnit } from '../arcCore/economy/tradeRouteMarketQuotes';
import { resolveTradeRouteRole } from '../arcCore/economy/tradeRouteRegistry';
import { getItemDef } from '../data/itemRegistry';
import { STAR_SYSTEMS } from '../data/systems';
import { generateMarketByItemIds } from '../engine/TradeEngine';
import { getSellPrice } from '../engine/marketListingPrices';
import { getPlanetTradePortItemIds } from '../world/planetTradePortDb';

export type TradeProfitTip = {
  planetId: string;
  planetName: string;
  profitPerUnit: number;
};

function isTradeRouteGood(goodId: string, def: ReturnType<typeof getItemDef>): boolean {
  return def?.type === 'trade_route' || goodId.startsWith('tg_');
}

function canResellAtPlanet(planetId: string, goodId: string, isTg: boolean): boolean {
  if (isTg) return resolveTradeRouteRole(planetId, goodId) === 'demand';
  return getPlanetTradePortItemIds(planetId).includes(goodId);
}

function resolveSellUnitAtPlanet(
  planetId: string,
  goodId: string,
  isTg: boolean,
  cumulativeCredits: number,
): number {
  if (isTg) {
    return resolveDemandPlanetSellUnit(planetId, goodId);
  }
  if (!getPlanetTradePortItemIds(planetId).includes(goodId)) return 0;
  const listing = generateMarketByItemIds(
    [goodId],
    planetId.length * 37,
    cumulativeCredits,
    planetId,
  )[0];
  if (!listing) return 0;
  return getSellPrice(listing, { planetId, goodId });
}

function computeResellProfitPerUnit(
  buyPlanetId: string,
  sellPlanetId: string,
  goodId: string,
  buyUnitPrice: number,
  sellUnit: number,
  isTg: boolean,
): number {
  const gross = sellUnit - buyUnitPrice;
  if (gross <= 0) return 0;
  if (isTg) {
    return applyTradeRouteNetProfitPerUnit(gross, buyPlanetId, sellPlanetId, goodId);
  }
  return gross;
}

/** 현재 구매 행성·단가 기준 — 타 무역소 행성에 판매 시 예상 개당 차익(최대 1) */
export function listTradeResellProfitTips(
  buyPlanetId: string,
  goodId: string,
  buyUnitPrice: number,
  cumulativeCredits = 0,
): TradeProfitTip[] {
  const def = getItemDef(goodId);
  const isTg = isTradeRouteGood(goodId, def);
  const tips: TradeProfitTip[] = [];

  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      if (!planet.hasTradePort || planet.id === buyPlanetId) continue;
      if (!canResellAtPlanet(planet.id, goodId, isTg)) continue;
      const sellUnit = resolveSellUnitAtPlanet(planet.id, goodId, isTg, cumulativeCredits);
      const profitPerUnit = computeResellProfitPerUnit(
        buyPlanetId,
        planet.id,
        goodId,
        buyUnitPrice,
        sellUnit,
        isTg,
      );
      if (profitPerUnit > 0) {
        tips.push({ planetId: planet.id, planetName: planet.name, profitPerUnit });
      }
    }
  }

  if (tips.length === 0) return [];
  tips.sort((a, b) => b.profitPerUnit - a.profitPerUnit);
  return [tips[0]!];
}
