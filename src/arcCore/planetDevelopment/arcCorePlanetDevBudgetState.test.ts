import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePlanetDevBudgetRefundCredits } from './planetDevBudgetRefund';

describe('resolvePlanetDevBudgetRefundCredits', () => {
  it('refunds unused prepaid budget only on a new KST day', () => {
    assert.equal(
      resolvePlanetDevBudgetRefundCredits(
        { kstDayKey: '2026-10-02', budgetRemainingCr: 10_090_020, prepaidFromVault: true },
        '2026-10-03',
      ),
      10_090_020,
    );
  });

  it('does not refund same day, unprepaid leftover, or empty remaining', () => {
    assert.equal(
      resolvePlanetDevBudgetRefundCredits(
        { kstDayKey: '2026-10-03', budgetRemainingCr: 100, prepaidFromVault: true },
        '2026-10-03',
      ),
      0,
    );
    assert.equal(
      resolvePlanetDevBudgetRefundCredits(
        { kstDayKey: '2026-10-02', budgetRemainingCr: 100, prepaidFromVault: false },
        '2026-10-03',
      ),
      0,
    );
    assert.equal(
      resolvePlanetDevBudgetRefundCredits(
        { kstDayKey: '2026-10-02', budgetRemainingCr: 0, prepaidFromVault: true },
        '2026-10-03',
      ),
      0,
    );
  });
});
