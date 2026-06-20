// ============================================================
// 행성별 교역품 시장 — 아크코어 단일 운영(수요·공급·재고·가격)
// ============================================================

import type { MarketListing } from '../types';
import {
  getTradeRouteConvoyChannelShare,
  getTradeRouteDailyMarketPolicyNum,
  getTradeRouteImportBuyPriceRatio,
  getTradeRouteImportSeedStockPct,
  getTradeRouteMarketPriceVariancePct,
  getTradeRouteMaxPriceBandPct,
  getTradeRoutePlayerChannelShare,
  getTradeRouteStockBounds,
  getTradeRouteTargetStockMid,
} from '../arcCore/balance/balanceTableRegistry';
import {
  getTradeRouteReferenceMapDistance,
  resolvePlanetSystemMapDistance,
} from '../arcCore/economy/tradeRouteTransportCost';
import {
  getTradeRouteSupplyBuyPriceFactor,
  resolveDistanceScaledDemandSellAnchor,
} from '../arcCore/economy/tradeRouteDistanceProfit';
import { resolveTradeRouteAssignedSupplyPlanetId } from '../arcCore/economy/tradeRoutePlanetAssignmentRegistry';
import { resolveNearestSupplyPlanetForTradeGood } from '../arcCore/economy/tradeRouteRegistry';
import { listPlanetIdsWithTradePort } from './planetTradePortDb';
import { getEconomyCategoryPriceMul } from '../arcCore/economy/economyPriceOverlayStore';
import { resolvePlanetSupplyStockScale } from '../arcCore/economy/planetEconomyFabric';
import { clampStockToTradePortLimit } from '../game/planetDevelopment/planetTradePortStockLimit';
import { resolveSamePlanetOriginResaleSellUnit } from '../arcCore/economy/localOriginResalePolicy';
import {
  listTradeRouteDemandImportItemIdsForPlanet,
  listTradeRouteSupplyBuyItemIdsForPlanet,
  parseTradeRouteAttrs,
  resolveTradeRouteRole,
  type TradeRouteRole,
} from '../arcCore/economy/tradeRouteRegistry';
import { getItemDef } from '../data/goods';

export type TradeRouteStockSource = 'convoy' | 'player' | 'trade';

export type PlanetTradeMarketEntry = {
  goodId: string;
  /** 구매 탭 단가(최종 표시가 — 거래 시 변동 없음) */
  price: number;
  /** 플레이어→NPC 매도 단가(수요지, 최종) */
  npcSellPrice: number;
  /** 일 1회 조정 앵커(초기 시드·±밴드 기준) */
  baselinePrice: number;
  baselineNpcSellPrice: number;
  stock: number;
  convoyStock: number;
  playerResaleStock: number;
  demand: MarketListing['demand'];
  role: TradeRouteRole;
  updatedAt: number;
};

const byPlanet = new Map<string, Map<string, PlanetTradeMarketEntry>>();

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function demandForRole(role: TradeRouteRole): MarketListing['demand'] {
  return role === 'demand' ? 'high' : 'low';
}

function priceMod(seed: number, goodId: string): number {
  const variancePct = getTradeRouteMarketPriceVariancePct() / 100;
  const rng = pseudoRandom(seed + goodId.charCodeAt(0));
  return 1 + (rng - 0.5) * variancePct * 2;
}

function clampToPriceBand(value: number, anchor: number): number {
  if (anchor <= 0) return Math.max(1, Math.floor(value));
  const band = getTradeRouteMaxPriceBandPct() / 100;
  return Math.max(1, Math.floor(clamp(value, anchor * (1 - band), anchor * (1 + band))));
}

function buildSupplyEntry(
  planetId: string,
  goodId: string,
  attrs: NonNullable<ReturnType<typeof parseTradeRouteAttrs>>,
  seed: number,
): PlanetTradeMarketEntry {
  const stockBounds = getTradeRouteStockBounds();
  const stockSpan = stockBounds.max - stockBounds.min;
  const stockScale = resolvePlanetSupplyStockScale(planetId);
  const stock =
    stockBounds.min +
    Math.floor(pseudoRandom(seed + goodId.length) * (stockSpan + 1) * stockScale);
  const cappedStock = clampStockToTradePortLimit(planetId, stock);
  const tradeMul = getEconomyCategoryPriceMul('trade_route');
  const mod = priceMod(seed, goodId);
  const baselinePrice = Math.max(1, Math.floor(attrs.baseBuyPrice * mod * getTradeRouteSupplyBuyPriceFactor()));
  const baselineNpcSellPrice = Math.max(1, Math.floor(baselinePrice * 0.9));
  const anchor = baselinePrice * tradeMul;
  const price = clampToPriceBand(Math.floor(anchor), anchor);

  return {
    goodId,
    price,
    npcSellPrice: clampToPriceBand(Math.floor(baselineNpcSellPrice * tradeMul), baselineNpcSellPrice * tradeMul),
    baselinePrice,
    baselineNpcSellPrice,
    stock: cappedStock,
    convoyStock: 0,
    playerResaleStock: 0,
    demand: 'low',
    role: 'supply',
    updatedAt: Date.now(),
  };
}

function buildDemandImportEntry(
  planetId: string,
  goodId: string,
  attrs: NonNullable<ReturnType<typeof parseTradeRouteAttrs>>,
  seed: number,
): PlanetTradeMarketEntry {
  const stockBounds = getTradeRouteStockBounds();
  const seedPct = getTradeRouteImportSeedStockPct();
  const convoyShare = getTradeRouteConvoyChannelShare();
  const playerShare = getTradeRoutePlayerChannelShare();
  const shareTotal = Math.max(0.01, convoyShare + playerShare);
  const totalSeed = Math.max(
    0,
    Math.floor(stockBounds.max * seedPct * (0.85 + pseudoRandom(seed + goodId.length) * 0.3)),
  );
  const convoyStock = Math.floor(totalSeed * (convoyShare / shareTotal));
  const playerResaleStock = Math.max(0, totalSeed - convoyStock);

  const tradeMul = getEconomyCategoryPriceMul('trade_route');
  const mod = priceMod(seed, goodId);
  const ratio = getTradeRouteImportBuyPriceRatio();
  const importBase = attrs.baseBuyPrice + (attrs.baseSellPrice - attrs.baseBuyPrice) * ratio;
  const baselinePrice = Math.max(1, Math.floor(importBase * mod));
  const supplyPlanetId = resolveTradeRouteAssignedSupplyPlanetId(goodId);
  const distanceSellAnchor = supplyPlanetId
    ? resolveDistanceScaledDemandSellAnchor(attrs, supplyPlanetId, planetId)
    : attrs.baseSellPrice;
  const baselineNpcSellPrice = Math.max(1, Math.floor(distanceSellAnchor * mod));
  const buyAnchor = baselinePrice * tradeMul;
  const sellAnchor = baselineNpcSellPrice * tradeMul;
  const price = clampToPriceBand(Math.floor(buyAnchor), buyAnchor);
  const npcSellPrice = clampToPriceBand(Math.floor(sellAnchor), sellAnchor);

  return {
    goodId,
    price,
    npcSellPrice,
    baselinePrice,
    baselineNpcSellPrice,
    stock: convoyStock + playerResaleStock,
    convoyStock,
    playerResaleStock,
    demand: 'high',
    role: 'demand',
    updatedAt: Date.now(),
  };
}

function buildEntry(
  planetId: string,
  goodId: string,
  role: TradeRouteRole,
  seed: number,
): PlanetTradeMarketEntry | null {
  const def = getItemDef(goodId);
  const attrs = parseTradeRouteAttrs(def);
  if (!attrs) return null;
  if (role === 'supply') return buildSupplyEntry(planetId, goodId, attrs, seed);
  return buildDemandImportEntry(planetId, goodId, attrs, seed);
}

function listMarketItemIdsForPlanet(planetId: string): string[] {
  return [
    ...listTradeRouteSupplyBuyItemIdsForPlanet(planetId),
    ...listTradeRouteDemandImportItemIdsForPlanet(planetId),
  ];
}

/**
 * 수요지 수입 재고 SKU(수송·플레이어 매입 시뮬용).
 * 플레이어 구매 탭에는 노출하지 않음 — `tradeRouteCommercePolicy.listTradeRoutePlayerBuyItemIds`.
 */
export function listTradeRouteImportBuyItemIds(planetId: string): string[] {
  const map = byPlanet.get(planetId);
  if (!map) return [];
  return [...map.values()]
    .filter((entry) => entry.role === 'demand' && entry.stock > 0)
    .map((entry) => entry.goodId)
    .sort();
}

/** 아크코어 — 행성 교역품 시장 재구성(force 시 재고 초기화, 아니면 신규 품목만 추가) */
export function rebuildPlanetTradeMarket(
  planetId: string,
  seed = planetId.length * 37,
  force = false,
): void {
  const itemIds = listMarketItemIdsForPlanet(planetId);
  const prev = byPlanet.get(planetId);
  const map = force || !prev ? new Map<string, PlanetTradeMarketEntry>() : new Map(prev);

  for (const goodId of itemIds) {
    const role = resolveTradeRouteRole(planetId, goodId);
    if (!role) continue;
    if (!force && map.has(goodId)) continue;
    const entry = buildEntry(planetId, goodId, role, seed);
    if (entry) map.set(goodId, entry);
  }

  if (!force && prev) {
    for (const key of [...map.keys()]) {
      if (!itemIds.includes(key)) map.delete(key);
    }
  }

  byPlanet.set(planetId, map);
}

export function rebuildAllPlanetTradeMarkets(planetIds: readonly string[], force = false): void {
  for (const planetId of planetIds) {
    rebuildPlanetTradeMarket(planetId, planetId.length * 37, force);
  }
}

export function getPlanetTradeMarketEntry(
  planetId: string,
  goodId: string,
): PlanetTradeMarketEntry | null {
  return byPlanet.get(planetId)?.get(goodId) ?? null;
}

/** 교역품 listing — 스토어 미구성 시 rebuild 후 role·attrs 기반 가격 */
export function resolveTradeRouteMarketListing(
  planetId: string,
  goodId: string,
): MarketListing | null {
  if (!getPlanetTradeMarketEntry(planetId, goodId)) {
    rebuildPlanetTradeMarket(planetId);
  }
  const entry = getPlanetTradeMarketEntry(planetId, goodId);
  if (!entry) return null;
  return {
    goodId,
    price: entry.price,
    stock: entry.stock,
    /** 교역품은 price가 최종 단가 — 수요 배율 이중 적용 방지 */
    demand: 'normal',
  };
}

/** 플레이어→NPC 매도 단가(수요지 교역품) */
export function resolveTradeRouteNpcSellUnit(planetId: string, goodId: string): number {
  if (!getPlanetTradeMarketEntry(planetId, goodId)) {
    rebuildPlanetTradeMarket(planetId);
  }
  const entry = getPlanetTradeMarketEntry(planetId, goodId);
  if (!entry) return 0;
  if (entry.role === 'demand') {
    return Math.max(1, Math.floor(entry.npcSellPrice));
  }
  const localOriginSell = resolveSamePlanetOriginResaleSellUnit(
    planetId,
    goodId,
    0,
    entry.price,
  );
  if (localOriginSell != null) return localOriginSell;
  return Math.max(1, Math.floor(entry.npcSellPrice));
}

export function getPlanetTradeMarketListings(planetId: string): PlanetTradeMarketEntry[] {
  const map = byPlanet.get(planetId);
  if (!map) return [];
  return [...map.values()];
}

function applyStockDelta(
  entry: PlanetTradeMarketEntry,
  delta: number,
  source: TradeRouteStockSource,
): void {
  if (delta > 0) {
    if (source === 'convoy') entry.convoyStock += delta;
    else if (source === 'player') entry.playerResaleStock += delta;
    else {
      const convoyShare = getTradeRouteConvoyChannelShare();
      const playerShare = getTradeRoutePlayerChannelShare();
      const total = convoyShare + playerShare;
      entry.convoyStock += Math.floor(delta * (convoyShare / total));
      entry.playerResaleStock += delta - Math.floor(delta * (convoyShare / total));
    }
  } else if (delta < 0) {
    let remaining = -delta;
    const fromPlayer = Math.min(entry.playerResaleStock, remaining);
    entry.playerResaleStock -= fromPlayer;
    remaining -= fromPlayer;
    entry.convoyStock = Math.max(0, entry.convoyStock - remaining);
  }
  entry.stock = Math.max(0, entry.convoyStock + entry.playerResaleStock);
}

function applyTradePortStockCap(planetId: string, entry: PlanetTradeMarketEntry): void {
  if (entry.role !== 'supply') return;
  const capped = clampStockToTradePortLimit(planetId, entry.stock);
  if (capped >= entry.stock) return;
  const ratio = entry.stock > 0 ? capped / entry.stock : 0;
  entry.convoyStock = Math.floor(entry.convoyStock * ratio);
  entry.playerResaleStock = Math.max(0, capped - entry.convoyStock);
  entry.stock = capped;
}

export function adjustPlanetTradeMarketStock(
  planetId: string,
  goodId: string,
  delta: number,
  source: TradeRouteStockSource = 'trade',
): void {
  let map = byPlanet.get(planetId);
  if (!map) {
    rebuildPlanetTradeMarket(planetId);
    map = byPlanet.get(planetId);
  }
  if (!map) return;

  let entry = map.get(goodId);
  if (!entry && delta > 0) {
    const role = resolveTradeRouteRole(planetId, goodId);
    if (role === 'demand') {
      const built = buildEntry(planetId, goodId, 'demand', planetId.length * 37);
      if (built) {
        built.stock = 0;
        built.convoyStock = 0;
        built.playerResaleStock = 0;
        map.set(goodId, built);
        entry = built;
      }
    }
  }
  if (!entry) return;

  applyStockDelta(entry, delta, source);
  applyTradePortStockCap(planetId, entry);
  entry.updatedAt = Date.now();
}

export type TradeRouteDailyMarketAdjustResult = {
  ran: boolean;
  planetCount: number;
  entryCount: number;
  tradeRoutePressure: number;
  tradeRouteCategoryMul: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function stepPriceToward(current: number, target: number, maxStepRatio: number): number {
  const delta = target - current;
  const capped = clamp(delta, -current * maxStepRatio, current * maxStepRatio);
  return Math.max(1, Math.floor(current + capped));
}

function applyDailyAdjustToEntry(
  planetId: string,
  entry: PlanetTradeMarketEntry,
  tradeRoutePressure: number,
  tradeRouteCategoryMul: number,
): void {
  const attrs = parseTradeRouteAttrs(getItemDef(entry.goodId));
  if (!attrs) return;

  if (!entry.baselinePrice) entry.baselinePrice = entry.price;
  if (!entry.baselineNpcSellPrice) entry.baselineNpcSellPrice = entry.npcSellPrice;

  const targetStock = getTradeRouteTargetStockMid();
  const stockBounds = getTradeRouteStockBounds();
  const maxStep = getTradeRouteDailyMarketPolicyNum('max_daily_price_step_pct', 2.5) / 100;
  const restockPct = getTradeRouteDailyMarketPolicyNum('max_daily_stock_restock_pct', 18) / 100;
  const stockPressureCoef = getTradeRouteDailyMarketPolicyNum('stock_pressure_price_coef', 0.14);
  const tradePressureCoef = getTradeRouteDailyMarketPolicyNum('trade_pressure_price_coef', 0.35);
  const distPremiumPerRef = getTradeRouteDailyMarketPolicyNum('distance_price_premium_per_ref', 0.9) / 100;
  const ratioStep = getTradeRouteDailyMarketPolicyNum('import_buy_ratio_adjust_step', 0.02);
  const minImportRatio = getTradeRouteDailyMarketPolicyNum('min_import_buy_ratio', 0.42);
  const maxImportRatio = getTradeRouteDailyMarketPolicyNum('max_import_buy_ratio', 0.68);

  const stockSkew = targetStock > 0 ? (targetStock - entry.stock) / targetStock : 0;
  const pressureDelta = clamp(
    stockSkew * stockPressureCoef + tradeRoutePressure * tradePressureCoef * 0.01,
    -maxStep,
    maxStep,
  );

  if (entry.role === 'supply') {
    if (entry.stock < targetStock) {
      entry.stock = Math.min(
        stockBounds.max,
        entry.stock + Math.max(1, Math.floor((targetStock - entry.stock) * restockPct)),
      );
    }
    const targetBuy = Math.max(1, Math.floor(entry.baselinePrice * tradeRouteCategoryMul * (1 + pressureDelta)));
    entry.price = clampToPriceBand(
      stepPriceToward(entry.price, targetBuy, maxStep),
      entry.baselinePrice * tradeRouteCategoryMul,
    );
    entry.npcSellPrice = clampToPriceBand(
      stepPriceToward(entry.npcSellPrice, Math.floor(entry.baselineNpcSellPrice * tradeRouteCategoryMul * (1 + pressureDelta)), maxStep),
      entry.baselineNpcSellPrice * tradeRouteCategoryMul,
    );
  } else {
    const importTarget = Math.max(
      stockBounds.min,
      Math.floor(stockBounds.max * getTradeRouteImportSeedStockPct()),
    );
    if (entry.stock < importTarget) {
      const gap = importTarget - entry.stock;
      const convoyShare = getTradeRouteConvoyChannelShare();
      const playerShare = getTradeRoutePlayerChannelShare();
      const shareTotal = Math.max(0.01, convoyShare + playerShare);
      const convoyAdd = Math.floor(gap * restockPct * (convoyShare / shareTotal));
      const playerAdd = Math.max(0, Math.floor(gap * restockPct) - convoyAdd);
      entry.convoyStock += convoyAdd;
      entry.playerResaleStock += playerAdd;
      entry.stock = entry.convoyStock + entry.playerResaleStock;
    }

    const supplyPlanetId = resolveNearestSupplyPlanetForTradeGood(planetId, entry.goodId);
    const refDist = getTradeRouteReferenceMapDistance();
    const distance = supplyPlanetId
      ? resolvePlanetSystemMapDistance(supplyPlanetId, planetId)
      : refDist;
    const distPremium = refDist > 0 ? (distance / refDist) * distPremiumPerRef : 0;

    const scarcity = Math.max(0, stockSkew);
    const importRatio = clamp(
      getTradeRouteImportBuyPriceRatio() + scarcity * ratioStep,
      minImportRatio,
      maxImportRatio,
    );
    const importBase = attrs.baseBuyPrice + (attrs.baseSellPrice - attrs.baseBuyPrice) * importRatio;
    const targetImportBuy = Math.max(
      1,
      Math.floor(importBase * tradeRouteCategoryMul * (1 + distPremium + pressureDelta)),
    );
    const distanceSellAnchor = supplyPlanetId
      ? resolveDistanceScaledDemandSellAnchor(attrs, supplyPlanetId, planetId)
      : attrs.baseSellPrice;
    const targetNpcSell = Math.max(
      1,
      Math.floor(distanceSellAnchor * tradeRouteCategoryMul * (1 + distPremium * 1.15 + pressureDelta)),
    );
    entry.price = clampToPriceBand(
      stepPriceToward(entry.price, targetImportBuy, maxStep),
      entry.baselinePrice * tradeRouteCategoryMul,
    );
    entry.npcSellPrice = clampToPriceBand(
      stepPriceToward(entry.npcSellPrice, targetNpcSell, maxStep),
      entry.baselineNpcSellPrice * tradeRouteCategoryMul,
    );
  }

  if (entry.stock <= targetStock * 0.35) entry.demand = 'high';
  else if (entry.stock >= targetStock * 1.65) entry.demand = 'low';
  else entry.demand = entry.role === 'demand' ? 'high' : 'low';

  applyTradePortStockCap(planetId, entry);
  entry.updatedAt = Date.now();
}

/**
 * 아크코어 일 1회 — 교역품 행성별 재고·거리·수요 압력 기반 가격 미세조정.
 * `runMarketMicroAdjustPass` 직후 카테고리 배율을 반영한다.
 */
export function runTradeRouteDailyMarketMicroAdjustAll(
  tradeRoutePressure: number,
  tradeRouteCategoryMul: number,
): TradeRouteDailyMarketAdjustResult {
  const planetIds = listPlanetIdsWithTradePort();
  rebuildAllPlanetTradeMarkets(planetIds, false);

  let entryCount = 0;
  let planetCount = 0;

  for (const planetId of planetIds) {
    const map = byPlanet.get(planetId);
    if (!map || map.size === 0) continue;
    planetCount += 1;
    for (const entry of map.values()) {
      applyDailyAdjustToEntry(planetId, entry, tradeRoutePressure, tradeRouteCategoryMul);
      entryCount += 1;
    }
  }

  return {
    ran: entryCount > 0,
    planetCount,
    entryCount,
    tradeRoutePressure,
    tradeRouteCategoryMul,
  };
}
