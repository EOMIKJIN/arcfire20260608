// ============================================================
// 무역 거래 수수료 — 행성 풀·팩션 금고(RED/BLUE) 분배
// ============================================================

import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { resolveTradeFeeFactionVault } from './resolveFactionVault';
import {
  computeConvoyTradeFeeBreakdown,
  computePlanetTradeFeeBreakdown,
  type PlanetTradeFeeBreakdown,
} from './planetUpkeepPolicy';

export type TradeFeeSource = 'player' | 'convoy';

export function computeTradeFeeForGross(
  grossCredits: number,
  source: TradeFeeSource = 'player',
): PlanetTradeFeeBreakdown {
  if (source === 'convoy') return computeConvoyTradeFeeBreakdown(grossCredits);
  return computePlanetTradeFeeBreakdown(grossCredits);
}

function resolveFeeBreakdown(grossCredits: number, source: TradeFeeSource): PlanetTradeFeeBreakdown {
  return computeTradeFeeForGross(grossCredits, source);
}

/** 거래 성공 후 호출 — ledger·팩션 금고에 수수료를 기록한다. */
export function applyPlanetTradeTransactionFee(
  planetId: string,
  grossCredits: number,
  source: TradeFeeSource = 'player',
): PlanetTradeFeeBreakdown {
  const breakdown = resolveFeeBreakdown(grossCredits, source);
  if (!planetId || breakdown.grossCredits <= 0) return breakdown;

  if (!usePlanetTradeFeeLedgerStore.getState().hydrated) {
    void usePlanetTradeFeeLedgerStore.getState().hydrate();
  }

  const factionVault = resolveTradeFeeFactionVault(planetId);
  void factionVault.hydrate();

  usePlanetTradeFeeLedgerStore
    .getState()
    .accumulate(
      planetId,
      breakdown.grossCredits,
      breakdown.playerPoolShare,
      breakdown.arcImmediateShare,
      source,
    );

  if (breakdown.arcImmediateShare > 0) {
    factionVault.appendInflow(breakdown.arcImmediateShare, {
      kind: source === 'convoy' ? 'trade_fee_convoy' : 'trade_fee',
      planetId,
      note: source === 'convoy' ? 'trade_fee_convoy' : 'trade_fee',
    });
  }

  return breakdown;
}

/** 구매 롤백 시 수수료 집계·금고 적립을 되돌린다(플레이어 무역). */
export function reversePlanetTradeTransactionFee(
  planetId: string,
  grossCredits: number,
): PlanetTradeFeeBreakdown {
  const breakdown = computePlanetTradeFeeBreakdown(grossCredits);
  if (!planetId || breakdown.grossCredits <= 0) return breakdown;

  usePlanetTradeFeeLedgerStore
    .getState()
    .reverseAccumulate(
      planetId,
      breakdown.grossCredits,
      breakdown.playerPoolShare,
      breakdown.arcImmediateShare,
      'player',
    );

  if (breakdown.arcImmediateShare > 0) {
    const factionVault = resolveTradeFeeFactionVault(planetId);
    factionVault.trySpend(breakdown.arcImmediateShare, {
      kind: 'trade_fee_reversal',
      planetId,
      note: 'trade_fee_reversal',
    });
  }

  return breakdown;
}
