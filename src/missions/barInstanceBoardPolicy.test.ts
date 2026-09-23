import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BAR_INSTANCE_MAX_LISTED_PER_PLANET,
  BAR_INSTANCE_MIN_LISTED_PER_PLANET,
  resolveBarInstanceCategorySlotsForLevel,
  resolveBarInstanceHarderTemplateCutRatio,
  resolveBarInstanceListedCap,
  shouldBiasHarderBarInstanceTemplates,
} from './barInstanceBoardPolicy';

test('listed cap stays 10 until L5 then steps to 16', () => {
  assert.equal(resolveBarInstanceListedCap(0), 10);
  assert.equal(resolveBarInstanceListedCap(1), 10);
  assert.equal(resolveBarInstanceListedCap(4), 10);
  assert.equal(resolveBarInstanceListedCap(5), 12);
  assert.equal(resolveBarInstanceListedCap(8), 12);
  assert.equal(resolveBarInstanceListedCap(9), 14);
  assert.equal(resolveBarInstanceListedCap(14), 14);
  assert.equal(resolveBarInstanceListedCap(15), 16);
  assert.equal(resolveBarInstanceListedCap(15), BAR_INSTANCE_MAX_LISTED_PER_PLANET);
  assert.equal(BAR_INSTANCE_MIN_LISTED_PER_PLANET, 10);
});

test('extra slots go to bounty and combat first', () => {
  const l1 = resolveBarInstanceCategorySlotsForLevel(1);
  assert.deepEqual(l1, { delivery: 4, combat: 2, bounty: 2, other: 2 });
  assert.equal(l1.delivery + l1.combat + l1.bounty + l1.other, 10);

  const l5 = resolveBarInstanceCategorySlotsForLevel(5);
  assert.deepEqual(l5, { delivery: 4, combat: 3, bounty: 3, other: 2 });
  assert.equal(l5.delivery + l5.combat + l5.bounty + l5.other, 12);

  const l9 = resolveBarInstanceCategorySlotsForLevel(9);
  assert.deepEqual(l9, { delivery: 5, combat: 3, bounty: 4, other: 2 });
  assert.equal(l9.delivery + l9.combat + l9.bounty + l9.other, 14);

  const l15 = resolveBarInstanceCategorySlotsForLevel(15);
  assert.deepEqual(l15, { delivery: 5, combat: 4, bounty: 5, other: 2 });
  assert.equal(l15.delivery + l15.combat + l15.bounty + l15.other, 16);
});

test('harder template bias starts at L5 combat/bounty', () => {
  assert.equal(shouldBiasHarderBarInstanceTemplates(1, 'bounty'), false);
  assert.equal(shouldBiasHarderBarInstanceTemplates(5, 'delivery'), false);
  assert.equal(shouldBiasHarderBarInstanceTemplates(5, 'bounty'), true);
  assert.equal(shouldBiasHarderBarInstanceTemplates(5, 'combat'), true);
  assert.equal(resolveBarInstanceHarderTemplateCutRatio(5), 0.55);
  assert.equal(resolveBarInstanceHarderTemplateCutRatio(9), 0.4);
});
