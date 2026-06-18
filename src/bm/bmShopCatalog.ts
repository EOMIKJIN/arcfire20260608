// ============================================================
// BM 더미 상점 카탈로그 — v2.0 이중통화 (크레딧 / 보석)
//   premium: Type A/E — 현금 IAP (보석팩·스타터·시즌패스·VIP)
//   exchange: Type B — 보석 → 크레딧 단방향 교환 (현금 크레딧 구매 없음)
// 인앱 연동·결제는 추후. CSV 정본 연동 시 Table-First로 이전.
// ============================================================

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
}

/** Type A/E — Stage 1 Hub · 현금(IAP) */
const PREMIUM_PRODUCTS: readonly BmShopProduct[] = [
  {
    id: 'starter_pack',
    titleKey: 'bmShop.product.starter_pack.title',
    descKey: 'bmShop.product.starter_pack.desc',
    priceKey: 'bmShop.price.mock_499',
    priceKind: 'iap',
    badgeKey: 'bmShop.badge.starterOnce',
    visual: 'starterPack',
    tint: '#3D4A2A',
  },
  {
    id: 'gem_pack_small',
    titleKey: 'bmShop.product.gem_pack_small.title',
    descKey: 'bmShop.product.gem_pack_small.desc',
    priceKey: 'bmShop.price.mock_099',
    priceKind: 'iap',
    visual: 'gems',
    tint: '#1E3A5F',
  },
  {
    id: 'gem_pack_medium',
    titleKey: 'bmShop.product.gem_pack_medium.title',
    descKey: 'bmShop.product.gem_pack_medium.desc',
    priceKey: 'bmShop.price.mock_499',
    priceKind: 'iap',
    badgeKey: 'bmShop.badge.popular',
    visual: 'gems',
    tint: '#1A3352',
  },
  {
    id: 'gem_pack_large',
    titleKey: 'bmShop.product.gem_pack_large.title',
    descKey: 'bmShop.product.gem_pack_large.desc',
    priceKey: 'bmShop.price.mock_999',
    priceKind: 'iap',
    visual: 'gems',
    tint: '#152B48',
  },
  {
    id: 'gem_pack_xlarge',
    titleKey: 'bmShop.product.gem_pack_xlarge.title',
    descKey: 'bmShop.product.gem_pack_xlarge.desc',
    priceKey: 'bmShop.price.mock_4999',
    priceKind: 'iap',
    badgeKey: 'bmShop.badge.bestValue',
    visual: 'gems',
    tint: '#122440',
  },
  {
    id: 'season_pass_premium',
    titleKey: 'bmShop.product.season_pass_premium.title',
    descKey: 'bmShop.product.season_pass_premium.desc',
    priceKey: 'bmShop.price.mock_1499',
    priceKind: 'iap',
    badgeKey: 'bmShop.badge.limited',
    visual: 'seasonPass',
    tint: '#3D2A5C',
  },
  {
    id: 'vip_basic',
    titleKey: 'bmShop.product.vip_basic.title',
    descKey: 'bmShop.product.vip_basic.desc',
    priceKey: 'bmShop.price.mock_999',
    priceKind: 'iap',
    visual: 'vip',
    tint: '#2A3D52',
  },
  {
    id: 'vip_plus',
    titleKey: 'bmShop.product.vip_plus.title',
    descKey: 'bmShop.product.vip_plus.desc',
    priceKey: 'bmShop.price.mock_1999',
    priceKind: 'iap',
    visual: 'vip',
    tint: '#2A3552',
  },
  {
    id: 'vip_max',
    titleKey: 'bmShop.product.vip_max.title',
    descKey: 'bmShop.product.vip_max.desc',
    priceKey: 'bmShop.price.mock_2999',
    priceKind: 'iap',
    badgeKey: 'bmShop.badge.bestValue',
    visual: 'vip',
    tint: '#352A52',
  },
];

/** Type B — 보석 → 크레딧 교환 (단방향) */
const EXCHANGE_PRODUCTS: readonly BmShopProduct[] = [
  {
    id: 'ex_gems_50',
    titleKey: 'bmShop.product.ex_gems_50.title',
    descKey: 'bmShop.product.ex_gems_50.desc',
    priceKey: 'bmShop.price.gem_50',
    priceKind: 'gems',
    visual: 'exchange',
    tint: '#2A3D35',
  },
  {
    id: 'ex_gems_100',
    titleKey: 'bmShop.product.ex_gems_100.title',
    descKey: 'bmShop.product.ex_gems_100.desc',
    priceKey: 'bmShop.price.gem_100',
    priceKind: 'gems',
    badgeKey: 'bmShop.badge.popular',
    visual: 'exchange',
    tint: '#2A3540',
  },
  {
    id: 'ex_gems_300',
    titleKey: 'bmShop.product.ex_gems_300.title',
    descKey: 'bmShop.product.ex_gems_300.desc',
    priceKey: 'bmShop.price.gem_300',
    priceKind: 'gems',
    visual: 'exchange',
    tint: '#35302A',
  },
  {
    id: 'ex_gems_500',
    titleKey: 'bmShop.product.ex_gems_500.title',
    descKey: 'bmShop.product.ex_gems_500.desc',
    priceKey: 'bmShop.price.gem_500',
    priceKind: 'gems',
    badgeKey: 'bmShop.badge.bestValue',
    visual: 'exchange',
    tint: '#3A2A35',
  },
];

const BY_KIND: Record<BmShopKind, readonly BmShopProduct[]> = {
  premium: PREMIUM_PRODUCTS,
  exchange: EXCHANGE_PRODUCTS,
};

/** 더미 교환 비율 — CSV `gem_exchange_rate` 연동 전 목업 (100💎 = 50,000 Cr) */
export const BM_DUMMY_GEM_TO_CREDIT_RATE = 500;

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
