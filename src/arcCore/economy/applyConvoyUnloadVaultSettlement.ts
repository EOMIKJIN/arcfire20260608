// ============================================================
// convoy 하역 — 운송비 지출·순마진 10% 아크코어 금고 귀속
// ============================================================

import { applyAabsTradeIncomeMultiplier } from '../aabs/aabsPolicyStore';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import {
  formatConvoyTransportSpendNote,
  getConvoyNetMarginArcCoreSharePct,
} from './tradeRouteTransportCost';

export type ConvoyUnloadVaultSettlementInput = {
  bank: Pick<FactionVaultState, 'trySpend' | 'appendInflow' | 'applyDelta' | 'recordAudit'>;
  arcVault: Pick<FactionVaultState, 'appendInflow'>;
  netMarginBeforeAabs: number;
  transportCostTotal: number;
  tgId: string;
  shipId: string;
  destPlanetId: string;
  routeLabel: string;
  unloadQty: number;
  unitBuyPrice: number;
  unitSellPrice: number;
  transportCostPerUnit: number;
};

export type ConvoyUnloadVaultSettlementResult = {
  netMargin: number;
  transportSpent: number;
  arcCoreShare: number;
  fleetRetained: number;
};

/**
 * 하역 정산 — trade_margin(순마진+운송비) 입금 → 운송비·arc share 출금.
 * fleet 순증 = 순마진 − arc share% (운송비는 별도 지출 항목으로 표시만 분리).
 */
export function applyConvoyUnloadVaultSettlement(
  input: ConvoyUnloadVaultSettlementInput,
): ConvoyUnloadVaultSettlementResult {
  const {
    bank,
    arcVault,
    tgId,
    shipId,
    destPlanetId,
    routeLabel,
    unloadQty,
    unitBuyPrice,
    unitSellPrice,
    transportCostPerUnit,
  } = input;

  const transportSpent = Math.max(0, Math.floor(input.transportCostTotal));
  const netMargin = applyAabsTradeIncomeMultiplier(Math.floor(input.netMarginBeforeAabs));
  const arcSharePct = getConvoyNetMarginArcCoreSharePct();
  const arcCoreShare =
    netMargin > 0 ? Math.max(0, Math.floor((netMargin * arcSharePct) / 100)) : 0;
  const fleetRetained = netMargin > 0 ? Math.max(0, netMargin - arcCoreShare) : netMargin;

  const baseNote = [
    routeLabel,
    `qty=${unloadQty}`,
    `buy@${unitBuyPrice}`,
    `sell@${unitSellPrice}`,
    `ship@${transportCostPerUnit}/u`,
  ].join(' ');

  if (netMargin > 0) {
    bank.appendInflow(transportSpent + netMargin, {
      kind: 'convoy_trade_margin',
      tgId,
      shipId,
      planetId: destPlanetId,
      note: `${baseNote} net=${netMargin}`,
    });

    if (transportSpent > 0) {
      bank.trySpend(transportSpent, {
        kind: 'convoy_transport',
        tgId,
        shipId,
        planetId: destPlanetId,
        note: formatConvoyTransportSpendNote(transportSpent),
      });
    }

    if (arcCoreShare > 0) {
      bank.trySpend(arcCoreShare, {
        kind: 'convoy_arc_core_share',
        tgId,
        shipId,
        planetId: destPlanetId,
        note: `${baseNote} arcShare=${arcCoreShare} (${arcSharePct}%)`,
      });
      arcVault.appendInflow(arcCoreShare, {
        kind: 'convoy_net_margin_share',
        tgId,
        shipId,
        planetId: destPlanetId,
        note: `${routeLabel} qty=${unloadQty} share=${arcSharePct}%`,
      });
    }

    bank.recordAudit('convoy_profit', {
      tgId,
      shipId,
      planetId: destPlanetId,
      note: [
        baseNote,
        `net=${netMargin}`,
        `transport=-${transportSpent}`,
        `arc=-${arcCoreShare}`,
        `fleet=+${fleetRetained}`,
      ].join(' '),
    });
  } else if (netMargin < 0) {
    bank.applyDelta(netMargin, {
      kind: 'convoy_loss',
      tgId,
      shipId,
      planetId: destPlanetId,
      note: `convoy_loss net=${netMargin}`,
    });
  }

  return { netMargin, transportSpent, arcCoreShare, fleetRetained };
}
