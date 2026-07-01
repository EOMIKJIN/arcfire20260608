import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { invalidatePlanetWorldObjectsListCache } from '../worldObjects/planetWorldObjectsListCacheRegistry';
import type { StarSystem } from '../types';
import type { WorldObjectRuntimeState } from '../worldObjects/types';
import {
  ASTEROID_ORBIT_COUNT_MAX,
  ASTEROID_ORBIT_COUNT_MIN,
  resolvePlanetAsteroidAssignedMineralIds,
  resolvePlanetAsteroidOrbitCount,
} from '../world/mineralDepositModel';

const STORAGE_KEY = 'arcfire_world_object_runtime_v1';

type PatchSource = 'bootstrap' | 'arc_core_cycle' | 'manual';

interface WorldObjectRuntimeStoreState {
  loaded: boolean;
  asteroidOrbitCountByPlanetId: Record<string, number>;
  asteroidMineralItemIdsByPlanetId: Record<string, string[]>;
  /** `planetId:kind:instanceKey` — 방위위성·잔해 등 인스턴스별 상태(추후 hp·depleted) */
  instanceStateByObjectId: Record<string, WorldObjectRuntimeState>;
  loadLocalRuntime: () => Promise<void>;
  persistRuntime: () => Promise<void>;
  resetRuntime: () => Promise<void>;
  bootstrapFromWorld: (systems: Record<string, StarSystem>) => Promise<void>;
  getAsteroidOrbitCount: (planetId: string, fallback: number) => number;
  getAsteroidAssignedMineralItemIds: (planetId: string, orbitCount: number, fallback: string[]) => string[];
  getInstanceState: (objectId: string) => WorldObjectRuntimeState | undefined;
  patchInstanceState: (
    objectId: string,
    patch: Partial<WorldObjectRuntimeState>,
    source?: PatchSource,
  ) => void;
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

function normalizeInstanceStateRecord(input: unknown): Record<string, WorldObjectRuntimeState> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, WorldObjectRuntimeState> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!k || !v || typeof v !== 'object') continue;
    const row = v as Record<string, unknown>;
    const state: WorldObjectRuntimeState = {};
    if (typeof row.depleted === 'boolean') state.depleted = row.depleted;
    if (typeof row.hp === 'number' && Number.isFinite(row.hp)) state.hp = row.hp;
    if (row.ownerFactionId === null || typeof row.ownerFactionId === 'string') {
      state.ownerFactionId = row.ownerFactionId as string | null;
    }
    if (typeof row.cooldownUntilMs === 'number' || row.cooldownUntilMs === null) {
      state.cooldownUntilMs = row.cooldownUntilMs as number | null;
    }
    if (typeof row.defenseLevel === 'number' && Number.isFinite(row.defenseLevel)) {
      state.defenseLevel = Math.max(1, Math.floor(row.defenseLevel));
    }
    if (Object.keys(state).length > 0) out[k] = state;
  }
  return out;
}

function parseWorldObjectPlanetId(objectId: string): string | null {
  const idx = objectId.indexOf(':');
  return idx > 0 ? objectId.slice(0, idx) : null;
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

export const useWorldObjectRuntimeStore = create<WorldObjectRuntimeStoreState>((set, get) => ({
  loaded: false,
  asteroidOrbitCountByPlanetId: {},
  asteroidMineralItemIdsByPlanetId: {},
  instanceStateByObjectId: {},

  loadLocalRuntime: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          asteroidOrbitCountByPlanetId?: unknown;
          asteroidMineralItemIdsByPlanetId?: unknown;
          instanceStateByObjectId?: unknown;
        };
        set({
          asteroidOrbitCountByPlanetId: normalizeRecord(parsed.asteroidOrbitCountByPlanetId),
          asteroidMineralItemIdsByPlanetId: normalizeStringArrayRecord(parsed.asteroidMineralItemIdsByPlanetId),
          instanceStateByObjectId: normalizeInstanceStateRecord(parsed.instanceStateByObjectId),
        });
      }
    } catch {
      /* ignore */
    } finally {
      set({ loaded: true });
    }
  },

  persistRuntime: async () => {
    const {
      asteroidOrbitCountByPlanetId,
      asteroidMineralItemIdsByPlanetId,
      instanceStateByObjectId,
    } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        asteroidOrbitCountByPlanetId,
        asteroidMineralItemIdsByPlanetId,
        instanceStateByObjectId,
      }),
    );
  },

  resetRuntime: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      loaded: true,
      asteroidOrbitCountByPlanetId: {},
      asteroidMineralItemIdsByPlanetId: {},
      instanceStateByObjectId: {},
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

  getInstanceState: (objectId) => get().instanceStateByObjectId[objectId],

  patchInstanceState: (objectId, patch, source = 'manual') => {
    if (!objectId) return;
    const prev = get().instanceStateByObjectId[objectId] ?? {};
    const nextState: WorldObjectRuntimeState = { ...prev, ...patch };
    const prevAll = get().instanceStateByObjectId;
    if (
      prev.depleted === nextState.depleted
      && prev.hp === nextState.hp
      && prev.ownerFactionId === nextState.ownerFactionId
      && prev.cooldownUntilMs === nextState.cooldownUntilMs
      && prev.defenseLevel === nextState.defenseLevel
    ) {
      return;
    }
    set({
      instanceStateByObjectId: {
        ...prevAll,
        [objectId]: nextState,
      },
    });
    void get().persistRuntime();
    const planetId = parseWorldObjectPlanetId(objectId);
    if (planetId) invalidatePlanetWorldObjectsListCache(planetId);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[WorldObjectRuntime] instance state patched (${source})`, objectId);
    }
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
    for (const planetId of Object.keys(normalized)) {
      invalidatePlanetWorldObjectsListCache(planetId);
    }
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
    for (const planetId of Object.keys(normalized)) {
      invalidatePlanetWorldObjectsListCache(planetId);
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[WorldObjectRuntime] asteroid mineral ids patched (${source})`, Object.keys(normalized).length);
    }
  },
}));

