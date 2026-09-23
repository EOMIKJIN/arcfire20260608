// ============================================================
// 행성 소유권 현금 증서권 — SKU는 gem_pack_catalog.planet_deed_grant
// ============================================================

export const PLANET_DEED_IAP_PRODUCT_ID = 'planet_deed_grant';
export const PLANET_DEED_PICKER_MAX_ROWS = 48;
export const PLANET_DEED_IAP_ACCOUNT_LIMIT = 1;

export function isPlanetDeedIapProductId(productId: string): boolean {
  return productId.trim() === PLANET_DEED_IAP_PRODUCT_ID;
}

export function getPlanetDeedIapAccountLimit(_productId = PLANET_DEED_IAP_PRODUCT_ID): number {
  return PLANET_DEED_IAP_ACCOUNT_LIMIT;
}
