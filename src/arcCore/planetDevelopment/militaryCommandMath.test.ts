import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyMilitaryCommandStatOffsetValues,
  applyMilitaryCommandUpkeepLineCreditsWithGlobal,
  resolveMilitaryCommandLogisticsDiscountPct,
  resolveMilitaryCommandStatOffsetsFromLevel,
} from './militaryCommandMath';

test('HQ logistics interpolates to 12% at L15 and stays HQ-line only', () => {
  assert.equal(resolveMilitaryCommandLogisticsDiscountPct(0), 0);
  assert.equal(resolveMilitaryCommandLogisticsDiscountPct(1), 0);
  assert.equal(resolveMilitaryCommandLogisticsDiscountPct(15), 12);
});

test('HQ upkeep joint cap leaves room for existing global 15%', () => {
  const raw = 148;
  const noGlobal = applyMilitaryCommandUpkeepLineCreditsWithGlobal(raw, 15, 0);
  assert.equal(noGlobal, Math.ceil(raw * 0.88));
  const withGlobal15 = applyMilitaryCommandUpkeepLineCreditsWithGlobal(raw, 15, 15);
  assert.equal(withGlobal15, Math.ceil(raw * 0.93));
});

test('HQ L15 offsets are D+2 T+1.5 R-1 P-1 E-1.2', () => {
  const off = resolveMilitaryCommandStatOffsetsFromLevel(15);
  assert.equal(off.defense, 2);
  assert.equal(off.technology, 1.5);
  assert.equal(off.resource, -1);
  assert.equal(off.population, -1);
  assert.equal(off.environment, -1.2);
});

test('HQ offsets respect genesis/floor 8 and do not rewrite 87% maxW', () => {
  const off = resolveMilitaryCommandStatOffsetsFromLevel(15);
  const next = applyMilitaryCommandStatOffsetValues(
    { resource: 87, population: 87, defense: 87, technology: 87, environment: 87 },
    { resource: 50, population: 50, defense: 50, technology: 50, environment: 50 },
    off,
  );
  assert.equal(next.defense, 89);
  assert.equal(next.technology, 89);
  assert.equal(next.resource, 86);
  assert.equal(next.population, 86);
  assert.equal(next.environment, 86);

  const floored = applyMilitaryCommandStatOffsetValues(
    { resource: 8, population: 8, defense: 8, technology: 8, environment: 8 },
    { resource: 5, population: 5, defense: 5, technology: 5, environment: 5 },
    off,
  );
  assert.equal(floored.resource, 8);
  assert.equal(floored.population, 8);
  assert.equal(floored.environment, 8);
});
