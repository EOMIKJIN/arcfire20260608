// ============================================================
// 아크코어 판테온 도감 — 유물 해금 진행(계정 귀속)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'arcfire_arc_core_pantheon_codex_v1';

export type ArcCorePantheonUnlockEntry = {
  revealLevel: string;
  unlockedAtMs: number;
};

type ArcCorePantheonCodexState = {
  unlocked: Record<string, ArcCorePantheonUnlockEntry>;
  loaded: boolean;
  hydrate: () => Promise<void>;
  persistLocal: () => Promise<void>;
  isUnlocked: (godId: string) => boolean;
  listUnlocked: () => string[];
  /** 해금 — 좌당 계정 1회만 반영(재호출은 no-op, 재-persist 없음 — 틱 없는 저빈도 이벤트라 코얼레싱은 이 가드로 충분) */
  unlockGod: (godId: string, revealLevel: string) => void;
  resetForAccountPurge: () => Promise<void>;
};

export const useArcCorePantheonCodexStore = create<ArcCorePantheonCodexState>((set, get) => ({
  unlocked: {},
  loaded: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ unlocked: {}, loaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const out: Record<string, ArcCorePantheonUnlockEntry> = {};
      if (parsed && typeof parsed === 'object') {
        for (const [godId, entry] of Object.entries(parsed as Record<string, unknown>)) {
          if (!godId || typeof entry !== 'object' || entry === null) continue;
          const e = entry as Record<string, unknown>;
          const revealLevel = typeof e.revealLevel === 'string' ? e.revealLevel : 'role';
          const unlockedAtMs = typeof e.unlockedAtMs === 'number' ? e.unlockedAtMs : Date.now();
          out[godId] = { revealLevel, unlockedAtMs };
        }
      }
      set({ unlocked: out, loaded: true });
    } catch {
      set({ unlocked: {}, loaded: true });
    }
  },

  persistLocal: async () => {
    const { unlocked } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  },

  isUnlocked: (godId) => {
    const id = String(godId ?? '').trim();
    if (!id) return false;
    return Boolean(get().unlocked[id]);
  },

  listUnlocked: () => Object.keys(get().unlocked),

  unlockGod: (godId, revealLevel) => {
    const id = String(godId ?? '').trim();
    if (!id) return;
    const prev = get().unlocked;
    if (prev[id]) return;
    set({ unlocked: { ...prev, [id]: { revealLevel, unlockedAtMs: Date.now() } } });
    void get().persistLocal();
  },

  resetForAccountPurge: async () => {
    set({ unlocked: {}, loaded: true });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
