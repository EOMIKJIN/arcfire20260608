// ============================================================
// 아크코어 스파이 — 색출·expel 함장 id (계정 귀속)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'arcfire_arc_core_spy_expelled_v1';

type ArcCoreSpyExpelledState = {
  expelledCaptainIds: string[];
  loaded: boolean;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  isExpelled: (captainId: string) => boolean;
  markExpelled: (captainId: string) => void;
  resetLocal: () => Promise<void>;
};

export const useArcCoreSpyExpelledStore = create<ArcCoreSpyExpelledState>((set, get) => ({
  expelledCaptainIds: [],
  loaded: false,

  loadLocal: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ expelledCaptainIds: [], loaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const ids = Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        : [];
      set({ expelledCaptainIds: [...new Set(ids)], loaded: true });
    } catch {
      set({ expelledCaptainIds: [], loaded: true });
    }
  },

  persistLocal: async () => {
    const ids = get().expelledCaptainIds;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  },

  isExpelled: (captainId) => {
    const id = String(captainId ?? '').trim();
    if (!id) return false;
    return get().expelledCaptainIds.includes(id);
  },

  markExpelled: (captainId) => {
    const id = String(captainId ?? '').trim();
    if (!id) return;
    const prev = get().expelledCaptainIds;
    if (prev.includes(id)) return;
    set({ expelledCaptainIds: [...prev, id] });
  },

  resetLocal: async () => {
    set({ expelledCaptainIds: [], loaded: true });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
