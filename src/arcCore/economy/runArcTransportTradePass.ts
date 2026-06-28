// ============================================================
// 아크코어 수송선단 — tg_* 실거래·수송선단 금고·무역소 수수료 연동
// ============================================================

import { applyAabsTradeIncomeMultiplier } from '../aabs/aabsPolicyStore';
import { vaultAllowsNegativeBalance } from './planetUpkeepPolicy';
import { applyPlanetTradeTransactionFee } from './applyPlanetTradeTransactionFee';
import { isPlanetConvoyTradeEnabled } from './synthFrontierConvoyTradeBridge';
import { getConvoyDemandDailyGrossCapCredits } from '../balance/balanceTableRegistry';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { adjustPlanetTradeMarketStock } from '../../world/planetTradeMarketStore';
import {
  planArcConvoyRouteAtSupply,
  resolveArcConvoyUnloadSettlement,
} from './arcConvoyTradePlanner';
import { recordPlanetEconomyConvoySettlement } from './planetEconomyFabric';
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

export function clearConvoyShipCargo(shipId: string): void {
  if (!shipId) return;
  shipCargoById.delete(shipId);
}

export function hasConvoyShipCargo(shipId: string): boolean {
  return shipCargoById.has(shipId);
}

/** 적재 후 목표 수요 행성 — 궤도 수송선 다음 행성 선택에 사용 */
export function getConvoyShipCargoDestination(shipId: string): string | null {
  return shipCargoById.get(shipId)?.plannedDestPlanetId ?? null;
}

/**
 * 수송선 행성 체류 종료 시 1회 — 적재 또는 하역·수익 정산.
 * 매입·매출 시 해당 행성 무역소 수수료를 팩션 금고·ledger에 즉시 반영한다.
 */
export function settleArcTransportDwellTrade(shipId: string, planetId: string): void {
  if (!shipId || !planetId) return;
  if (!isPlanetConvoyTradeEnabled(planetId)) return;
  if (!getPlanetTradeRouteProfile(planetId)) return;

  const bank = useArcCoreTransportFleetBankStore.getState();
  if (!bank.hydrated) return;

  const existing = shipCargoById.get(shipId);
  if (existing) {
    if (!getPlanetTradeRouteProfile(planetId)) return;
    if (isTradeRouteDestinationPlanet(planetId, existing.attrs)) {
      const settlement = resolveArcConvoyUnloadSettlement(
        existing.srcPlanetId,
        planetId,
        existing.tgId,
        existing.qty,
        existing.unitBuyPrice,
      );
      let unloadQty = existing.qty;
      let sellGross = settlement.unitSellPrice * unloadQty;
      const grossCap = getConvoyDemandDailyGrossCapCredits();
      if (grossCap > 0 && usePlanetTradeFeeLedgerStore.getState().hydrated) {
        const priorGross =
          usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId]?.convoyGrossCredits ?? 0;
        const room = Math.max(0, grossCap - priorGross);
        if (room <= 0) {
          shipCargoById.delete(shipId);
          return;
        }
        if (sellGross > room) {
          const scale = room / sellGross;
          unloadQty = Math.max(1, Math.min(existing.qty, Math.ceil(existing.qty * scale)));
          sellGross = settlement.unitSellPrice * unloadQty;
        }
      }
      applyPlanetTradeTransactionFee(planetId, sellGross, 'convoy');

      const profitScale = existing.qty > 0 ? unloadQty / existing.qty : 1;
      const profit = applyAabsTradeIncomeMultiplier(
        Math.floor(settlement.netProfitTotal * profitScale),
      );
      if (profit > 0) {
        bank.appendInflow(profit, {
          kind: 'convoy_profit',
          tgId: existing.tgId,
          shipId,
          planetId,
          note: [
            `${existing.srcPlanetId}→${planetId}`,
            `qty=${unloadQty}`,
            `buy@${existing.unitBuyPrice}`,
            `sell@${settlement.unitSellPrice}`,
            `ship@${settlement.transportCostPerUnit}/u`,
            `net=${profit}`,
          ].join(' '),
        });
      } else if (profit < 0) {
        bank.applyDelta(profit, {
          kind: 'convoy_loss',
          tgId: existing.tgId,
          shipId,
          planetId,
          note: `convoy_loss net=${profit}`,
        });
      }
      adjustPlanetTradeMarketStock(planetId, existing.tgId, unloadQty, 'convoy');
      recordPlanetEconomyConvoySettlement(planetId, unloadQty, profit);
      shipCargoById.delete(shipId);
    }
    return;
  }

  if (!getPlanetTradeRouteProfile(planetId)) return;

  const plan = planArcConvoyRouteAtSupply(planetId, shipId, bank.getBalance(), {
    ignoreBankAffordability: vaultAllowsNegativeBalance(),
  });
  if (!plan) return;

  const def = getItemDef(plan.tgId);
  const attrs = parseTradeRouteAttrs(def);
  if (!attrs) return;

  const cost = plan.unitBuyPrice * plan.qty;
  if (!bank.trySpend(cost, {
    kind: 'convoy_buy',
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

  applyPlanetTradeTransactionFee(planetId, cost, 'convoy');

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

/** 일일 정산·백필 — 생산지 적재 후 수요지 하역까지 1회 왕복 */
export function executeArcConvoyRoundTrip(
  shipId: string,
  supplyPlanetId: string,
  opts?: { minQty?: number; forceDestPlanetId?: string },
): { ok: boolean; destPlanetId?: string; reason?: string } {
  clearConvoyShipCargo(shipId);
  const bank = useArcCoreTransportFleetBankStore.getState();
  if (!bank.hydrated) return { ok: false, reason: 'fleet_bank_not_hydrated' };

  const plan = planArcConvoyRouteAtSupply(supplyPlanetId, shipId, bank.getBalance(), {
    ignoreBankAffordability: vaultAllowsNegativeBalance(),
    minQty: opts?.minQty,
    forceDestPlanetId: opts?.forceDestPlanetId,
  });
  if (!plan) return { ok: false, reason: 'no_route' };

  settleArcTransportDwellTrade(shipId, supplyPlanetId);
  if (!hasConvoyShipCargo(shipId)) {
    return { ok: false, reason: 'load_failed' };
  }

  settleArcTransportDwellTrade(shipId, plan.destPlanetId);
  return { ok: true, destPlanetId: plan.destPlanetId };
}
