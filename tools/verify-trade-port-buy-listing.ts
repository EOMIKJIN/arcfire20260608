/**
 * 무역소 구매 탭 진열 일관성 — 플레이어 Lv와 무관하게 행성 카탈로그와 동일해야 함.
 * npx tsx tools/verify-trade-port-buy-listing.ts
 */
import {
  filterTradePortCatalogForBuyMarket,
  resolveTradePortCatalogItemIds,
} from '../src/arcCore/balance/tradePortCatalogPolicy';
import { inferTradeBuySubTabFromGoodId } from '../src/game/tradeBuySubTab';

const SAMPLE_PLANETS = [
  'arcadia_prime',
  'solar_station',
  'minerva_deep',
  'eden_city',
] as const;

const SUB_TABS = ['weapon', 'equipment', 'ship', 'item'] as const;

let failed = false;

for (const planetId of SAMPLE_PLANETS) {
  const catalog = resolveTradePortCatalogItemIds(planetId);
  const listedLow = filterTradePortCatalogForBuyMarket(catalog, 1);
  const listedHigh = filterTradePortCatalogForBuyMarket(catalog, 99);

  if (listedLow.length !== listedHigh.length) {
    console.error(
      `[FAIL] ${planetId}: Lv1 진열 ${listedLow.length}종 ≠ Lv99 ${listedHigh.length}종 (플레이어 Lv 필터 잔존)`,
    );
    failed = true;
  }

  if (listedLow.length !== catalog.length) {
    console.error(
      `[FAIL] ${planetId}: 카탈로그 ${catalog.length}종 ≠ 구매탭 ${listedLow.length}종`,
    );
    failed = true;
  }

  for (const sub of SUB_TABS) {
    const inCatalog = catalog.filter((id) => inferTradeBuySubTabFromGoodId(id) === sub).length;
    const inListed = listedLow.filter((id) => inferTradeBuySubTabFromGoodId(id) === sub).length;
    if (inCatalog !== inListed) {
      console.error(
        `[FAIL] ${planetId} [${sub}]: 카탈로그 ${inCatalog} ≠ 구매탭 ${inListed}`,
      );
      failed = true;
    }
  }

  const eqCatalog = catalog.filter((id) => inferTradeBuySubTabFromGoodId(id) === 'equipment').length;
  console.log(`[OK] ${planetId}: total=${listedLow.length} equipment=${eqCatalog}`);
}

if (failed) {
  process.exit(1);
}
console.log('verify-trade-port-buy-listing: all checks passed');
