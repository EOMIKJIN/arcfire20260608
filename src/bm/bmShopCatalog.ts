// ============================================================
// BM 더미 상점 카탈로그 — v2.1 이중통화 (크레딧 / 보석)
//   premium: Type A/E — 현금 IAP (보석팩·스타터·시즌패스·VIP)
//   exchange: Type B — 보석 → 크레딧 단방향 교환 (현금 크레딧 구매 없음)
// Table-First: gem_*_catalog.csv · vip_tier_policy.csv
// ============================================================

import { VipTierPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import {
  getGemExchangeBaseCrPerGem,
  listGemExchangeCatalog,
  listGemPackCatalog,
} from './bmCatalogIndex';

/** @deprecated getGemExchangeBaseCrPerGem() 사용 */
export const BM_DUMMY_GEM_TO_CREDIT_RATE = getGemExchangeBaseCrPerGem();

/** premium = IAP 프리미엄 상점 · exchange = 보석→크레딧 교환 */
export type BmShopKind = 'premium' | 'exchange';

export type BmShopProductVisual =
  | 'gems'
  | 'seasonPass'
  | 'vip'
  | 'starterPack'
  | 'exchange';

export type BmShopPriceKind = 'iap' | 'gems';

export interface BmShopProduct {
  id: string;
  titleKey: string;
  descKey: string;
  priceKind: BmShopPriceKind;
  /** IAP 목업 가격(i18n) 또는 보석 소비량 표시(i18n) */
  priceKey: string;
  badgeKey?: string;
  visual: BmShopProductVisual;
  tint: string;
  /** 교환 상품 — 지급 크레딧(CSV) */
  exchangeCreditAmount?: number;
  /** 보석팩 — 실지급 보석(CSV grant) */
  gemGrantAmount?: number;
}

const GEM_PACK_TINTS: Record<string, string> = {
  starter_pack: '#3D4A2A',
  gem_pack_small: '#1E3A5F',
  gem_pack_medium: '#1A3352',
  gem_pack_large: '#152B48',
  gem_pack_xlarge: '#122440',
  season_pass_premium: '#3D2A5C',
};

const VIP_TINTS: Record<string, string> = {
  vip_basic: '#2A3D52',
  vip_plus: '#2A3552',
  vip_max: '#352A52',
};

const EXCHANGE_TINTS = ['#2A3D35', '#2A3540', '#35302A', '#3A2A35'];

function mapBadgeKey(raw: string | undefined): string | undefined {
  const key = raw?.trim();
  if (!key) return undefined;
  return `bmShop.badge.${key}`;
}

function buildPremiumProducts(): readonly BmShopProduct[] {
  const fromPacks: BmShopProduct[] = listGemPackCatalog().map((row) => ({
    id: row.productId,
    titleKey: `bmShop.product.${row.productId}.title`,
    descKey: `bmShop.product.${row.productId}.desc`,
    priceKey: `bmShop.price.${row.iapPriceKey}`,
    priceKind: 'iap' as const,
    badgeKey: mapBadgeKey(row.badgeKey),
    visual: row.visual as BmShopProductVisual,
    tint: GEM_PACK_TINTS[row.productId] ?? '#1E3A5F',
    gemGrantAmount: Number(row.gemAmount) > 0
      ? Math.floor(Number(row.gemAmount) * (100 + Number(row.bonusPct || 0)) / 100)
      : undefined,
  }));

  const fromVip: BmShopProduct[] = VipTierPolicy_FROM_BALANCE_CSV.map((row) => ({
    id: row.productId,
    titleKey: `bmShop.product.${row.productId}.title`,
    descKey: `bmShop.product.${row.productId}.desc`,
    priceKey: `bmShop.price.${row.iapPriceKey}`,
    priceKind: 'iap' as const,
    badgeKey: mapBadgeKey(row.badgeKey),
    visual: 'vip' as const,
    tint: VIP_TINTS[row.productId] ?? '#2A3D52',
  }));

  return [...fromPacks, ...fromVip];
}

function buildExchangeProducts(): readonly BmShopProduct[] {
  return listGemExchangeCatalog().map((row, index) => ({
    id: row.productId,
    titleKey: `bmShop.product.${row.productId}.title`,
    descKey: `bmShop.product.${row.productId}.desc`,
    priceKey: `bmShop.price.gem_${row.gemCost}`,
    priceKind: 'gems' as const,
    badgeKey: mapBadgeKey(row.badgeKey),
    visual: 'exchange' as const,
    tint: EXCHANGE_TINTS[index % EXCHANGE_TINTS.length] ?? '#2A3D35',
    exchangeCreditAmount: Number(row.creditAmount),
  }));
}

const PREMIUM_PRODUCTS = buildPremiumProducts();
const EXCHANGE_PRODUCTS = buildExchangeProducts();

const BY_KIND: Record<BmShopKind, readonly BmShopProduct[]> = {
  premium: PREMIUM_PRODUCTS,
  exchange: EXCHANGE_PRODUCTS,
};

export function listBmShopProducts(kind: BmShopKind): readonly BmShopProduct[] {
  return BY_KIND[kind];
}

export function resolveBmShopTitleKey(kind: BmShopKind): string {
  return kind === 'premium' ? 'bmShop.premium.title' : 'bmShop.exchange.title';
}

export function resolveBmShopSubtitleKey(kind: BmShopKind): string {
  return kind === 'premium' ? 'bmShop.premium.subtitle' : 'bmShop.exchange.subtitle';
}

export function resolveBmShopNoticeKey(kind: BmShopKind): string {
  return kind === 'premium' ? 'bmShop.noticeDummy' : 'bmShop.exchange.noticeOneWay';
}

export function resolveBmShopActionKey(kind: BmShopKind): string {
  return kind === 'premium' ? 'bmShop.btn.purchase' : 'bmShop.btn.exchange';
}

export { getGemExchangeBaseCrPerGem } from './bmCatalogIndex';
