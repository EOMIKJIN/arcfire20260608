import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';

const STORAGE_KEY = 'arcfire_item_ledger_v1';

export type ItemTxnType =
  | 'mining_gain'
  | 'trade_buy'
  | 'trade_sell'
  | 'manual_adjust';

export interface ItemTxnRecord {
  id: string;
  uid: string;
  itemId: string;
  deltaQty: number;
  balanceAfter: number;
  txnType: ItemTxnType;
  unitPrice: number | null;
  totalPrice: number | null;
  systemId: string | null;
  planetId: string | null;
  note: string | null;
  createdAt: number;
}

export interface AccountItemLedger {
  uid: string;
  balances: Record<string, number>;
  txns: ItemTxnRecord[];
  updatedAt: number;
}

interface ItemLedgerState {
  ledgersByUid: Record<string, AccountItemLedger>;
  hydrated: boolean;
  loadLocalItemLedger: () => Promise<void>;
  persistItemLedger: () => Promise<void>;
  resetLocalItemLedger: () => Promise<void>;
  ensureAccountLedger: (uid: string) => void;
  purgeAccountLedger: (uid: string) => void;
  getItemBalance: (uid: string, itemId: string) => number;
  hasEverPurchasedItem: (uid: string, itemId: string) => boolean;
  applyBalanceDelta: (params: {
    uid: string;
    itemId: string;
    deltaQty: number;
    at?: number;
  }) => void;
  appendTxn: (params: {
    uid: string;
    itemId: string;
    deltaQty: number;
    txnType: ItemTxnType;
    unitPrice?: number | null;
    systemId?: string | null;
    planetId?: string | null;
    note?: string | null;
    at?: number;
  }) => void;
}

function createLedger(uid: string, now: number): AccountItemLedger {
  return {
    uid,
    balances: {},
    txns: [],
    updatedAt: now,
  };
}

function makeTxnId(now: number, uid: string, itemId: string, type: ItemTxnType): string {
  return `${now}:${uid}:${itemId}:${type}:${Math.floor(Math.random() * 1_000_000)}`;
}

const TXN_HISTORY_LIMIT = 400;

export const useItemLedgerStore = create<ItemLedgerState>((set, get) => ({
  ledgersByUid: {},
  hydrated: false,

  loadLocalItemLedger: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Pick<ItemLedgerState, 'ledgersByUid'>;
      if (!parsed || typeof parsed !== 'object') return;
      set({ ledgersByUid: parsed.ledgersByUid ?? {} });
    } finally {
      set({ hydrated: true });
    }
  },

  persistItemLedger: async () => {
    const { ledgersByUid } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ledgersByUid }));
    scheduleUserCloudSync();
  },

  resetLocalItemLedger: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ ledgersByUid: {}, hydrated: true });
  },

  ensureAccountLedger: (uid) => {
    if (!uid) return;
    const state = get();
    if (state.ledgersByUid[uid]) return;
    const now = Date.now();
    set({
      ledgersByUid: {
        ...state.ledgersByUid,
        [uid]: createLedger(uid, now),
      },
    });
  },
  purgeAccountLedger: (uid) => {
    if (!uid) return;
    const state = get();
    if (!state.ledgersByUid[uid]) return;
    const next = { ...state.ledgersByUid };
    delete next[uid];
    set({ ledgersByUid: next });
  },

  getItemBalance: (uid, itemId) => {
    const ledger = get().ledgersByUid[uid];
    return ledger?.balances[itemId] ?? 0;
  },
  hasEverPurchasedItem: (uid, itemId) => {
    const ledger = get().ledgersByUid[uid];
    if (!ledger) return false;
    return ledger.txns.some(
      (txn) => txn.itemId === itemId && txn.txnType === 'trade_buy' && txn.deltaQty > 0,
    );
  },

  applyBalanceDelta: ({ uid, itemId, deltaQty, at }) => {
    if (!uid || !itemId || !deltaQty) return;
    const now = at ?? Date.now();
    const state = get();
    const prevLedger = state.ledgersByUid[uid] ?? createLedger(uid, now);
    const prevBalance = prevLedger.balances[itemId] ?? 0;
    const nextBalance = Math.max(0, prevBalance + deltaQty);
    set({
      ledgersByUid: {
        ...state.ledgersByUid,
        [uid]: {
          ...prevLedger,
          balances: {
            ...prevLedger.balances,
            [itemId]: nextBalance,
          },
          updatedAt: now,
        },
      },
    });
  },

  appendTxn: ({
    uid,
    itemId,
    deltaQty,
    txnType,
    unitPrice = null,
    systemId = null,
    planetId = null,
    note = null,
    at,
  }) => {
    if (!uid || !itemId || !deltaQty) return;
    const now = at ?? Date.now();
    const state = get();
    const prevLedger = state.ledgersByUid[uid] ?? createLedger(uid, now);
    const prevBalance = prevLedger.balances[itemId] ?? 0;
    const nextBalance = Math.max(0, prevBalance + deltaQty);
    const totalPrice = unitPrice == null ? null : unitPrice * Math.abs(deltaQty);
    const shouldKeepTxnHistory = txnType !== 'mining_gain';
    const txns = shouldKeepTxnHistory ? [
      {
        id: makeTxnId(now, uid, itemId, txnType),
        uid,
        itemId,
        deltaQty,
        balanceAfter: nextBalance,
        txnType,
        unitPrice,
        totalPrice,
        systemId,
        planetId,
        note,
        createdAt: now,
      },
      ...prevLedger.txns,
    ].slice(0, TXN_HISTORY_LIMIT) : prevLedger.txns;

    set({
      ledgersByUid: {
        ...state.ledgersByUid,
        [uid]: {
          ...prevLedger,
          balances: {
            ...prevLedger.balances,
            [itemId]: nextBalance,
          },
          txns,
          updatedAt: now,
        },
      },
    });
  },
}));
