// ============================================================
// 행성별 교역품 시장 — 아크코어 단일 운영(수요·공급·재고·가격)
// ============================================================

import type { MarketListing } from '../types';
import {
  getTradeRouteMarketPriceVariancePct,
  getTradeRouteStockBounds,
} from '../arcCore/balance/balanceTableRegistry';
import {
  listTradeRouteItemIdsForPlanet,
  parseTradeRouteAttrs,
  resolveTradeRouteRole,
  type TradeRouteRole,
} from '../arcCore/economy/tradeRouteRegistry';
import { getItemDef } from '../data/goods';

export type PlanetTradeMarketEntry = {
  goodId: string;
  price: number;
  stock: number;
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

function buildEntry(
  planetId: string,
  goodId: string,
  role: TradeRouteRole,
  seed: number,
): PlanetTradeMarketEntry | null {
  const def = getItemDef(goodId);
  const attrs = parseTradeRouteAttrs(def);
  if (!attrs) return null;

  const stockBounds = getTradeRouteStockBounds();
  const stockSpan = stockBounds.max - stockBounds.min;
  const stock =
    stockBounds.min + Math.floor(pseudoRandom(seed + goodId.length) * (stockSpan + 1));

  const variancePct = getTradeRouteMarketPriceVariancePct() / 100;
  const rng = pseudoRandom(seed + goodId.charCodeAt(0));
  const priceMod = 1 + (rng - 0.5) * variancePct * 2;
  const base = role === 'supply' ? attrs.baseBuyPrice : attrs.baseSellPrice;
  const price = Math.max(1, Math.floor(base * priceMod));

  return {
    goodId,
    price,
    stock,
    demand: demandForRole(role),
    role,
    updatedAt: Date.now(),
  };
}

/** 아크코어 — 행성 교역품 시장 재구성(force 시 재고 초기화, 아니면 신규 품목만 추가) */
export function rebuildPlanetTradeMarket(
  planetId: string,
  seed = planetId.length * 37,
  force = false,
): void {
  const itemIds = listTradeRouteItemIdsForPlanet(planetId);
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

export function getPlanetTradeMarketListings(planetId: string): PlanetTradeMarketEntry[] {
  const map = byPlanet.get(planetId);
  if (!map) return [];
  return [...map.values()];
}

export function adjustPlanetTradeMarketStock(
  planetId: string,
  goodId: string,
  delta: number,
): void {
  const map = byPlanet.get(planetId);
  if (!map) return;
  const entry = map.get(goodId);
  if (!entry) return;
  entry.stock = Math.max(0, entry.stock + delta);
  entry.updatedAt = Date.now();
}
