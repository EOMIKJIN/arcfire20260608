// ============================================================
// 아크코어 임시은행 — 수송선단 교역 수익 누적
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { getTradeRouteTempBankSeedCredits, getTradeRouteTxnHistoryLimit } from '../arcCore/balance/balanceTableRegistry';

const STORAGE_KEY = 'arcfire_arc_core_temp_bank_v1';

export type ArcCoreTempBankTxn = {
  id: string;
  kind: 'convoy_profit' | 'convoy_buy' | 'seed' | 'adjust';
  deltaCredits: number;
  balanceAfter: number;
  tgId?: string;
  shipId?: string;
  planetId?: string;
  note?: string;
  createdAt: number;
};

type ArcCoreTempBankState = {
  hydrated: boolean;
  balanceCredits: number;
  totalProfitCredits: number;
  txns: ArcCoreTempBankTxn[];
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  trySpend: (amount: number, meta?: Partial<ArcCoreTempBankTxn>) => boolean;
  appendProfit: (amount: number, meta?: Partial<ArcCoreTempBankTxn>) => void;
  recordBuy: (amount: number, meta?: Partial<ArcCoreTempBankTxn>) => void;
};

function makeTxnId(now: number, kind: string): string {
  return `${now}_${kind}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useArcCoreTempBankStore = create<ArcCoreTempBankState>((set, get) => ({
  hydrated: false,
  balanceCredits: 0,
  totalProfitCredits: 0,
  txns: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = getTradeRouteTempBankSeedCredits();
        set({
          hydrated: true,
          balanceCredits: seed,
          totalProfitCredits: 0,
          txns: [
            {
              id: makeTxnId(Date.now(), 'seed'),
              kind: 'seed',
              deltaCredits: seed,
              balanceAfter: seed,
              note: '아크코어 임시은행 시드',
              createdAt: Date.now(),
            },
          ],
        });
        await get().persist();
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ArcCoreTempBankState>;
      set({
        hydrated: true,
        balanceCredits: Math.max(0, Math.floor(Number(parsed.balanceCredits) || 0)),
        totalProfitCredits: Math.max(0, Math.floor(Number(parsed.totalProfitCredits) || 0)),
        txns: Array.isArray(parsed.txns) ? parsed.txns : [],
      });
    } catch {
      const seed = getTradeRouteTempBankSeedCredits();
      set({
        hydrated: true,
        balanceCredits: seed,
        totalProfitCredits: 0,
        txns: [],
      });
    }
  },

  persist: async () => {
    const { balanceCredits, totalProfitCredits, txns } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ balanceCredits, totalProfitCredits, txns }),
    );
  },

  trySpend: (amount, meta) => {
    const spend = Math.max(0, Math.floor(amount));
    if (spend <= 0) return true;
    const state = get();
    if (state.balanceCredits < spend) return false;
    const balanceAfter = state.balanceCredits - spend;
    const txn: ArcCoreTempBankTxn = {
      id: makeTxnId(Date.now(), 'buy'),
      kind: 'convoy_buy',
      deltaCredits: -spend,
      balanceAfter,
      createdAt: Date.now(),
      ...meta,
    };
    const limit = getTradeRouteTxnHistoryLimit();
    set({
      balanceCredits: balanceAfter,
      txns: [txn, ...state.txns].slice(0, limit),
    });
    void get().persist();
    return true;
  },

  appendProfit: (amount, meta) => {
    const profit = Math.max(0, Math.floor(amount));
    if (profit <= 0) return;
    const state = get();
    const balanceAfter = state.balanceCredits + profit;
    const txn: ArcCoreTempBankTxn = {
      id: makeTxnId(Date.now(), 'profit'),
      kind: 'convoy_profit',
      deltaCredits: profit,
      balanceAfter,
      createdAt: Date.now(),
      ...meta,
    };
    const limit = getTradeRouteTxnHistoryLimit();
    set({
      balanceCredits: balanceAfter,
      totalProfitCredits: state.totalProfitCredits + profit,
      txns: [txn, ...state.txns].slice(0, limit),
    });
    void get().persist();
  },

  recordBuy: (amount, meta) => {
    get().trySpend(amount, meta);
  },
}));
