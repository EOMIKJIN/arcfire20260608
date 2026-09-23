/**
 * npx tsx --test src/arcCore/economy/sovereignLoanIntent.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  restateSovereignLoanDebt,
  listSovereignLoanBookRows,
} from './sovereignLoanDebtInventory';
import {
  resolveSovereignLoanIntentPolicy,
  resetSovereignLoanIntentPolicyCacheForTest,
  sovereignLoanRuntimeEnginesAreLockedOff,
  SOVEREIGN_LOAN_LENDER_VAULT_FUTURE,
  SOVEREIGN_LOAN_LENDER_VAULT_TRANSITIONAL,
} from './sovereignLoanIntentPolicy';

test('의도 잠금 — 이자·조달중단·점령청산·신규 persist 전부 꺼짐', () => {
  resetSovereignLoanIntentPolicyCacheForTest();
  const p = resolveSovereignLoanIntentPolicy();
  assert.equal(p.intentLock, true);
  assert.equal(p.runtimeInterestEnabled, false);
  assert.equal(p.runtimeProcurementHaltEnabled, false);
  assert.equal(p.runtimeOccupationSettlementEnabled, false);
  assert.equal(p.newPersistKeyAllowed, false);
  assert.equal(p.interestRatePctLocked, false);
  assert.equal(p.repayClock, 'daily_batch_only');
  assert.equal(p.lenderVaultKeyFuture, SOVEREIGN_LOAN_LENDER_VAULT_FUTURE);
  assert.equal(p.lenderVaultKeyTransitional, SOVEREIGN_LOAN_LENDER_VAULT_TRANSITIONAL);
  assert.equal(p.interestIncomeTo, 'military_industry');
  assert.equal(p.interestAccrualBase, 'outstanding_principal');
  assert.equal(p.defaultConsequence, 'halt_military_procurement');
  assert.deepEqual(p.occupationUnwindPath, ['return_hold', 'neutralize', 'settle_loan_cost']);
  assert.equal(p.playerWalletIsNotSovereignLoan, true);
  assert.equal(p.transportVaultIsNotLender, true);
  assert.equal(sovereignLoanRuntimeEnginesAreLockedOff(p), true);
});

test('재산정 — 실부채는 스텔리움 개척 원금만 · 유지비·오펙스·시드는 비부채', () => {
  resetSovereignLoanIntentPolicyCacheForTest();
  const restated = restateSovereignLoanDebt({ stelliumColonizeLoanCredits: 8400 });
  assert.equal(restated.livePrincipalTotal, 8400);
  assert.equal(restated.liveBooks.length, 1);
  assert.equal(restated.liveBooks[0]?.bookId, 'stellium_colonize_ops');
  assert.equal(restated.liveBooks[0]?.lenderNow, 'arccore_vault');
  assert.equal(restated.liveBooks[0]?.lenderFuture, 'military_industry_vault');
  assert.equal(restated.reservedBooks.length, 3);
  const excludedIds = restated.excludedFromDebt.map((r) => r.bookId);
  assert.ok(excludedIds.includes('planet_upkeep_800'));
  assert.ok(excludedIds.includes('fiscal_opex_proxy'));
  assert.ok(excludedIds.includes('central_bank_expenditure'));
  assert.ok(excludedIds.includes('transport_fleet_cash'));
  assert.ok(excludedIds.includes('vault_seed_equity'));
  assert.ok(excludedIds.includes('player_sat_l1_wallet'));
  assert.ok(excludedIds.includes('colonize_cash_spend'));
  assert.equal(restated.runtimeEnginesLockedOff, true);
});

test('장부 CSV — 국가 4차주 · 실장부 1 · 예약 3', () => {
  const rows = listSovereignLoanBookRows();
  const live = rows.filter((r) => r.classifiedAs === 'sovereign_loan' && r.liveNow);
  const reserved = rows.filter((r) => r.classifiedAs === 'sovereign_loan_reserved');
  assert.equal(live.length, 1);
  assert.equal(reserved.length, 3);
  assert.deepEqual(
    reserved.map((r) => r.borrowerNation).sort(),
    ['arccore', 'independent', 'neutral'],
  );
});
