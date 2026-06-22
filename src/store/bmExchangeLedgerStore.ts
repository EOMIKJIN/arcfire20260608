// ============================================================
// BM 보석→크레딧 교환 일·주 상한 ledger (계정 귀속)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { planetAttackKstDayKey } from '../arcCore/planetAttack/planetAttackKstDayKey';
import { getBmPolicyNumber } from '../bm/bmCatalogIndex';
import { buildExchangeCapSnapshot, type GemExchangeCapSnapshot } from '../bm/gemExchangeModel';

const STORAGE_KEY = 'arcfire_bm_exchange_ledger_v1';

type LedgerState = {
  hydrated: boolean;
  kstDayKey: string;
  kstWeekKey: string;
  dailyGemsExchanged: number;
  weeklyGemsExchanged: number;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  resetLocal: () => Promise<void>;
  ensurePeriod: (nowMs?: number) => void;
  getCapSnapshot: () => GemExchangeCapSnapshot;
  recordExchange: (gemCost: number, nowMs?: number) => void;
};

export function bmKstWeekKey(nowMs = Date.now()): string {
  const dayKey = planetAttackKstDayKey(nowMs);
  const [y, m, d] = dayKey.split('-').map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return dayKey.slice(0, 7);
  }
  const weekIndex = Math.floor((d - 1) / 7);
  return `${y}-${String(m).padStart(2, '0')}-W${weekIndex + 1}`;
}

function getWeeklyCapGems(): number {
  return getBmPolicyNumber('gem_exchange_weekly_cap_gems', 2000);
}

export const useBmExchangeLedgerStore = create<LedgerState>((set, get) => ({
  hydrated: false,
  kstDayKey: planetAttackKstDayKey(),
  kstWeekKey: bmKstWeekKey(),
  dailyGemsExchanged: 0,
  weeklyGemsExchanged: 0,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({
          hydrated: true,
          kstDayKey: planetAttackKstDayKey(),
          kstWeekKey: bmKstWeekKey(),
          dailyGemsExchanged: 0,
          weeklyGemsExchanged: 0,
        });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<LedgerState>;
      set({
        hydrated: true,
        kstDayKey: parsed.kstDayKey ?? planetAttackKstDayKey(),
        kstWeekKey: parsed.kstWeekKey ?? bmKstWeekKey(),
        dailyGemsExchanged: Math.max(0, Math.floor(Number(parsed.dailyGemsExchanged) || 0)),
        weeklyGemsExchanged: Math.max(0, Math.floor(Number(parsed.weeklyGemsExchanged) || 0)),
      });
      get().ensurePeriod();
    } catch {
      set({
        hydrated: true,
        kstDayKey: planetAttackKstDayKey(),
        kstWeekKey: bmKstWeekKey(),
        dailyGemsExchanged: 0,
        weeklyGemsExchanged: 0,
      });
    }
  },

  persist: async () => {
    const s = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        kstDayKey: s.kstDayKey,
        kstWeekKey: s.kstWeekKey,
        dailyGemsExchanged: s.dailyGemsExchanged,
        weeklyGemsExchanged: s.weeklyGemsExchanged,
      }),
    );
  },

  resetLocal: async () => {
    set({
      hydrated: true,
      kstDayKey: planetAttackKstDayKey(),
      kstWeekKey: bmKstWeekKey(),
      dailyGemsExchanged: 0,
      weeklyGemsExchanged: 0,
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  ensurePeriod: (nowMs = Date.now()) => {
    const dayKey = planetAttackKstDayKey(nowMs);
    const weekKey = bmKstWeekKey(nowMs);
    const s = get();
    let dailyGemsExchanged = s.dailyGemsExchanged;
    let weeklyGemsExchanged = s.weeklyGemsExchanged;
    let changed = false;
    if (s.kstDayKey !== dayKey) {
      dailyGemsExchanged = 0;
      changed = true;
    }
    if (s.kstWeekKey !== weekKey) {
      weeklyGemsExchanged = 0;
      changed = true;
    }
    if (!changed && s.kstDayKey === dayKey && s.kstWeekKey === weekKey) return;
    set({
      kstDayKey: dayKey,
      kstWeekKey: weekKey,
      dailyGemsExchanged,
      weeklyGemsExchanged,
    });
    void get().persist();
  },

  getCapSnapshot: () => {
    get().ensurePeriod();
    const s = get();
    return buildExchangeCapSnapshot(
      s.dailyGemsExchanged,
      s.weeklyGemsExchanged,
      getWeeklyCapGems(),
    );
  },

  recordExchange: (gemCost, nowMs = Date.now()) => {
    const cost = Math.max(0, Math.floor(gemCost));
    if (cost <= 0) return;
    get().ensurePeriod(nowMs);
    const s = get();
    set({
      dailyGemsExchanged: s.dailyGemsExchanged + cost,
      weeklyGemsExchanged: s.weeklyGemsExchanged + cost,
    });
    void get().persist();
  },
}));
