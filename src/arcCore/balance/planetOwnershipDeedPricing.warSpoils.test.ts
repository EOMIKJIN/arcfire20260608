/**
 * 전쟁 스폴일 소유권 단가 오버레이 (순수 + generated CSV · Node/tsx 안전)
 * npx tsx src/arcCore/balance/planetOwnershipDeedPricing.warSpoils.test.ts
 */
import assert from 'node:assert/strict';
import { PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef } from '../../data/itemRegistry';
import { isPlanetContestedZone } from './balanceTableRegistry';
import { computeWarSpoilsOwnershipDeedPriceCredits } from './planetOwnershipWarSpoilsPrice';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

function policyKv(): Map<string, string> {
  return new Map(
    PlanetOwnershipDeedPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
  );
}

test('policy CSV: war spoils 10cr · test_planet_ids empty', () => {
  const kv = policyKv();
  assert.equal(kv.get('war_spoils_test_price_credits'), '10');
  assert.equal(kv.get('war_spoils_require_contested'), 'true');
  assert.equal(String(kv.get('test_planet_ids') ?? '').trim(), '');
});

test('static contested CSV planets (정적 3 + 동적 확장 게이트)', () => {
  assert.equal(isPlanetContestedZone('omega_hub'), true);
  assert.equal(isPlanetContestedZone('draco_haven'), true);
  assert.equal(isPlanetContestedZone('shadow_market'), true);
  assert.equal(isPlanetContestedZone('arcadia_prime'), false);
});

test('pure: neutralized+contested → 10; independent/no-marker/non-contested skip', () => {
  assert.equal(
    computeWarSpoilsOwnershipDeedPriceCredits({
      neutralizedAt: Date.now(),
      isIndependentNation: false,
      isContestedEligible: true,
      warSpoilsTestPriceCredits: 10,
      warSpoilsRequireContested: true,
    }),
    10,
  );
  assert.equal(
    computeWarSpoilsOwnershipDeedPriceCredits({
      neutralizedAt: Date.now(),
      isIndependentNation: true,
      isContestedEligible: true,
      warSpoilsTestPriceCredits: 10,
      warSpoilsRequireContested: true,
    }),
    null,
  );
  assert.equal(
    computeWarSpoilsOwnershipDeedPriceCredits({
      neutralizedAt: null,
      isIndependentNation: false,
      isContestedEligible: true,
      warSpoilsTestPriceCredits: 10,
      warSpoilsRequireContested: true,
    }),
    null,
  );
  assert.equal(
    computeWarSpoilsOwnershipDeedPriceCredits({
      neutralizedAt: Date.now(),
      isIndependentNation: false,
      isContestedEligible: false,
      warSpoilsTestPriceCredits: 10,
      warSpoilsRequireContested: true,
    }),
    null,
  );
});

test('arcadia_prime item_defs basePrice 12000 (1CR 테스트 해제)', () => {
  assert.equal(getItemDef('ownership_arcadia_prime')?.basePrice, 12000);
});

console.log('planetOwnershipDeedPricing.warSpoils.test.ts OK');
