// ============================================================
// 보석→크레딧 교환 — 순수 검증 (Table-First · 부수효과 없음)
// ============================================================

import {
  getGemExchangeById,
  getGemExchangeDailyCapGems,
  getGemExchangeBaseCrPerGem,
} from './bmCatalogIndex';

export type GemExchangePreflightCode =
  | 'ok'
  | 'product_not_found'
  | 'invalid_product'
  | 'insufficient_gems'
  | 'daily_cap_exceeded'
  | 'weekly_cap_exceeded'
  | 'no_player';

export type GemExchangeQuote = {
  productId: string;
  gemCost: number;
  creditGrant: number;
  effectiveCrPerGem: number;
};

export type GemExchangeCapSnapshot = {
  dailyCapGems: number;
  weeklyCapGems: number;
  dailyUsedGems: number;
  weeklyUsedGems: number;
  dailyRemainingGems: number;
  weeklyRemainingGems: number;
};

export function resolveGemExchangeQuote(productId: string): GemExchangeQuote | null {
  const row = getGemExchangeById(productId);
  if (!row) return null;
  const gemCost = Math.max(0, Math.floor(Number(row.gemCost) || 0));
  const creditGrant = Math.max(0, Math.floor(Number(row.creditAmount) || 0));
  if (gemCost <= 0 || creditGrant <= 0) return null;
  return {
    productId,
    gemCost,
    creditGrant,
    effectiveCrPerGem: creditGrant / gemCost,
  };
}

export function preflightGemExchange(params: {
  productId: string;
  gemBalance: number;
  cap: GemExchangeCapSnapshot;
  weeklyCapGems: number;
}): { ok: true; quote: GemExchangeQuote } | { ok: false; code: Exclude<GemExchangePreflightCode, 'ok'> } {
  const quote = resolveGemExchangeQuote(params.productId);
  if (!quote) {
    return { ok: false, code: 'product_not_found' };
  }
  if (params.gemBalance < quote.gemCost) {
    return { ok: false, code: 'insufficient_gems' };
  }
  if (params.cap.dailyUsedGems + quote.gemCost > params.cap.dailyCapGems) {
    return { ok: false, code: 'daily_cap_exceeded' };
  }
  if (params.cap.weeklyUsedGems + quote.gemCost > params.weeklyCapGems) {
    return { ok: false, code: 'weekly_cap_exceeded' };
  }
  return { ok: true, quote };
}

export function buildExchangeCapSnapshot(
  dailyUsedGems: number,
  weeklyUsedGems: number,
  weeklyCapGems: number,
): GemExchangeCapSnapshot {
  const dailyCapGems = getGemExchangeDailyCapGems();
  const dailyUsed = Math.max(0, Math.floor(dailyUsedGems));
  const weeklyUsed = Math.max(0, Math.floor(weeklyUsedGems));
  return {
    dailyCapGems,
    weeklyCapGems: Math.max(0, Math.floor(weeklyCapGems)),
    dailyUsedGems: dailyUsed,
    weeklyUsedGems: weeklyUsed,
    dailyRemainingGems: Math.max(0, dailyCapGems - dailyUsed),
    weeklyRemainingGems: Math.max(0, weeklyCapGems - weeklyUsed),
  };
}

/** UI·감사용 — 기본환율 참조 */
export function getGemExchangeBaseRate(): number {
  return getGemExchangeBaseCrPerGem();
}
