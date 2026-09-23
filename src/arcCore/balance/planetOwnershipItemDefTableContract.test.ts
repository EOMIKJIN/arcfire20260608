/**
 * 소유권 증서 개방 검사 — 미발견 확장은 경고 대상 아님
 * npx tsx --test src/arcCore/balance/planetOwnershipItemDefTableContract.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertPlanetOwnershipItemDefOnFrontierUnlock,
  isPlanetOwnershipItemDefRegistered,
  isPlanetOwnershipItemDefRequiredForFrontier,
} from './planetOwnershipItemDefTableContract';

test('레거시 개척 synth_073 — 증서 필수·item_defs 등록', () => {
  assert.equal(isPlanetOwnershipItemDefRequiredForFrontier('synth_073_p'), true);
  assert.equal(isPlanetOwnershipItemDefRegistered('synth_073_p'), true);
  assert.equal(assertPlanetOwnershipItemDefOnFrontierUnlock('synth_073_p'), true);
});

test('남·북 항로 수도 — 증서 필수·item_defs 등록', () => {
  assert.equal(isPlanetOwnershipItemDefRequiredForFrontier('synth_706_p'), true);
  assert.equal(isPlanetOwnershipItemDefRequiredForFrontier('synth_732_p'), true);
  assert.equal(isPlanetOwnershipItemDefRegistered('synth_706_p'), true);
  assert.equal(isPlanetOwnershipItemDefRegistered('synth_732_p'), true);
});

test('미발견 확장 synth_081 — colonization 없음, 계정 초기화 경고 대상 아님', () => {
  assert.equal(isPlanetOwnershipItemDefRequiredForFrontier('synth_081_p'), false);
  assert.equal(isPlanetOwnershipItemDefRegistered('synth_081_p'), false);
  assert.equal(assertPlanetOwnershipItemDefOnFrontierUnlock('synth_081_p'), true);
});

test('빈 planetId는 실패', () => {
  assert.equal(assertPlanetOwnershipItemDefOnFrontierUnlock(''), false);
});
