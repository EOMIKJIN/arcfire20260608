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
  computeTradeRouteTransportCostPerUnit,
  getTradeRouteMinNetProfitPerUnit,
} from './tradeRouteTransportCost';
import {
  isTradeRouteDestinationPlanet,
  listConvoySourceRoutesAtPlanet,
  listDemandPlanetIdsForTradeGood,
  resolveTradeRouteRole,
  type TradeRouteAttrs,
} from './tradeRouteRegistry';
import { resolveConvoyDemandGrossRoomCredits } from './convoyDemandGrossRoom';
import { isPlanetConvoyTradeEnabled } from './synthFrontierConvoyTradeBridge';
import { recordArcHitch } from '../devArcHitchLog';

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

const destConvoyEnabledScratch = new Map<string, boolean>();
const destDemandRoomScratch = new Map<string, number>();

/** [arc-hitch] DEV 전용 — 경로 계산 구간별 누적 ms */
const devPlanMs = { routes: 0, role: 0, buy: 0, stock: 0, destList: 0, destGate: 0, sell: 0, cost: 0, room: 0 };
let devPlanDests = 0;
/** headless 감사(node)에는 __DEV__ 전역이 없다. */
const ARC_HITCH_DEV = typeof __DEV__ !== 'undefined' && __DEV__;
function devNow(): number {
  return ARC_HITCH_DEV ? performance.now() : 0;
}

/** 생산지 시장 재고·시세·수요지 순차익 기준 최적 교역 계획 */
export function planArcConvoyRouteAtSupply(
  supplyPlanetId: string,
  shipId: string,
  bankBalance: number,
  opts?: { ignoreBankAffordability?: boolean; minQty?: number; forceDestPlanetId?: string },
): ArcConvoyRoutePlan | null {
  if (!ARC_HITCH_DEV) return planArcConvoyRouteAtSupplyImpl(supplyPlanetId, shipId, bankBalance, opts);
  const m = devPlanMs;
  m.routes = m.role = m.buy = m.stock = m.destList = m.destGate = m.sell = m.cost = m.room = 0;
  devPlanDests = 0;
  const t0 = performance.now();
  const out = planArcConvoyRouteAtSupplyImpl(supplyPlanetId, shipId, bankBalance, opts);
  const total = performance.now() - t0;
  // 행성별 라벨은 분당 요약에서 하나로 묶는다. 구간 분해 줄은 200ms 이상일 때만 남긴다.
  recordArcHitch('plan', 'convoy_route', total);
  if (total >= 200) {
    // eslint-disable-next-line no-console
    console.log(
      '[arc-hitch] plan', supplyPlanetId, Math.round(total),
      `routes=${Math.round(m.routes)} role=${Math.round(m.role)} buy=${Math.round(m.buy)} stock=${Math.round(m.stock)}`,
      `destList=${Math.round(m.destList)} destGate=${Math.round(m.destGate)} sell=${Math.round(m.sell)}`,
      `cost=${Math.round(m.cost)} room=${Math.round(m.room)} dests=${devPlanDests}`,
    );
  }
  return out;
}

function planArcConvoyRouteAtSupplyImpl(
  supplyPlanetId: string,
  shipId: string,
  bankBalance: number,
  opts?: { ignoreBankAffordability?: boolean; minQty?: number; forceDestPlanetId?: string },
): ArcConvoyRoutePlan | null {
  const m = devPlanMs;
  // 한 번의 동기 계산 안에서만 쓰는 수요지 결과 — 교역품마다 같은 수요지를 반복 조회한다.
  destConvoyEnabledScratch.clear();
  destDemandRoomScratch.clear();
  if (!isPlanetConvoyTradeEnabled(supplyPlanetId)) return null;
  let t = devNow();
  const routes = listConvoySourceRoutesAtPlanet(supplyPlanetId);
  if (ARC_HITCH_DEV) m.routes += performance.now() - t;
  if (routes.length === 0) return null;

  const minNetProfitPerUnit = getTradeRouteMinNetProfitPerUnit();
  const candidates: ArcConvoyRoutePlan[] = [];

  for (const route of routes) {
    t = devNow();
    const role = resolveTradeRouteRole(supplyPlanetId, route.tgId);
    if (ARC_HITCH_DEV) m.role += performance.now() - t;
    if (role !== 'supply') continue;

    t = devNow();
    const unitBuyPrice = resolveSupplyPlanetBuyUnit(supplyPlanetId, route.tgId);
    if (ARC_HITCH_DEV) m.buy += performance.now() - t;
    if (unitBuyPrice <= 0) continue;

    t = devNow();
    const supplyStock = resolveSupplyMarketStock(supplyPlanetId, route.tgId);
    if (ARC_HITCH_DEV) m.stock += performance.now() - t;
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

    t = devNow();
    const destIds = listDemandPlanetIdsForTradeGood(route.tgId);
    if (ARC_HITCH_DEV) m.destList += performance.now() - t;
    for (const destPlanetId of destIds) {
      if (ARC_HITCH_DEV) devPlanDests += 1;
      if (opts?.forceDestPlanetId && destPlanetId !== opts.forceDestPlanetId) continue;
      t = devNow();
      let destEnabled = destConvoyEnabledScratch.get(destPlanetId);
      if (destEnabled === undefined) {
        destEnabled = isPlanetConvoyTradeEnabled(destPlanetId);
        destConvoyEnabledScratch.set(destPlanetId, destEnabled);
      }
      const destOk = destEnabled && isTradeRouteDestinationPlanet(destPlanetId, route.attrs);
      if (ARC_HITCH_DEV) m.destGate += performance.now() - t;
      if (!destOk) continue;
      t = devNow();
      const unitSellPrice = resolveDemandPlanetSellUnit(destPlanetId, route.tgId);
      if (ARC_HITCH_DEV) m.sell += performance.now() - t;
      if (unitSellPrice <= 0) continue;

      const grossPerUnit = unitSellPrice - unitBuyPrice;
      if (grossPerUnit <= 0) continue;

      t = devNow();
      const transportCostPerUnit = computeTradeRouteTransportCostPerUnit(
        supplyPlanetId,
        destPlanetId,
        route.tgId,
      );
      // tradeRouteTransportCost.applyTradeRouteNetProfitPerUnit와 같은 식 — 운송비를 두 번 계산하지 않는다.
      const netProfitPerUnit = Math.max(
        minNetProfitPerUnit,
        Math.floor(grossPerUnit) - transportCostPerUnit,
      );
      if (ARC_HITCH_DEV) m.cost += performance.now() - t;
      if (netProfitPerUnit <= 0) continue;

      t = devNow();
      let demandRoom = destDemandRoomScratch.get(destPlanetId);
      if (demandRoom === undefined) {
        demandRoom = resolveConvoyDemandGrossRoomCredits(destPlanetId);
        destDemandRoomScratch.set(destPlanetId, demandRoom);
      }
      if (ARC_HITCH_DEV) m.room += performance.now() - t;
      if (demandRoom <= 0) continue;

      let qty = maxQty;
      const estSellGross = unitSellPrice * qty;
      if (estSellGross > demandRoom) {
        qty = Math.max(0, Math.floor(demandRoom / unitSellPrice));
      }
      const minQty = opts?.minQty ?? 1;
      if (qty < minQty) continue;

      candidates.push({
        tgId: route.tgId,
        attrs: route.attrs,
        srcPlanetId: supplyPlanetId,
        destPlanetId,
        unitBuyPrice,
        unitSellPrice,
        transportCostPerUnit,
        netProfitPerUnit,
        qty,
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
  const netPerUnit = grossPerUnit > 0
    ? Math.max(getTradeRouteMinNetProfitPerUnit(), Math.floor(grossPerUnit) - transportCostPerUnit)
    : 0;
  return {
    unitSellPrice,
    transportCostPerUnit,
    netProfitTotal: Math.max(0, netPerUnit * qty),
  };
}
