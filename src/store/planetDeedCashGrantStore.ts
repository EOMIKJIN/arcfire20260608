// ============================================================
// 행성 소유권 현금 증서권 — 계정 귀속 1회 (플레이어 진행)
// persist는 구매·클레임·purge만. 틱/렌더 경로 금지.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export const PLANET_DEED_CASH_GRANT_STORAGE_KEY = 'arcfire_planet_deed_cash_grant_v1';

export type PlanetDeedCashGrantState = {
  hydrated: boolean;
  purchasedCount: number;
  pendingGrant: boolean;
  claimedPlanetId: string | null;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  resetLocal: () => Promise<void>;
  applyPurchase: () => void;
  applyClaim: (planetId: string) => void;
  syncExistingClaim: (planetId: string) => void;
};

function clampCount(raw: unknown): number {
  const n = Math.floor(Number(raw) || 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export const usePlanetDeedCashGrantStore = create<PlanetDeedCashGrantState>((set, get) => ({
  hydrated: false,
  purchasedCount: 0,
  pendingGrant: false,
  claimedPlanetId: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PLANET_DEED_CASH_GRANT_STORAGE_KEY);
      if (!raw) {
        set({
          hydrated: true,
          purchasedCount: 0,
          pendingGrant: false,
          claimedPlanetId: null,
        });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<PlanetDeedCashGrantState>;
      const claimed = typeof parsed.claimedPlanetId === 'string' && parsed.claimedPlanetId.trim()
        ? parsed.claimedPlanetId.trim()
        : null;
      set({
        hydrated: true,
        purchasedCount: clampCount(parsed.purchasedCount),
        pendingGrant: Boolean(parsed.pendingGrant) && !claimed,
        claimedPlanetId: claimed,
      });
    } catch {
      set({
        hydrated: true,
        purchasedCount: 0,
        pendingGrant: false,
        claimedPlanetId: null,
      });
    }
  },

  persist: async () => {
    const s = get();
    await AsyncStorage.setItem(
      PLANET_DEED_CASH_GRANT_STORAGE_KEY,
      JSON.stringify({
        purchasedCount: s.purchasedCount,
        pendingGrant: s.pendingGrant,
        claimedPlanetId: s.claimedPlanetId,
      }),
    );
  },

  resetLocal: async () => {
    set({
      hydrated: true,
      purchasedCount: 0,
      pendingGrant: false,
      claimedPlanetId: null,
    });
    await AsyncStorage.removeItem(PLANET_DEED_CASH_GRANT_STORAGE_KEY);
  },

  applyPurchase: () => {
    const s = get();
    if (s.claimedPlanetId || s.pendingGrant) return;
    set({
      purchasedCount: s.purchasedCount + 1,
      pendingGrant: true,
    });
    void get().persist();
  },

  applyClaim: (planetId: string) => {
    const id = planetId.trim();
    if (!id) return;
    set({
      pendingGrant: false,
      claimedPlanetId: id,
    });
    void get().persist();
  },

  syncExistingClaim: (planetId: string) => {
    const id = planetId.trim();
    if (!id) return;
    const s = get();
    if (s.claimedPlanetId === id && !s.pendingGrant) return;
    set({
      pendingGrant: false,
      claimedPlanetId: id,
      purchasedCount: Math.max(1, s.purchasedCount),
    });
    void get().persist();
  },
}));
