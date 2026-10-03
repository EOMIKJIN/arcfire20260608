// ============================================================
// 일 1회 — 금고 5축 요약 원장 (txn 120 창과 별개 · 이력 45일)
// 월드 축 · 계정 purge 대상 아님 · 부트/틱 금지
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FactionVaultState, FactionVaultTxn } from '../../store/factionVault/createFactionVaultStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useNeutralNationVaultStore } from '../../store/factionVault/neutralNationVaultStore';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { usePlayerIndependentNationVaultStore } from '../../store/factionVault/playerIndependentNationVaultStore';

const STORAGE_KEY = 'arcfire_faction_vault_daily_summary_v1';
export const FACTION_VAULT_DAILY_SUMMARY_MAX_DAYS = 45;

export type FactionVaultDailyKey = 'red' | 'blue' | 'neutral' | 'fleet' | 'independent';

export type FactionVaultDailySnap = {
  balance: number;
  totalInflow: number;
  totalOutflow: number;
  /** 현재 txn 창(≤120) kind 합 — 일 전체가 아님 */
  windowKindSum: Record<string, number>;
};

export type FactionVaultDailyRow = {
  kstDayKey: string;
  recordedAtMs: number;
  vaults: Record<FactionVaultDailyKey, FactionVaultDailySnap>;
};

export function summarizeTxnWindowKindSums(txns: FactionVaultTxn[], topN = 6): Record<string, number> {
  const acc: Record<string, number> = {};
  for (let i = 0; i < txns.length; i += 1) {
    const t = txns[i]!;
    const kind = t.kind || 'unknown';
    acc[kind] = (acc[kind] ?? 0) + t.deltaCredits;
  }
  const keys = Object.keys(acc);
  keys.sort((a, b) => Math.abs(acc[b]!) - Math.abs(acc[a]!));
  const out: Record<string, number> = {};
  const limit = Math.min(topN, keys.length);
  for (let i = 0; i < limit; i += 1) {
    const k = keys[i]!;
    out[k] = acc[k]!;
  }
  return out;
}

export function mergeFactionVaultDailyRows(
  rows: FactionVaultDailyRow[],
  next: FactionVaultDailyRow,
  maxDays = FACTION_VAULT_DAILY_SUMMARY_MAX_DAYS,
): FactionVaultDailyRow[] {
  const without = rows.filter((r) => r.kstDayKey !== next.kstDayKey);
  return [next, ...without].slice(0, maxDays);
}

function snapFromVault(state: FactionVaultState): FactionVaultDailySnap {
  return {
    balance: state.getBalance(),
    totalInflow: state.totalInflowCredits,
    totalOutflow: state.totalOutflowCredits,
    windowKindSum: summarizeTxnWindowKindSums(state.txns),
  };
}

export async function recordFactionVaultDailySummary(kstDayKey: string): Promise<FactionVaultDailyRow | null> {
  const dayKey = String(kstDayKey ?? '').trim();
  if (!dayKey) return null;

  await Promise.all([
    useArcCoreVaultStore.getState().ensureHydrated(),
    useBlueTeamSharedVaultStore.getState().ensureHydrated(),
    useNeutralNationVaultStore.getState().ensureHydrated(),
    useArcCoreTransportFleetBankStore.getState().ensureHydrated(),
    usePlayerIndependentNationVaultStore.getState().ensureHydrated(),
  ]);

  const next: FactionVaultDailyRow = {
    kstDayKey: dayKey,
    recordedAtMs: Date.now(),
    vaults: {
      red: snapFromVault(useArcCoreVaultStore.getState()),
      blue: snapFromVault(useBlueTeamSharedVaultStore.getState()),
      neutral: snapFromVault(useNeutralNationVaultStore.getState()),
      fleet: snapFromVault(useArcCoreTransportFleetBankStore.getState()),
      independent: snapFromVault(usePlayerIndependentNationVaultStore.getState()),
    },
  };

  let rows: FactionVaultDailyRow[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { rows?: FactionVaultDailyRow[] };
      if (Array.isArray(parsed?.rows)) rows = parsed.rows;
    }
  } catch {
    rows = [];
  }

  const merged = mergeFactionVaultDailyRows(rows, next);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, rows: merged }));
  } catch {
    /* 메모리 밖 기록 실패 — 배치는 계속 */
  }
  if (__DEV__) {
    const v = next.vaults;
    console.log(
      `[ArcCore/VaultDaily] day=${dayKey} red=${v.red.balance} blue=${v.blue.balance} neutral=${v.neutral.balance} fleet=${v.fleet.balance} independent=${v.independent.balance}`,
    );
  }
  return next;
}
