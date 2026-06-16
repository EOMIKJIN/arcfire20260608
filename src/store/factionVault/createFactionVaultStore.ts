// ============================================================
// 팩션·수송선단 금고 — 공통 AsyncStorage + applyDelta (마이너스 허용)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StoreApi, type UseBoundStore } from 'zustand';

export type FactionVaultTxn = {
  id: string;
  kind: string;
  deltaCredits: number;
  balanceAfter: number;
  tgId?: string;
  shipId?: string;
  planetId?: string;
  note?: string;
  createdAt: number;
};

export type FactionVaultState = {
  hydrated: boolean;
  balanceCredits: number;
  totalInflowCredits: number;
  totalOutflowCredits: number;
  txns: FactionVaultTxn[];
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  getBalance: () => number;
  applyDelta: (deltaCredits: number, meta?: Partial<FactionVaultTxn>) => void;
  trySpend: (amount: number, meta?: Partial<FactionVaultTxn>) => boolean;
  appendInflow: (amount: number, meta?: Partial<FactionVaultTxn>) => void;
};

type FactionVaultConfig = {
  storageKey: string;
  migrationStashKey?: string;
  seedCredits: () => number;
  seedNote: string;
  txnHistoryLimit: () => number;
  allowNegativeBalance: () => boolean;
};

function makeTxnId(now: number, kind: string): string {
  return `${now}_${kind}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 거래마다 즉시 직렬화·디스크 기록(garbage·I/O 폭주)을 막는 코얼레싱 지연(ms) */
const VAULT_PERSIST_COALESCE_MS = 1500;

export function createFactionVaultStore(
  config: FactionVaultConfig,
): UseBoundStore<StoreApi<FactionVaultState>> {
  // 인스턴스 단위 persist 코얼레싱 — 잔액은 메모리에서 즉시 정확, 디스크 기록만 묶는다.
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let flushPersist: (() => void) | null = null;
  const schedulePersist = () => {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      flushPersist?.();
    }, VAULT_PERSIST_COALESCE_MS);
  };

  return create<FactionVaultState>((set, get) => {
    flushPersist = () => {
      void get().persist();
    };
    return {
    hydrated: false,
    balanceCredits: 0,
    totalInflowCredits: 0,
    totalOutflowCredits: 0,
    txns: [],

    hydrate: async () => {
      try {
        let migrationDelta = 0;
        if (config.migrationStashKey) {
          const stash = await AsyncStorage.getItem(config.migrationStashKey);
          if (stash != null) {
            migrationDelta = Math.floor(Number(stash) || 0);
            await AsyncStorage.removeItem(config.migrationStashKey);
          }
        }

        const raw = await AsyncStorage.getItem(config.storageKey);
        if (!raw) {
          const seed = config.seedCredits() + migrationDelta;
          set({
            hydrated: true,
            balanceCredits: seed,
            totalInflowCredits: seed > 0 ? seed : 0,
            totalOutflowCredits: seed < 0 ? -seed : 0,
            txns:
              seed !== 0
                ? [
                    {
                      id: makeTxnId(Date.now(), 'seed'),
                      kind: 'seed',
                      deltaCredits: seed,
                      balanceAfter: seed,
                      note: config.seedNote,
                      createdAt: Date.now(),
                    },
                  ]
                : [],
          });
          await get().persist();
          return;
        }

        const parsed = JSON.parse(raw) as Partial<FactionVaultState>;
        set({
          hydrated: true,
          balanceCredits: Math.floor(Number(parsed.balanceCredits) || 0),
          totalInflowCredits: Math.max(0, Math.floor(Number(parsed.totalInflowCredits) || 0)),
          totalOutflowCredits: Math.max(0, Math.floor(Number(parsed.totalOutflowCredits) || 0)),
          txns: Array.isArray(parsed.txns) ? parsed.txns : [],
        });
        if (migrationDelta !== 0) {
          get().applyDelta(migrationDelta, { kind: 'migrate', note: 'legacy_temp_bank_split' });
        }
      } catch {
        const seed = config.seedCredits();
        set({
          hydrated: true,
          balanceCredits: seed,
          totalInflowCredits: seed > 0 ? seed : 0,
          totalOutflowCredits: 0,
          txns: [],
        });
      }
    },

    persist: async () => {
      const { balanceCredits, totalInflowCredits, totalOutflowCredits, txns } = get();
      await AsyncStorage.setItem(
        config.storageKey,
        JSON.stringify({ balanceCredits, totalInflowCredits, totalOutflowCredits, txns }),
      );
    },

    getBalance: () => get().balanceCredits,

    applyDelta: (deltaCredits, meta) => {
      const delta = Math.floor(deltaCredits);
      if (delta === 0) return;
      const state = get();
      const balanceAfter = state.balanceCredits + delta;
      if (delta < 0 && !config.allowNegativeBalance() && balanceAfter < 0) {
        return;
      }
      const kind = meta?.kind ?? (delta >= 0 ? 'inflow' : 'outflow');
      const txn: FactionVaultTxn = {
        id: makeTxnId(Date.now(), kind),
        kind,
        deltaCredits: delta,
        balanceAfter,
        createdAt: Date.now(),
        ...meta,
      };
      const limit = config.txnHistoryLimit();
      set({
        balanceCredits: balanceAfter,
        totalInflowCredits: state.totalInflowCredits + (delta > 0 ? delta : 0),
        totalOutflowCredits: state.totalOutflowCredits + (delta < 0 ? -delta : 0),
        txns: [txn, ...state.txns].slice(0, limit),
      });
      // 거래 1건마다 즉시 직렬화·기록 금지 — 코얼레싱(잔액은 메모리에서 이미 정확).
      schedulePersist();
    },

    trySpend: (amount, meta) => {
      const spend = Math.max(0, Math.floor(amount));
      if (spend <= 0) return true;
      const state = get();
      if (!config.allowNegativeBalance() && state.balanceCredits < spend) return false;
      get().applyDelta(-spend, meta);
      return true;
    },

    appendInflow: (amount, meta) => {
      const inflow = Math.max(0, Math.floor(amount));
      if (inflow <= 0) return;
      get().applyDelta(inflow, meta);
    },
    };
  });
}
