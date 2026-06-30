// ============================================================
// 행성 광물 레저 — 로컬 매장 잔량·일 1회 ArcCore 재생
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  resolvePlanetMineralLedgerPolicy,
} from '../arcCore/planetResource/planetMineralLedgerPolicy';
import { resolveOrbitMiningDailyAllowanceCapUnits } from '../game/mining/orbitMiningDailyAllowanceCap';
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

/** 정책 cap 확대·R≠광물 재반영 — 구 ledger max 로 고갈 잠금 유지 방지 */
function reconcilePlanetMineralLedgerRows(
  rows: Record<string, PlanetMineralLedgerRow>,
): Record<string, PlanetMineralLedgerRow> {
  const policy = resolvePlanetMineralLedgerPolicy();
  const floor = policy.miningReserveFloorUnits;
  const out: Record<string, PlanetMineralLedgerRow> = {};
  for (const [planetId, row] of Object.entries(rows)) {
    const r = readRuntimeResource(planetId);
    const maxUnits = resolveOrbitMiningDailyAllowanceCapUnits(planetId, r);
    let reserveUnits = Math.max(0, row.reserveUnits ?? 0);
    const prevMax = row.maxUnits ?? maxUnits;
    if (maxUnits > prevMax && reserveUnits <= floor) {
      const regen = Math.max(1, Math.floor(maxUnits * policy.dailyRegenPct));
      reserveUnits = Math.min(maxUnits, reserveUnits + regen);
    } else {
      reserveUnits = Math.min(maxUnits, reserveUnits);
    }
    out[planetId] = { reserveUnits, maxUnits, updatedAt: Date.now() };
  }
  return out;
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
      const reconciled = reconcilePlanetMineralLedgerRows(parsed ?? {});
      persistDirty = Object.keys(reconciled).length > 0;
      set({ loaded: true, byPlanetId: reconciled });
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
    const maxUnits = resolveOrbitMiningDailyAllowanceCapUnits(planetId, runtimeResource);
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

  getMaxUnits: (planetId, runtimeResource) =>
    resolveOrbitMiningDailyAllowanceCapUnits(planetId, runtimeResource),

  getReserveUnits: (planetId, runtimeResource) => {
    if (!planetId) return 0;
    const r = readRuntimeResource(planetId, runtimeResource);
    if (!get().loaded) {
      return resolveOrbitMiningDailyAllowanceCapUnits(planetId, runtimeResource);
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
    const maxUnits = resolveOrbitMiningDailyAllowanceCapUnits(planetId, runtimeResource);
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
    const maxUnits = resolveOrbitMiningDailyAllowanceCapUnits(planetId, runtimeResource);
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
