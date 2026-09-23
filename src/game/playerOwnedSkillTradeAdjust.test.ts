import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SKILLS_FROM_CSV } from '../data/generated';
import {
  applyPlayerTaxCutToFeeBreakdown,
  applyPlayerTradeBuyUnitPrice,
  applyPlayerTradeSellUnitPrice,
  resolvePlayerTaxCutPct,
  resolvePlayerTradeBonusPct,
  rollContrabandDetection,
} from './playerOwnedSkillTradeAdjust';

test('trade_bonus and tax_cut CSV values match negotiation_pro / tax_exemption', () => {
  assert.equal(SKILLS_FROM_CSV.negotiation_pro?.effect?.stat, 'trade_bonus');
  assert.equal(Number(SKILLS_FROM_CSV.negotiation_pro?.effect?.value), 5);
  assert.equal(SKILLS_FROM_CSV.tax_exemption?.effect?.stat, 'tax_cut');
  assert.equal(Number(SKILLS_FROM_CSV.tax_exemption?.effect?.value), 10);
});

test('negotiation_pro lowers buy and raises sell by 5%', () => {
  const owned = ['negotiation_pro'] as const;
  assert.equal(resolvePlayerTradeBonusPct(owned), 5);
  assert.equal(applyPlayerTradeBuyUnitPrice(1000, owned), 950);
  assert.equal(applyPlayerTradeSellUnitPrice(1000, owned), 1050);
  assert.equal(applyPlayerTradeBuyUnitPrice(1000, []), 1000);
});

test('tax_exemption cuts player trade fee by 10%', () => {
  const owned = ['tax_exemption'] as const;
  assert.equal(resolvePlayerTaxCutPct(owned), 10);
  const next = applyPlayerTaxCutToFeeBreakdown(
    { grossCredits: 1000, totalFee: 100, playerPoolShare: 50, arcImmediateShare: 20 },
    owned,
  );
  assert.equal(next.totalFee, 90);
  assert.equal(next.playerPoolShare, 45);
  assert.equal(next.arcImmediateShare, 18);
  assert.equal(next.grossCredits, 1000);
});

test('monopoly_master cuts personal buy only', () => {
  const owned = ['monopoly_master'] as const;
  assert.equal(applyPlayerTradeBuyUnitPrice(1000, owned), 700);
  assert.equal(applyPlayerTradeSellUnitPrice(1000, owned), 1000);
});

test('bulk_trading adds margin at qty threshold', () => {
  const owned = ['bulk_trading'] as const;
  assert.equal(applyPlayerTradeSellUnitPrice(1000, owned, 10), 1100);
  assert.equal(applyPlayerTradeSellUnitPrice(1000, owned, 1), 1000);
});

test('black_market_boss zeros contraband fee', () => {
  const next = applyPlayerTaxCutToFeeBreakdown(
    { grossCredits: 1000, totalFee: 100, playerPoolShare: 50, arcImmediateShare: 20 },
    ['black_market_boss'],
    { contraband: true },
  );
  assert.equal(next.totalFee, 0);
});

test('smuggler_route halves detect chance vs base 20', () => {
  const caughtAlways = rollContrabandDetection('contraband', 'contraband', [], () => 0);
  assert.equal(caughtAlways.caught, true);
  const miss = rollContrabandDetection('contraband', 'contraband', ['smuggler_route'], () => 0.15);
  assert.equal(miss.caught, false);
  const food = rollContrabandDetection('food', 'food', [], () => 0);
  assert.equal(food.contraband, false);
});
