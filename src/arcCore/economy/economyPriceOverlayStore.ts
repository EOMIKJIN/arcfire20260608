// ============================================================
// 경제 카테고리별 가격 오버레이 — 일 1회 가상수요 시뮬 미세조정
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type EconomyCategoryKey =
  | 'weapon'
  | 'mineral'
  | 'food'
  | 'tech'
  | 'luxury'
  | 'contraband'
  | 'trade_route'
  | 'capital_ship';

export const ECONOMY_CATEGORY_KEYS: readonly EconomyCategoryKey[] = [
  'weapon',
  'mineral',
  'food',
  'tech',
  'luxury',
  'contraband',
  'trade_route',
  'capital_ship',
] as const;

export type EconomyPriceMultipliers = Record<EconomyCategoryKey, number>;

const STORAGE_KEY = 'arcfire_economy_price_overlay_v1';

function defaultMultipliers(): EconomyPriceMultipliers {
  return {
    weapon: 1,
    mineral: 1,
    food: 1,
    tech: 1,
    luxury: 1,
    contraband: 1,
    trade_route: 1,
    capital_ship: 1,
  };
}

interface EconomyPriceOverlayState {
  hydrated: boolean;
  multipliers: EconomyPriceMultipliers;
  baseline: EconomyPriceMultipliers;
  lastAdjustAt: number;
  lastSimVirtualPopulation: number;
  loadAsync: () => Promise<void>;
  persistAsync: () => Promise<void>;
  getCategoryMul: (key: EconomyCategoryKey) => number;
  applyCategoryStep: (key: EconomyCategoryKey, target: number, maxStepRatio: number, maxDriftRatio: number) => void;
  markAdjust: (virtualPopulation: number) => void;
}

function clampMul(n: number, maxDriftRatio: number): number {
  const lo = 1 - maxDriftRatio;
  const hi = 1 + maxDriftRatio;
  return Math.max(lo, Math.min(hi, n));
}

function stepToward(current: number, target: number, maxStepRatio: number, maxDriftRatio: number): number {
  const delta = target - current;
  const capped = Math.max(-maxStepRatio, Math.min(maxStepRatio, delta));
  return clampMul(current + capped, maxDriftRatio);
}

export const useEconomyPriceOverlayStore = create<EconomyPriceOverlayState>((set, get) => ({
  hydrated: false,
  multipliers: defaultMultipliers(),
  baseline: defaultMultipliers(),
  lastAdjustAt: 0,
  lastSimVirtualPopulation: 0,

  loadAsync: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<EconomyPriceOverlayState>;
      const base = defaultMultipliers();
      const merged = { ...base };
      for (const key of ECONOMY_CATEGORY_KEYS) {
        const v = parsed.multipliers?.[key];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) merged[key] = v;
      }
      set({
        hydrated: true,
        multipliers: merged,
        baseline: { ...base },
        lastAdjustAt: parsed.lastAdjustAt ?? 0,
        lastSimVirtualPopulation: parsed.lastSimVirtualPopulation ?? 0,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  persistAsync: async () => {
    const s = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        multipliers: s.multipliers,
        lastAdjustAt: s.lastAdjustAt,
        lastSimVirtualPopulation: s.lastSimVirtualPopulation,
      }),
    );
  },

  getCategoryMul: (key) => {
    const mul = get().multipliers[key];
    return Number.isFinite(mul) && mul > 0 ? mul : 1;
  },

  applyCategoryStep: (key, target, maxStepRatio, maxDriftRatio) => {
    const current = get().multipliers[key];
    const next = stepToward(current, target, maxStepRatio, maxDriftRatio);
    set({ multipliers: { ...get().multipliers, [key]: next } });
  },

  markAdjust: (virtualPopulation) => {
    set({ lastAdjustAt: Date.now(), lastSimVirtualPopulation: virtualPopulation });
  },
}));

/** zustand 외부(TradeEngine 등)에서 동기 조회 */
export function getEconomyCategoryPriceMul(key: EconomyCategoryKey): number {
  return useEconomyPriceOverlayStore.getState().getCategoryMul(key);
}

export function resolveItemCategoryPriceMul(category: string, itemType?: string): number {
  if (itemType === 'trade_route') return getEconomyCategoryPriceMul('trade_route');
  if (itemType === 'weapon_module') return getEconomyCategoryPriceMul('weapon');
  if (itemType === 'capital_ship') return getEconomyCategoryPriceMul('capital_ship');
  switch (category) {
    case 'food': return getEconomyCategoryPriceMul('food');
    case 'tech': return getEconomyCategoryPriceMul('tech');
    case 'luxury': return getEconomyCategoryPriceMul('luxury');
    case 'weapon': return getEconomyCategoryPriceMul('weapon');
    case 'contraband': return getEconomyCategoryPriceMul('contraband');
    case 'mineral': return getEconomyCategoryPriceMul('mineral');
    default: return 1;
  }
}
