// ============================================================
// AABS 전역 보정 계수 — CSV 정본 수정 없이 런타임만 조정
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  AABS_MAX_CUMULATIVE_RATIO,
  AABS_MAX_STEP_RATIO,
  AABS_MULTIPLIER_KEYS,
  type AabsMultiplierKey,
} from './aabsConstants';
import { DynamicOverlay_FROM_BALANCE_CSV } from '../../data/balance/generated';

const STORAGE_KEY = 'arcfire_aabs_policy_v1';

export type AabsGlobalMultipliers = Record<AabsMultiplierKey, number>;

function defaultMultipliers(): AabsGlobalMultipliers {
  const base: AabsGlobalMultipliers = {
    expReward: 1,
    creditReward: 1,
    tradeIncome: 1,
    dropWeight: 1,
    miningYield: 1,
    combatDifficulty: 1,
  };
  for (const row of DynamicOverlay_FROM_BALANCE_CSV) {
    const key = row.key as AabsMultiplierKey;
    if (!AABS_MULTIPLIER_KEYS.includes(key)) continue;
    const mul = Number(row.multiplier);
    if (Number.isFinite(mul) && mul > 0) base[key] = mul;
  }
  return base;
}

function clampMultiplier(n: number): number {
  const lo = 1 - AABS_MAX_CUMULATIVE_RATIO;
  const hi = 1 + AABS_MAX_CUMULATIVE_RATIO;
  return Math.max(lo, Math.min(hi, n));
}

function clampStep(current: number, target: number): number {
  const delta = target - current;
  const capped = Math.max(-AABS_MAX_STEP_RATIO, Math.min(AABS_MAX_STEP_RATIO, delta));
  return clampMultiplier(current + capped);
}

interface AabsPolicyState {
  hydrated: boolean;
  safeModeEnabled: boolean;
  multipliers: AabsGlobalMultipliers;
  baseline: AabsGlobalMultipliers;
  lastAlignmentAt: number;
  lastAuditAt: number;
  criticalDriftFlags: string[];
  loadAsync: () => Promise<void>;
  persistAsync: () => Promise<void>;
  getEffectiveMultiplier: (key: AabsMultiplierKey) => number;
  applyStepToward: (key: AabsMultiplierKey, target: number) => void;
  setSafeMode: (enabled: boolean) => void;
  resetToBaseline: () => void;
  reloadFromOverlayTable: () => void;
  markAlignment: () => void;
  setCriticalDriftFlags: (flags: string[]) => void;
}

export const useAabsPolicyStore = create<AabsPolicyState>((set, get) => ({
  hydrated: false,
  safeModeEnabled: false,
  multipliers: defaultMultipliers(),
  baseline: defaultMultipliers(),
  lastAlignmentAt: 0,
  lastAuditAt: 0,
  criticalDriftFlags: [],

  loadAsync: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true, multipliers: defaultMultipliers(), baseline: defaultMultipliers() });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AabsPolicyState>;
      const base = defaultMultipliers();
      const mul = { ...base, ...(parsed.multipliers ?? {}) };
      for (const k of AABS_MULTIPLIER_KEYS) mul[k] = clampMultiplier(Number(mul[k]) || 1);
      set({
        hydrated: true,
        safeModeEnabled: Boolean(parsed.safeModeEnabled),
        multipliers: mul,
        baseline: { ...base },
        lastAlignmentAt: parsed.lastAlignmentAt ?? 0,
        lastAuditAt: parsed.lastAuditAt ?? 0,
        criticalDriftFlags: parsed.criticalDriftFlags ?? [],
      });
    } catch {
      set({ hydrated: true, multipliers: defaultMultipliers(), baseline: defaultMultipliers() });
    }
  },

  persistAsync: async () => {
    const s = get();
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          safeModeEnabled: s.safeModeEnabled,
          multipliers: s.multipliers,
          lastAlignmentAt: s.lastAlignmentAt,
          lastAuditAt: s.lastAuditAt,
          criticalDriftFlags: s.criticalDriftFlags,
        }),
      );
    } catch {
      /* ignore */
    }
  },

  getEffectiveMultiplier: (key) => {
    const s = get();
    if (s.safeModeEnabled) return 1;
    return s.multipliers[key] ?? 1;
  },

  applyStepToward: (key, target) => {
    if (get().safeModeEnabled) return;
    set((s) => ({
      multipliers: {
        ...s.multipliers,
        [key]: clampStep(s.multipliers[key] ?? 1, clampMultiplier(target)),
      },
    }));
  },

  setSafeMode: (enabled) => {
    set({ safeModeEnabled: enabled });
    if (enabled) get().resetToBaseline();
  },

  resetToBaseline: () => {
    set((s) => ({ multipliers: { ...s.baseline } }));
  },

  reloadFromOverlayTable: () => {
    const base = defaultMultipliers();
    set((s) => ({
      baseline: { ...base },
      multipliers: s.safeModeEnabled ? { ...base } : { ...base, ...s.multipliers },
    }));
  },

  markAlignment: () => set({ lastAlignmentAt: Date.now() }),

  setCriticalDriftFlags: (flags) => set({ criticalDriftFlags: flags }),
}));

export function applyAabsExpMultiplier(amount: number): number {
  return Math.max(0, Math.round(amount * useAabsPolicyStore.getState().getEffectiveMultiplier('expReward')));
}

export function applyAabsCreditMultiplier(amount: number): number {
  return Math.max(0, Math.round(amount * useAabsPolicyStore.getState().getEffectiveMultiplier('creditReward')));
}

export function applyAabsTradeIncomeMultiplier(amount: number): number {
  return Math.max(0, Math.round(amount * useAabsPolicyStore.getState().getEffectiveMultiplier('tradeIncome')));
}

export function applyAabsMiningYieldMultiplier(amount: number): number {
  return Math.max(0, amount * useAabsPolicyStore.getState().getEffectiveMultiplier('miningYield'));
}
