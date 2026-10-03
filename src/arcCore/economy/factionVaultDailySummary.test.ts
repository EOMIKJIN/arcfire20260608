import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FactionVaultTxn } from '../../store/factionVault/createFactionVaultStore';
import {
  FACTION_VAULT_DAILY_SUMMARY_MAX_DAYS,
  mergeFactionVaultDailyRows,
  summarizeTxnWindowKindSums,
  type FactionVaultDailyRow,
} from './factionVaultDailySummary';

function txn(kind: string, deltaCredits: number): FactionVaultTxn {
  return {
    id: `${kind}_${deltaCredits}`,
    kind,
    deltaCredits,
    balanceAfter: 0,
    createdAt: 1,
  };
}

function emptyRow(kstDayKey: string): FactionVaultDailyRow {
  const snap = { balance: 0, totalInflow: 0, totalOutflow: 0, windowKindSum: {} };
  return {
    kstDayKey,
    recordedAtMs: 1,
    vaults: {
      red: snap,
      blue: snap,
      neutral: snap,
      fleet: snap,
      independent: snap,
    },
  };
}

describe('factionVaultDailySummary', () => {
  it('keeps the largest-abs kinds and caps at topN', () => {
    const sums = summarizeTxnWindowKindSums(
      [
        txn('a', 10),
        txn('b', -40),
        txn('c', 5),
        txn('a', 3),
        txn('d', 1),
      ],
      2,
    );
    assert.deepEqual(sums, { b: -40, a: 13 });
  });

  it('replaces same day and caps history at 45', () => {
    const first = emptyRow('2026-10-01');
    const sameDay = { ...emptyRow('2026-10-01'), recordedAtMs: 9 };
    const mergedSame = mergeFactionVaultDailyRows([first], sameDay);
    assert.equal(mergedSame.length, 1);
    assert.equal(mergedSame[0]?.recordedAtMs, 9);

    const seed = Array.from({ length: 45 }, (_, i) => emptyRow(`d${i}`));
    const next = emptyRow('d-new');
    const merged = mergeFactionVaultDailyRows(seed, next);
    assert.equal(merged.length, FACTION_VAULT_DAILY_SUMMARY_MAX_DAYS);
    assert.equal(merged[0]?.kstDayKey, 'd-new');
  });
});
