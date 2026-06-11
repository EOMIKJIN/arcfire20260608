// ============================================================
// 아크파이어 온라인 - 무역 엔진
// ============================================================

import { TradeGood, MarketListing, Planet } from '../types';
import { TRADE_GOODS, getItemDef } from '../data/goods';
import {
  getCapitalShipTradeStockBounds,
  getWeaponCatalogStockBounds,
  getWeaponTradePriceBounds,
} from '../arcCore/balance/balanceTableRegistry';
import { resolveCapitalShipTradePrice } from '../arcCore/balance/tradePortCapitalShipPolicy';
import { resolveIntegratedWeaponTradePrice } from '../arcCore/economy/weaponTradePricing';
import {
  isArcCorePricedMineral,
  resolveMineralListingBuyPrice,
} from '../arcCore/economy/mineralTradePricing';
import { resolveItemCategoryPriceMul } from '../arcCore/economy/economyPriceOverlayStore';
import { estimateTradeRouteProfitPerUnit } from '../arcCore/economy/tradeRouteMarketQuotes';
import { resolveTradeRouteMarketListing } from '../world/planetTradeMarketStore';
import { getBuyPrice, getSellPrice } from './marketListingPrices';

export { getBuyPrice, getSellPrice } from './marketListingPrices';

/** 행성 시장 가격 계산 (시드 기반 결정론적) */
export function generateMarket(planet: Planet, seed: number = Date.now()): MarketListing[] {
  return generateMarketByItemIds(planet.tradeGoods, seed);
}

/** 아이템 id 목록으로 시장 생성 (무역소 DB/중개소 연동용) */
export function generateMarketByItemIds(
  goodIds: readonly string[],
  seed: number = Date.now(),
  cumulativeCredits = 0,
  planetId?: string,
): MarketListing[] {
  const weaponStockBounds = getWeaponCatalogStockBounds();
  const capitalStockBounds = getCapitalShipTradeStockBounds();
  const listings = goodIds.map(goodId => {
    const good = TRADE_GOODS[goodId];
    if (!good) return null;
    const itemDef = getItemDef(goodId);
    const isWeaponModule = itemDef?.type === 'weapon_module';
    const isCapitalShip = itemDef?.type === 'capital_ship';
    const isTradeRoute = itemDef?.type === 'trade_route';

    if (isTradeRoute && planetId) {
      const managed = resolveTradeRouteMarketListing(planetId, goodId);
      if (managed) {
        return managed;
      }
    }

    const variance = isWeaponModule || isCapitalShip ? 0 : good.priceVariance / 100;
    const rng = pseudoRandom(seed + goodId.charCodeAt(0));
    const priceMod = 1 + (rng - 0.5) * variance * 2;
    let price = Math.max(1, Math.floor(good.basePrice * priceMod));
    if (planetId && isArcCorePricedMineral(goodId)) {
      price = Math.max(
        1,
        Math.floor(resolveMineralListingBuyPrice(planetId, goodId) * resolveItemCategoryPriceMul('mineral', itemDef?.type)),
      );
    } else if (isCapitalShip) {
      price = Math.max(
        1,
        Math.floor(resolveCapitalShipTradePrice(goodId, planetId) * resolveItemCategoryPriceMul('capital_ship', itemDef?.type)),
      );
    } else if (isWeaponModule) {
      const weaponId = String(itemDef?.attrs?.weaponId ?? '').trim();
      if (weaponId) {
        price = resolveIntegratedWeaponTradePrice(weaponId, cumulativeCredits);
      } else {
        const { min, max } = getWeaponTradePriceBounds();
        price = Math.max(min, Math.min(max, price));
      }
    } else {
      const catMul = resolveItemCategoryPriceMul(good.category, itemDef?.type);
      price = Math.max(1, Math.floor(price * catMul));
    }

    const demandRng = pseudoRandom(seed + goodId.charCodeAt(1));
    const demand: MarketListing['demand'] =
      demandRng < 0.33 ? 'low' : demandRng < 0.66 ? 'normal' : 'high';

    const weaponStockSpan = weaponStockBounds.max - weaponStockBounds.min;
    const capitalStockSpan = capitalStockBounds.max - capitalStockBounds.min;
    const stock = isWeaponModule
      ? weaponStockBounds.min
        + Math.floor(pseudoRandom(seed + goodId.length) * (weaponStockSpan + 1))
      : isCapitalShip
        ? capitalStockBounds.min
          + Math.floor(pseudoRandom(seed + goodId.length) * (capitalStockSpan + 1))
        : Math.floor(pseudoRandom(seed + goodId.length) * 50) + 10;

    return { goodId, price, stock, demand };
  }).filter(Boolean) as MarketListing[];

  return sortMarketListingsByBuyPrice(listings);
}

export function sortMarketListingsByBuyPrice(listings: readonly MarketListing[]): MarketListing[] {
  return [...listings].sort((a, b) => getBuyPrice(a) - getBuyPrice(b));
}

/** 수익 예측 — 무역소 시장 리스팅 기준 */
export function estimateProfit(
  buyListing: MarketListing,
  sellListing: MarketListing,
  quantity: number,
): number {
  return (getSellPrice(sellListing) - getBuyPrice(buyListing)) * quantity;
}

/** tg_* 교역로 — 행성 A(공급) → 행성 B(수요) 차익 예측 */
export function estimateTradeRouteProfit(
  tgId: string,
  buyPlanetId: string,
  sellPlanetId: string,
  quantity: number,
): number {
  return estimateTradeRouteProfitPerUnit(tgId, buyPlanetId, sellPlanetId) * quantity;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
