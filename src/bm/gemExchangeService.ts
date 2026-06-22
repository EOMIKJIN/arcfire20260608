// ============================================================
// 보석→크레딧 교환 실행 — playerStore + ledger 조율
// ============================================================

import { getBmPolicyNumber } from './bmCatalogIndex';
import {
  preflightGemExchange,
  type GemExchangePreflightCode,
} from './gemExchangeModel';
import { useBmExchangeLedgerStore } from '../store/bmExchangeLedgerStore';
import { usePlayerStore } from '../store/playerStore';

export type GemExchangeResult =
  | { ok: true; productId: string; gemCost: number; creditsGranted: number }
  | { ok: false; code: GemExchangePreflightCode };

export async function ensureBmExchangeLedgerReady(): Promise<void> {
  const ledger = useBmExchangeLedgerStore.getState();
  if (!ledger.hydrated) {
    await ledger.hydrate();
  }
  ledger.ensurePeriod();
}

export async function executeGemToCreditExchange(productId: string): Promise<GemExchangeResult> {
  await ensureBmExchangeLedgerReady();

  const player = usePlayerStore.getState().player;
  if (!player) {
    return { ok: false, code: 'no_player' };
  }

  const gemBalance = Math.max(0, Math.floor(player.gems ?? 0));
  const cap = useBmExchangeLedgerStore.getState().getCapSnapshot();
  const weeklyCapGems = getBmPolicyNumber('gem_exchange_weekly_cap_gems', 2000);

  const pf = preflightGemExchange({
    productId,
    gemBalance,
    cap,
    weeklyCapGems,
  });
  if (!pf.ok) {
    return { ok: false, code: pf.code };
  }

  const spent = usePlayerStore.getState().spendGems(pf.quote.gemCost);
  if (!spent) {
    return { ok: false, code: 'insufficient_gems' };
  }

  usePlayerStore.getState().grantExchangeCredits(pf.quote.creditGrant);
  useBmExchangeLedgerStore.getState().recordExchange(pf.quote.gemCost);
  await usePlayerStore.getState().persist();

  return {
    ok: true,
    productId,
    gemCost: pf.quote.gemCost,
    creditsGranted: pf.quote.creditGrant,
  };
}

export function mapGemExchangeErrorKey(code: GemExchangePreflightCode): string {
  switch (code) {
    case 'insufficient_gems':
      return 'bmShop.exchange.failInsufficientGems';
    case 'daily_cap_exceeded':
      return 'bmShop.exchange.failDailyCap';
    case 'weekly_cap_exceeded':
      return 'bmShop.exchange.failWeeklyCap';
    case 'product_not_found':
    case 'invalid_product':
      return 'bmShop.exchange.failUnknown';
    case 'no_player':
      return 'bmShop.exchange.failNoPlayer';
    default:
      return 'bmShop.exchange.failUnknown';
  }
}
