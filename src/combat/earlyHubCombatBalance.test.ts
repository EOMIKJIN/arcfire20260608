/**
 * 초반 허브 전투 권장안 — 드라코 동시 척수 · 분자장갑판1 구매 게이트
 * npx tsx src/combat/earlyHubCombatBalance.test.ts
 */
import assert from 'node:assert/strict';
import { resolvePlanetHostileShipCount } from '../arcCore/balance/balanceTableRegistry';
import { getItemDef } from '../data/itemRegistry';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('초반 허브 척수 — 아르카디아1 · 드라코2(접전 유지)', () => {
  assert.equal(resolvePlanetHostileShipCount('arcadia_prime'), 1);
  assert.equal(resolvePlanetHostileShipCount('draco_haven'), 2);
  assert.equal(resolvePlanetHostileShipCount('vega_base'), 2);
});

test('분자장갑판1 — Lv2·1800c · 미션002 직후 구매 게이트', () => {
  const def = getItemDef('eq_def_molecular_armor_1');
  assert.ok(def);
  assert.equal(def.basePrice, 1800);
  const req = def.attrs?.equipmentRequiredLevel;
  assert.equal(req, 2);
  assert.ok(typeof req === 'number' && req > 1, 'Lv1에서는 구매 불가');
  assert.ok(typeof req === 'number' && req <= 2, 'Lv2에서 구매 가능');
});

console.log('earlyHubCombatBalance.test.ts — all PASS');
