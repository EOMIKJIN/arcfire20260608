// ============================================================
// 무역 거래 수수료 — 행성 풀·팩션 금고(RED/BLUE) 분배
// ============================================================

import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { resolveTradeFeeFactionVault } from './resolveFactionVault';
import {
  computeConvoyTradeFeeBreakdown,
  computePlanetDailyUpkeepCredits,
  computePlanetTradeFeeBreakdown,
  resolvePlanetUpkeepPolicy,
  type PlanetTradeFeeBreakdown,
} from './planetUpkeepPolicy';
import { computePlanetDevelopmentUpkeepBreakdown } from './planetDevelopmentUpkeep';

export type TradeFeeSource = 'player' | 'convoy';

export function computeTradeFeeForGross(
  grossCredits: number,
  source: TradeFeeSource = 'player',
  planetId?: string,
): PlanetTradeFeeBreakdown {
  if (source === 'convoy') {
    const policy = resolvePlanetUpkeepPolicy();
    let dailyArc = 0;
    let dailyUpkeep = policy.upkeepFixedCreditsPerPlanet;
    if (planetId && usePlanetTradeFeeLedgerStore.getState().hydrated) {
      const bucket = usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId];
      dailyArc = bucket?.arcFeeCredits ?? 0;
      const dev = computePlanetDevelopmentUpkeepBreakdown(planetId).totalCredits;
      dailyUpkeep = computePlanetDailyUpkeepCredits(dev, policy, dailyArc);
    }
    return computeConvoyTradeFeeBreakdown(grossCredits, {
      dailyArcFeeCredits: dailyArc,
      dailyUpkeepCredits: dailyUpkeep,
    });
  }
  return computePlanetTradeFeeBreakdown(grossCredits);
}

function resolveFeeBreakdown(
  grossCredits: number,
  source: TradeFeeSource,
  planetId?: string,
): PlanetTradeFeeBreakdown {
  return computeTradeFeeForGross(grossCredits, source, planetId);
}

/** 거래 성공 후 호출 — ledger·팩션 금고에 수수료를 기록한다. */
export function applyPlanetTradeTransactionFee(
  planetId: string,
  grossCredits: number,
  source: TradeFeeSource = 'player',
): PlanetTradeFeeBreakdown {
  const breakdown = resolveFeeBreakdown(grossCredits, source, planetId);
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
