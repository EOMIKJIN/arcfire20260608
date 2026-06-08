import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { StarSystem } from '../types';
import {
  resolvePlanetAsteroidAssignedMineralIds,
  resolvePlanetAsteroidOrbitCount,
} from '../world/mineralDepositModel';

const STORAGE_KEY = 'arcfire_world_object_runtime_v1';
const ASTEROID_ORBIT_COUNT_MIN = 1;
const ASTEROID_ORBIT_COUNT_MAX = 10;

type PatchSource = 'bootstrap' | 'arc_core_cycle' | 'manual';

interface WorldObjectRuntimeState {
  loaded: boolean;
  asteroidOrbitCountByPlanetId: Record<string, number>;
  asteroidMineralItemIdsByPlanetId: Record<string, string[]>;
  loadLocalRuntime: () => Promise<void>;
  persistRuntime: () => Promise<void>;
  resetRuntime: () => Promise<void>;
  bootstrapFromWorld: (systems: Record<string, StarSystem>) => Promise<void>;
  getAsteroidOrbitCount: (planetId: string, fallback: number) => number;
  getAsteroidAssignedMineralItemIds: (planetId: string, orbitCount: number, fallback: string[]) => string[];
  patchAsteroidOrbitCounts: (input: Record<string, number>, source?: PatchSource) => void;
  patchAsteroidAssignedMineralItemIds: (input: Record<string, string[]>, source?: PatchSource) => void;
}

function clampOrbitCount(n: number): number {
  const v = Number.isFinite(n) ? Math.round(n) : ASTEROID_ORBIT_COUNT_MIN;
  return Math.max(ASTEROID_ORBIT_COUNT_MIN, Math.min(ASTEROID_ORBIT_COUNT_MAX, v));
}

function normalizeRecord(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!k) continue;
    if (typeof v !== 'number') continue;
    out[k] = clampOrbitCount(v);
  }
  return out;
}

function normalizeStringArrayRecord(input: unknown): Record<string, string[]> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!k || !Array.isArray(v)) continue;
    const arr = v
      .map((it) => (typeof it === 'string' ? it.trim() : ''))
      .filter((it) => it.length > 0);
    if (arr.length > 0) out[k] = arr;
  }
  return out;
}

export const useWorldObjectRuntimeStore = create<WorldObjectRuntimeState>((set, get) => ({
  loaded: false,
  asteroidOrbitCountByPlanetId: {},
  asteroidMineralItemIdsByPlanetId: {},

  loadLocalRuntime: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          asteroidOrbitCountByPlanetId?: unknown;
          asteroidMineralItemIdsByPlanetId?: unknown;
        };
        set({
          asteroidOrbitCountByPlanetId: normalizeRecord(parsed.asteroidOrbitCountByPlanetId),
          asteroidMineralItemIdsByPlanetId: normalizeStringArrayRecord(parsed.asteroidMineralItemIdsByPlanetId),
        });
      }
    } catch {
      /* ignore */
    } finally {
      set({ loaded: true });
    }
  },

  persistRuntime: async () => {
    const { asteroidOrbitCountByPlanetId, asteroidMineralItemIdsByPlanetId } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        asteroidOrbitCountByPlanetId,
        asteroidMineralItemIdsByPlanetId,
      }),
    );
  },

  resetRuntime: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      loaded: true,
      asteroidOrbitCountByPlanetId: {},
      asteroidMineralItemIdsByPlanetId: {},
    });
  },

  bootstrapFromWorld: async (systems) => {
    if (!get().loaded) {
      await get().loadLocalRuntime();
    }
    const next = { ...get().asteroidOrbitCountByPlanetId };
    const nextMinerals = { ...get().asteroidMineralItemIdsByPlanetId };
    let dirty = false;
    for (const sys of Object.values(systems)) {
      for (const planet of sys.planets) {
        const pid = planet.id;
        const seeded = clampOrbitCount(resolvePlanetAsteroidOrbitCount(pid));
        const assigned = resolvePlanetAsteroidAssignedMineralIds(pid, seeded);
        const prevAssigned = nextMinerals[pid] ?? [];
        if (next[pid] !== seeded) {
          next[pid] = seeded;
          dirty = true;
        }
        if (prevAssigned.length !== assigned.length || !prevAssigned.every((id, i) => id === assigned[i])) {
          nextMinerals[pid] = assigned;
          dirty = true;
        }
      }
    }
    if (!dirty) return;
    set({ asteroidOrbitCountByPlanetId: next, asteroidMineralItemIdsByPlanetId: nextMinerals });
    void get().persistRuntime();
  },

  getAsteroidOrbitCount: (planetId, fallback) => {
    const v = get().asteroidOrbitCountByPlanetId[planetId];
    if (v == null) return clampOrbitCount(fallback);
    return clampOrbitCount(v);
  },

  getAsteroidAssignedMineralItemIds: (planetId, orbitCount, fallback) => {
    const assigned = get().asteroidMineralItemIdsByPlanetId[planetId];
    if (assigned && assigned.length > 0) return assigned.slice(0, Math.max(1, orbitCount));
    return fallback.slice(0, Math.max(1, orbitCount));
  },

  patchAsteroidOrbitCounts: (input, source = 'manual') => {
    const normalized = normalizeRecord(input);
    if (!Object.keys(normalized).length) return;
    const prev = get().asteroidOrbitCountByPlanetId;
    const next = { ...prev };
    let changed = false;
    for (const [planetId, count] of Object.entries(normalized)) {
      if (next[planetId] === count) continue;
      next[planetId] = count;
      changed = true;
    }
    if (!changed) return;
    set({ asteroidOrbitCountByPlanetId: next });
    void get().persistRuntime();
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[WorldObjectRuntime] asteroid orbit counts patched (${source})`, Object.keys(normalized).length);
    }
  },

  patchAsteroidAssignedMineralItemIds: (input, source = 'manual') => {
    const normalized = normalizeStringArrayRecord(input);
    if (!Object.keys(normalized).length) return;
    const prev = get().asteroidMineralItemIdsByPlanetId;
    const next = { ...prev };
    let changed = false;
    for (const [planetId, ids] of Object.entries(normalized)) {
      const prevIds = next[planetId] ?? [];
      if (prevIds.length === ids.length && prevIds.every((id, i) => id === ids[i])) continue;
      next[planetId] = ids;
      changed = true;
    }
    if (!changed) return;
    set({ asteroidMineralItemIdsByPlanetId: next });
    void get().persistRuntime();
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[WorldObjectRuntime] asteroid mineral ids patched (${source})`, Object.keys(normalized).length);
    }
  },
}));

