/**
 * 행성 소유권 현금 증서권 — Table-First 한도
 * npx tsx src/bm/planetDeedCashGrantPolicy.test.ts
 */
import assert from 'node:assert/strict';
import { getGemPackById } from './bmCatalogIndex';
import {
  getPlanetDeedIapAccountLimit,
  isPlanetDeedIapProductId,
  PLANET_DEED_IAP_PRODUCT_ID,
  PLANET_DEED_PICKER_MAX_ROWS,
} from './planetDeedCashGrantPolicy';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('IAP product is planet_deed_grant · accountLimit 1 · mock_4999', () => {
  assert.equal(PLANET_DEED_IAP_PRODUCT_ID, 'planet_deed_grant');
  assert.equal(isPlanetDeedIapProductId(PLANET_DEED_IAP_PRODUCT_ID), true);
  assert.equal(getPlanetDeedIapAccountLimit(), 1);
  assert.ok(PLANET_DEED_PICKER_MAX_ROWS <= 48);
  const row = getGemPackById(PLANET_DEED_IAP_PRODUCT_ID);
  assert.ok(row);
  assert.equal(row?.iapPriceKey, 'mock_4999');
});

console.log('planetDeedCashGrantPolicy.test.ts OK');
