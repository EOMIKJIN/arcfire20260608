// ============================================================
// 보석→크레딧 교환 실행 — 보유 보석만 확인. 일·주 상한 없음.
// ============================================================

import {
  preflightGemExchange,
  type GemExchangePreflightCode,
} from './gemExchangeModel';
import { usePlayerStore } from '../store/playerStore';

export type GemExchangeResult =
  | { ok: true; productId: string; gemCost: number; creditsGranted: number }
  | { ok: false; code: GemExchangePreflightCode };

export async function executeGemToCreditExchange(productId: string): Promise<GemExchangeResult> {
  const player = usePlayerStore.getState().player;
  if (!player) {
    return { ok: false, code: 'no_player' };
  }

  const gemBalance = Math.max(0, Math.floor(player.gems ?? 0));
  const pf = preflightGemExchange({
    productId,
    gemBalance,
  });
  if (!pf.ok) {
    return { ok: false, code: pf.code };
  }

  const spent = usePlayerStore.getState().spendGems(pf.quote.gemCost);
  if (!spent) {
    return { ok: false, code: 'insufficient_gems' };
  }

  usePlayerStore.getState().grantExchangeCredits(pf.quote.creditGrant);
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
    case 'product_not_found':
    case 'invalid_product':
      return 'bmShop.exchange.failUnknown';
    case 'no_player':
      return 'bmShop.exchange.failNoPlayer';
    default:
      return 'bmShop.exchange.failUnknown';
  }
}
