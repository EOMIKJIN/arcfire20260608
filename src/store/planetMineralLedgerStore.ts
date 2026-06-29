// ============================================================
// 행성 광물 레저 — 로컬 매장 잔량·일 1회 ArcCore 재생
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  resolvePlanetMineralLedgerPolicy,
  resolvePlanetMineralReserveMaxUnits,
} from '../arcCore/planetResource/planetMineralLedgerPolicy';
import { usePlanetCoreRuntimeStore } from './planetCoreRuntimeStore';

const STORAGE_KEY = 'arcfire_planet_mineral_ledger_v1';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistDirty = false;

type PlanetMineralLedgerRow = {
  reserveUnits: number;
  maxUnits: number;
  updatedAt: number;
};

interface PlanetMineralLedgerState {
  loaded: boolean;
  byPlanetId: Record<string, PlanetMineralLedgerRow>;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  resetLocal: () => Promise<void>;
  getReserveUnits: (planetId: string, runtimeResource?: number) => number;
  getMaxUnits: (planetId: string, runtimeResource?: number) => number;
  consumeReserve: (planetId: string, quantity: number, runtimeResource?: number) => number;
  applyDailyRegenForPlanet: (planetId: string, runtimeResource: number) => void;
  bootstrapPlanetIfMissing: (planetId: string, runtimeResource: number) => void;
}

function schedulePersist(getState: () => PlanetMineralLedgerState): void {
  const policy = resolvePlanetMineralLedgerPolicy();
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void getState().persistLocal();
  }, policy.persistCoalesceMs);
}

function readRuntimeResource(planetId: string, override?: number): number {
  if (override != null && Number.isFinite(override)) return override;
  return usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.resource ?? 50;
}

export const usePlanetMineralLedgerStore = create<PlanetMineralLedgerState>((set, get) => ({
  loaded: false,
  byPlanetId: {},

  loadLocal: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ loaded: true, byPlanetId: {} });
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, PlanetMineralLedgerRow>;
      set({ loaded: true, byPlanetId: parsed ?? {} });
    } catch {
      set({ loaded: true, byPlanetId: {} });
    }
  },

  persistLocal: async () => {
    if (!persistDirty) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().byPlanetId));
      persistDirty = false;
    } catch {
      /* ignore */
    }
  },

  resetLocal: async () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    persistDirty = false;
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ loaded: true, byPlanetId: {} });
  },

  bootstrapPlanetIfMissing: (planetId, runtimeResource) => {
    if (!planetId || !get().loaded) return;
    const prev = get().byPlanetId[planetId];
    const maxUnits = resolvePlanetMineralReserveMaxUnits(runtimeResource);
    if (prev) return;
    const next = {
      ...get().byPlanetId,
      [planetId]: {
        reserveUnits: maxUnits,
        maxUnits,
        updatedAt: Date.now(),
      },
    };
    set({ byPlanetId: next });
    persistDirty = true;
    schedulePersist(get);
  },

  getMaxUnits: (planetId, runtimeResource) => {
    const r = readRuntimeResource(planetId, runtimeResource);
    const row = get().byPlanetId[planetId];
    if (row?.maxUnits) return row.maxUnits;
    return resolvePlanetMineralReserveMaxUnits(r);
  },

  getReserveUnits: (planetId, runtimeResource) => {
    if (!planetId) return 0;
    const r = readRuntimeResource(planetId, runtimeResource);
    if (!get().loaded) {
      return resolvePlanetMineralReserveMaxUnits(r);
    }
    get().bootstrapPlanetIfMissing(planetId, r);
    return Math.max(0, get().byPlanetId[planetId]?.reserveUnits ?? 0);
  },

  consumeReserve: (planetId, quantity, runtimeResource) => {
    if (!planetId || quantity <= 0) return 0;
    if (!get().loaded) {
      // loadLocal 완료 전 — 디스크·메모리 row 생성 없이 채굴 tick만 통과
      return Math.floor(quantity);
    }
    const r = readRuntimeResource(planetId, runtimeResource);
    get().bootstrapPlanetIfMissing(planetId, r);
    const prev = get().byPlanetId[planetId]!;
    const maxUnits = resolvePlanetMineralReserveMaxUnits(r);
    const take = Math.min(Math.floor(quantity), prev.reserveUnits);
    if (take <= 0) return 0;
    const next = {
      ...get().byPlanetId,
      [planetId]: {
        reserveUnits: prev.reserveUnits - take,
        maxUnits,
        updatedAt: Date.now(),
      },
    };
    set({ byPlanetId: next });
    persistDirty = true;
    schedulePersist(get);
    return take;
  },

  applyDailyRegenForPlanet: (planetId, runtimeResource) => {
    if (!planetId) return;
    const policy = resolvePlanetMineralLedgerPolicy();
    const maxUnits = resolvePlanetMineralReserveMaxUnits(runtimeResource);
    const prev = get().byPlanetId[planetId];
    const cur = prev?.reserveUnits ?? maxUnits;
    const regen = Math.floor(maxUnits * policy.dailyRegenPct);
    const reserveUnits = Math.min(maxUnits, cur + Math.max(1, regen));
    const next = {
      ...get().byPlanetId,
      [planetId]: { reserveUnits, maxUnits, updatedAt: Date.now() },
    };
    set({ byPlanetId: next });
    persistDirty = true;
    schedulePersist(get);
  },
}));
