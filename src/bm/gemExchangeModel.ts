// ============================================================
// 보석→크레딧 교환 — 순수 검증 (Table-First · 부수효과 없음)
// ============================================================

import {
  getGemExchangeById,
  getGemExchangeBaseCrPerGem,
} from './bmCatalogIndex';

export type GemExchangePreflightCode =
  | 'ok'
  | 'product_not_found'
  | 'invalid_product'
  | 'insufficient_gems'
  | 'no_player';

export type GemExchangeQuote = {
  productId: string;
  gemCost: number;
  creditGrant: number;
  effectiveCrPerGem: number;
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
}): { ok: true; quote: GemExchangeQuote } | { ok: false; code: Exclude<GemExchangePreflightCode, 'ok'> } {
  const quote = resolveGemExchangeQuote(params.productId);
  if (!quote) {
    return { ok: false, code: 'product_not_found' };
  }
  if (params.gemBalance < quote.gemCost) {
    return { ok: false, code: 'insufficient_gems' };
  }
  return { ok: true, quote };
}

/** UI·감사용 — 기본환율 참조 */
export function getGemExchangeBaseRate(): number {
  return getGemExchangeBaseCrPerGem();
}
