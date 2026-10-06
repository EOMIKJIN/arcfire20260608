/**
 * tg_* 교역로 왕복 — 공급지에서 사서 수요지에 판다.
 * 단가는 실기 정본 함수(공급 매입 앵커 · 거리 가중 차익)와 무역소 Lv1 수수료를 쓴다.
 * 시장 스토어(행성별 ±변동·일일 보충률)는 트윈에 없으므로 앵커가·재고 중앙값으로 근사한다.
 */
import { FacilityTradePortLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityTradePortLevelPolicy';
import { getTradeRouteStockBounds } from '../../../src/arcCore/balance/balanceTableRegistry';
import {
  listDemandPlanetIdsForTradeGood,
  listTradeRouteDemandImportItemIdsForPlanet,
  listTradeRouteItems,
  listTradeRouteSupplyBuyItemIdsForPlanet,
} from '../../../src/arcCore/economy/tradeRouteRegistry';
import { resolveTradeRouteAssignedSupplyPlanetId } from '../../../src/arcCore/economy/tradeRoutePlanetAssignmentRegistry';
import {
  resolveDistanceScaledTradeRouteGrossProfit,
  resolveTradeRouteSupplyBuyAnchor,
} from '../../../src/arcCore/economy/tradeRouteDistanceProfit';
import { bfsNextSystem, hopsBetween, lookupHasTrade, lookupSystemId } from './catalog';
import { hopFuelCredits } from './liveCombat';
import type { WorldState } from './types';

export type TgRoute = {
  goodId: string;
  category: string;
  supply: string;
  demand: string;
  buyUnit: number;
  sellUnit: number;
  /** 매입 수수료 포함 지출 */
  costUnit: number;
  /** 매도 수수료 차감 후 손에 남는 돈 − costUnit */
  netUnit: number;
};

const FEE_PCT = Number(
  FacilityTradePortLevelPolicy_FROM_BALANCE_CSV.find((r) => Number(r.level) === 1)?.tradeFeeRatePct ?? 10,
) / 100;

let routes: TgRoute[] | null = null;
let losingRoutes = 0;

/** 플레이어가 실제로 사고팔 수 있는 교역로. 모듈 수명 1회 빌드. */
export function listTgRoutes(): TgRoute[] {
  if (routes) return routes;
  const out: TgRoute[] = [];
  losingRoutes = 0;
  const supplyOk = new Map<string, Set<string>>();
  const demandOk = new Map<string, Set<string>>();
  const items = listTradeRouteItems();
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    const supply = resolveTradeRouteAssignedSupplyPlanetId(it.id);
    if (!supply || !lookupSystemId(supply) || !lookupHasTrade(supply)) continue;
    let sSet = supplyOk.get(supply);
    if (!sSet) {
      sSet = new Set(listTradeRouteSupplyBuyItemIdsForPlanet(supply));
      supplyOk.set(supply, sSet);
    }
    if (!sSet.has(it.id)) continue;
    const demands = listDemandPlanetIdsForTradeGood(it.id);
    for (let j = 0; j < demands.length; j += 1) {
      const demand = demands[j];
      if (demand === supply || !lookupSystemId(demand) || !lookupHasTrade(demand)) continue;
      let dSet = demandOk.get(demand);
      if (!dSet) {
        dSet = new Set(listTradeRouteDemandImportItemIdsForPlanet(demand));
        demandOk.set(demand, dSet);
      }
      if (!dSet.has(it.id)) continue;
      const buyUnit = resolveTradeRouteSupplyBuyAnchor(it.attrs);
      const sellUnit = buyUnit + resolveDistanceScaledTradeRouteGrossProfit(it.attrs, supply, demand);
      const costUnit = Math.ceil(buyUnit * (1 + FEE_PCT));
      const netUnit = Math.floor(sellUnit * (1 - FEE_PCT)) - costUnit;
      if (netUnit <= 0) {
        losingRoutes += 1;
        continue;
      }
      out.push({ goodId: it.id, category: it.category, supply, demand, buyUnit, sellUnit, costUnit, netUnit });
    }
  }
  routes = out;
  return out;
}

export function tgRouteStats(): { profitable: number; losing: number; feePct: number } {
  const list = listTgRoutes();
  return { profitable: list.length, losing: losingRoutes, feePct: FEE_PCT * 100 };
}

function stockPerDay(): number {
  const b = getTradeRouteStockBounds();
  return Math.floor((b.min + b.max) / 2);
}

function boughtToday(world: WorldState, key: string): number {
  const rec = world.tgBought?.[key];
  return rec && rec.day === world.day ? rec.qty : 0;
}

function sysHops(a: string, b: string): number {
  const sa = lookupSystemId(a);
  const sb = lookupSystemId(b);
  if (!sa || !sb) return 99;
  return sa === sb ? 0 : hopsBetween(sa, sb);
}

/** 경로 연료 근사 — 첫 홉 단가 × 홉 수. */
export function routeFuelEstimate(world: WorldState, from: string, to: string): number {
  const sa = lookupSystemId(from);
  const sb = lookupSystemId(to);
  if (!sa || !sb || sa === sb) return 0;
  const hops = hopsBetween(sa, sb);
  const next = bfsNextSystem(sa, sb);
  if (!next) return 1e9;
  return hops * hopFuelCredits(sa, next, world.hullTierKey || 'frigate_default', hops);
}

export type TgPlan = { route: TgRoute; qty: number; profit: number; hops: number; fuel: number };

/**
 * 지금 잔액·재고로 홉당 순익이 가장 큰 교역로. 연료를 뺀 순익이 없으면 null.
 * reserve 는 사고 나서도 남겨 둘 돈(연료·지급불능선).
 */
export function pickTgPlan(world: WorldState, reserve: number): TgPlan | null {
  const list = listTgRoutes();
  const cap = stockPerDay();
  let best: TgPlan | null = null;
  let bestRate = 0;
  for (let i = 0; i < list.length; i += 1) {
    const r = list[i];
    const avail = cap - boughtToday(world, `${r.supply}|${r.goodId}`);
    if (avail <= 0) continue;
    const toSupply = sysHops(world.currentPlanetId, r.supply);
    const leg = sysHops(r.supply, r.demand);
    if (toSupply >= 99 || leg >= 99) continue;
    const fuel = routeFuelEstimate(world, world.currentPlanetId, r.supply) + routeFuelEstimate(world, r.supply, r.demand);
    const spend = world.credits - reserve - fuel;
    if (spend < r.costUnit) continue;
    const qty = Math.min(avail, Math.floor(spend / r.costUnit));
    const profit = qty * r.netUnit - fuel;
    if (profit <= 0) continue;
    const hops = toSupply + leg + 1;
    const rate = profit / hops;
    if (rate > bestRate) {
      bestRate = rate;
      best = { route: r, qty, profit, hops, fuel };
    }
  }
  return best;
}

export function noteTgBought(world: WorldState, r: TgRoute, qty: number): void {
  const key = `${r.supply}|${r.goodId}`;
  const map = (world.tgBought ??= {});
  const prev = map[key];
  map[key] = { day: world.day, qty: (prev && prev.day === world.day ? prev.qty : 0) + qty };
}
