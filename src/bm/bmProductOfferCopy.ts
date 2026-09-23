// ============================================================
// BM 상품 구성·포함 관계 — 중첩 구매 안내 (Table-First)
// 정본: tables/balance/bm_product_contents.csv · bm_product_inclusion.csv
// ============================================================

import {
  BmProductContents_FROM_BALANCE_CSV,
  BmProductInclusion_FROM_BALANCE_CSV,
  VipTierPolicy_FROM_BALANCE_CSV,
} from '../data/balance/generated';
import { resolveGemPackGrant } from './bmCatalogIndex';

export type BmTranslate = (key: string, params?: Record<string, string | number>) => string;

let contentsByProduct: Map<string, string[]> | null = null;
let includesByProduct: Map<string, string[]> | null = null;
let includedInByProduct: Map<string, string[]> | null = null;
let vipDailyByProduct: Map<string, { dailyGemGrant: number; durationDays: number }> | null = null;

function parseSort(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function getContentsIndex(): Map<string, string[]> {
  if (contentsByProduct) return contentsByProduct;
  const grouped = new Map<string, { key: string; sort: number }[]>();
  for (const row of BmProductContents_FROM_BALANCE_CSV) {
    const productId = String(row.productId ?? '').trim();
    const contentKey = String(row.contentKey ?? '').trim();
    if (!productId || !contentKey) continue;
    const list = grouped.get(productId) ?? [];
    list.push({ key: contentKey, sort: parseSort(row.sortOrder) });
    grouped.set(productId, list);
  }
  const out = new Map<string, string[]>();
  for (const [productId, rows] of grouped) {
    rows.sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));
    out.set(productId, rows.map((r) => r.key));
  }
  contentsByProduct = out;
  return out;
}

function getInclusionIndexes(): {
  includes: Map<string, string[]>;
  includedIn: Map<string, string[]>;
} {
  if (includesByProduct && includedInByProduct) {
    return { includes: includesByProduct, includedIn: includedInByProduct };
  }
  const includes = new Map<string, { id: string; sort: number }[]>();
  const includedIn = new Map<string, { id: string; sort: number }[]>();
  for (const row of BmProductInclusion_FROM_BALANCE_CSV) {
    const productId = String(row.productId ?? '').trim();
    const includesProductId = String(row.includesProductId ?? '').trim();
    if (!productId || !includesProductId) continue;
    const sort = parseSort(row.sortOrder);
    const up = includes.get(productId) ?? [];
    up.push({ id: includesProductId, sort });
    includes.set(productId, up);
    const down = includedIn.get(includesProductId) ?? [];
    down.push({ id: productId, sort });
    includedIn.set(includesProductId, down);
  }
  const toIds = (src: Map<string, { id: string; sort: number }[]>) => {
    const out = new Map<string, string[]>();
    for (const [id, rows] of src) {
      rows.sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
      out.set(id, rows.map((r) => r.id));
    }
    return out;
  };
  includesByProduct = toIds(includes);
  includedInByProduct = toIds(includedIn);
  return { includes: includesByProduct, includedIn: includedInByProduct };
}

function getVipDailyIndex(): Map<string, { dailyGemGrant: number; durationDays: number }> {
  if (vipDailyByProduct) return vipDailyByProduct;
  const map = new Map<string, { dailyGemGrant: number; durationDays: number }>();
  for (const row of VipTierPolicy_FROM_BALANCE_CSV) {
    const productId = String(row.productId ?? '').trim();
    if (!productId) continue;
    map.set(productId, {
      dailyGemGrant: Math.max(0, Math.floor(Number(row.dailyGemGrant) || 0)),
      durationDays: Math.max(1, Math.floor(Number(row.durationDays) || 30)),
    });
  }
  vipDailyByProduct = map;
  return map;
}

export function listBmProductContentKeys(productId: string): readonly string[] {
  return getContentsIndex().get(productId) ?? [];
}

export function listBmProductIncludedIds(productId: string): readonly string[] {
  return getInclusionIndexes().includes.get(productId) ?? [];
}

export function listBmProductIncludedInIds(productId: string): readonly string[] {
  return getInclusionIndexes().includedIn.get(productId) ?? [];
}

function joinPackTitles(productIds: readonly string[], translate: BmTranslate): string {
  return productIds
    .map((id) => translate(`bmShop.product.${id}.title`))
    .filter((title) => title && !title.startsWith('bmShop.product.'))
    .join(' · ');
}

function resolveContentLine(
  productId: string,
  contentKey: string,
  translate: BmTranslate,
): string {
  if (contentKey === 'daily_gems') {
    const vip = getVipDailyIndex().get(productId);
    return translate('bmShop.content.daily_gems', {
      amount: vip?.dailyGemGrant ?? 0,
      days: vip?.durationDays ?? 30,
    });
  }
  if (contentKey === 'vip_duration') {
    const vip = getVipDailyIndex().get(productId);
    return translate('bmShop.content.vip_duration', { days: vip?.durationDays ?? 30 });
  }
  if (contentKey === 'gem_grant') {
    return translate('bmShop.content.gem_grant', { amount: resolveGemPackGrant(productId) });
  }
  return translate(`bmShop.content.${contentKey}`);
}

export function listBmProductContentLines(
  productId: string,
  translate: BmTranslate,
): string[] {
  return listBmProductContentKeys(productId)
    .map((key) => resolveContentLine(productId, key, translate))
    .filter((line) => line && !line.startsWith('bmShop.content.'));
}

export function resolveBmProductOverlapNotes(
  productId: string,
  translate: BmTranslate,
): string[] {
  const notes: string[] = [];
  const included = listBmProductIncludedIds(productId);
  if (included.length > 0) {
    notes.push(translate('bmShop.overlap.includesAll', { packs: joinPackTitles(included, translate) }));
  }
  const parents = listBmProductIncludedInIds(productId);
  if (parents.length > 0) {
    notes.push(translate('bmShop.overlap.includedIn', { packs: joinPackTitles(parents, translate) }));
  }
  return notes;
}

export function buildBmProductPurchaseExplainBody(
  productId: string,
  translate: BmTranslate,
  footer: string,
): string {
  const lines: string[] = [translate('bmShop.purchase.contentsTitle')];
  const contents = listBmProductContentLines(productId, translate);
  if (contents.length === 0) {
    lines.push(translate('bmShop.purchase.contentsEmpty'));
  } else {
    for (const line of contents) lines.push(`· ${line}`);
  }
  const overlap = resolveBmProductOverlapNotes(productId, translate);
  if (overlap.length > 0) {
    lines.push('');
    for (const note of overlap) lines.push(note);
  }
  if (footer) {
    lines.push('');
    lines.push(footer);
  }
  return lines.join('\n');
}
