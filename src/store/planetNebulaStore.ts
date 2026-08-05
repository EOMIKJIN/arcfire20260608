import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Planet, ZoneType } from '../types';
import { useWorldStore } from './worldStore';
import { buildNebulaProfile, type PlanetNebulaProfile } from '../game/planetNebulaProfile';

export type { PlanetNebulaProfile } from '../game/planetNebulaProfile';

const STORAGE_KEY = 'arcfire_planet_nebula_profiles_v1';
const PERSIST_DEBOUNCE_MS = 700;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

type PlanetNebulaState = {
  profilesByPlanetId: Record<string, PlanetNebulaProfile>;
  lastDailyShiftDayKey: number | null;
  loadLocalProfiles: () => Promise<void>;
  persistProfiles: () => Promise<void>;
  schedulePersistProfiles: () => void;
  pruneOrphanProfiles: () => number;
  ensureProfileForPlanet: (planetId: string) => PlanetNebulaProfile | null;
  ensureProfilesForSystem: (systemId: string) => void;
  applyDailyEcologyShiftIfDue: (nowMs?: number) => { applied: boolean; changedCount: number };
  /** 계정 초기화 — 성운 프로필 캐시 폐기(신규 시작 시 재생성) */
  resetLocalProfilesForAccountPurge: () => Promise<void>;
};

function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mixHex(a: string, b: string, tRaw: number): string {
  const t = Math.max(0, Math.min(1, tRaw));
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bch = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bch].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function dayKeyUtc(ms: number): number {
  return Math.floor(ms / 86400000);
}

function resolvePlanetWithZone(planetId: string): { planet: Planet; zone: ZoneType } | null {
  const systems = useWorldStore.getState().systems;
  for (const system of Object.values(systems)) {
    const p = system.planets.find((x) => x.id === planetId);
    if (p) return { planet: p, zone: system.zone };
  }
  return null;
}

export const usePlanetNebulaStore = create<PlanetNebulaState>((set, get) => ({
  profilesByPlanetId: {},
  lastDailyShiftDayKey: null,

  loadLocalProfiles: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        profilesByPlanetId?: Record<string, PlanetNebulaProfile>;
        lastDailyShiftDayKey?: number | null;
      };
      if (parsed.profilesByPlanetId && typeof parsed.profilesByPlanetId === 'object') {
        set({
          profilesByPlanetId: parsed.profilesByPlanetId,
          lastDailyShiftDayKey:
            typeof parsed.lastDailyShiftDayKey === 'number' ? parsed.lastDailyShiftDayKey : null,
        });
      }
      get().pruneOrphanProfiles();
    } catch {
      /* ignore */
    }
  },

  persistProfiles: async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profilesByPlanetId: get().profilesByPlanetId,
        lastDailyShiftDayKey: get().lastDailyShiftDayKey,
      }),
    );
  },

  schedulePersistProfiles: () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      void get().persistProfiles();
    }, PERSIST_DEBOUNCE_MS);
  },

  resetLocalProfilesForAccountPurge: async () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ profilesByPlanetId: {}, lastDailyShiftDayKey: null });
  },

  pruneOrphanProfiles: () => {
    const systems = useWorldStore.getState().systems;
    const validPlanetIds = new Set<string>();
    for (const sys of Object.values(systems)) {
      for (const p of sys.planets) validPlanetIds.add(p.id);
    }
    const prev = get().profilesByPlanetId;
    const next: Record<string, PlanetNebulaProfile> = {};
    let removed = 0;
    for (const [planetId, profile] of Object.entries(prev)) {
      if (validPlanetIds.has(planetId)) {
        next[planetId] = profile;
      } else {
        removed += 1;
      }
    }
    if (removed > 0) {
      set({ profilesByPlanetId: next });
      get().schedulePersistProfiles();
    }
    return removed;
  },

  ensureProfileForPlanet: (planetId: string) => {
    const existing = get().profilesByPlanetId[planetId];
    if (existing) return existing;
    const info = resolvePlanetWithZone(planetId);
    if (!info) return null;
    const profile = buildNebulaProfile(info.planet, info.zone);
    set((state) => ({
      profilesByPlanetId: {
        ...state.profilesByPlanetId,
        [planetId]: profile,
      },
    }));
    get().schedulePersistProfiles();
    return profile;
  },

  ensureProfilesForSystem: (systemId: string) => {
    const world = useWorldStore.getState();
    const system = world.getSystem(systemId);
    if (!system) return;
    let changed = false;
    const next = { ...get().profilesByPlanetId };
    for (const planet of system.planets) {
      if (next[planet.id]) continue;
      next[planet.id] = buildNebulaProfile(planet, system.zone);
      changed = true;
    }
    if (!changed) return;
    set({ profilesByPlanetId: next });
    get().schedulePersistProfiles();
  },

  applyDailyEcologyShiftIfDue: (nowMs = Date.now()) => {
    const state = get();
    const todayKey = dayKeyUtc(nowMs);
    if (state.lastDailyShiftDayKey === todayKey) {
      return { applied: false, changedCount: 0 };
    }
    const world = useWorldStore.getState();
    const unlocked = new Set(world.unlockedSystemIds);
    const systems = Object.values(world.systems).filter((s) => unlocked.has(s.id));
    if (systems.length === 0) {
      set({ lastDailyShiftDayKey: todayKey });
      get().schedulePersistProfiles();
      return { applied: true, changedCount: 0 };
    }

    let changedCount = 0;
    const next = { ...state.profilesByPlanetId };
    for (const sys of systems) {
      for (const planet of sys.planets) {
        const cur = next[planet.id] ?? buildNebulaProfile(planet, sys.zone);
        const driftRand = mulberry32(hashStringToInt(`${planet.id}:${todayKey}:${cur.seed}`));
        const flowDelta = (driftRand() - 0.5) * 0.0018;
        const swirlDelta = (driftRand() - 0.5) * 0.06;
        const densityDelta = (driftRand() - 0.5) * 0.035;
        next[planet.id] = {
          ...cur,
          flowSpeed: clamp(cur.flowSpeed + flowDelta, 0.008, 0.05),
          swirl: clamp(cur.swirl + swirlDelta, 0.8, 3.0),
          density: clamp(cur.density + densityDelta, 0.2, 1.2),
          paletteB: mixHex(cur.paletteB, '#7ac8ff', 0.01 + driftRand() * 0.02),
          paletteC: mixHex(cur.paletteC, '#ffd27a', 0.01 + driftRand() * 0.02),
          updatedAt: nowMs,
        };
        changedCount += 1;
      }
    }

    set({
      profilesByPlanetId: next,
      lastDailyShiftDayKey: todayKey,
    });
    get().schedulePersistProfiles();
    return { applied: true, changedCount };
  },
}));

/** 성계 이탈 — 지정 행성 프로필 제거 */
export function prunePlanetNebulaProfilesForPlanets(planetIds: readonly string[]): number {
  const remove = new Set(planetIds.filter(Boolean));
  if (remove.size === 0) return 0;
  const { profilesByPlanetId } = usePlanetNebulaStore.getState();
  const next: Record<string, PlanetNebulaProfile> = {};
  let removed = 0;
  for (const [id, profile] of Object.entries(profilesByPlanetId)) {
    if (remove.has(id)) {
      removed += 1;
    } else {
      next[id] = profile;
    }
  }
  if (removed === 0) return 0;
  usePlanetNebulaStore.setState({ profilesByPlanetId: next });
  usePlanetNebulaStore.getState().schedulePersistProfiles();
  return removed;
}

/** keep 목록 외 nebula 프로필 제거 — 허브 앵커·현재 성계만 유지 */
export function prunePlanetNebulaProfilesExceptPlanetIds(keepPlanetIds: readonly string[]): number {
  const keep = new Set(keepPlanetIds.filter(Boolean));
  const { profilesByPlanetId } = usePlanetNebulaStore.getState();
  const next: Record<string, PlanetNebulaProfile> = {};
  let removed = 0;
  for (const [id, profile] of Object.entries(profilesByPlanetId)) {
    if (keep.has(id)) {
      next[id] = profile;
    } else {
      removed += 1;
    }
  }
  if (removed === 0) return 0;
  usePlanetNebulaStore.setState({ profilesByPlanetId: next });
  usePlanetNebulaStore.getState().schedulePersistProfiles();
  return removed;
}

/** route_blur 등 — 메모리 상주 프로필 LRU 정리 (updatedAt 기준) */
export function prunePlanetNebulaProfilesLru(keepMax: number): number {
  const keep = Math.max(0, keepMax);
  const { profilesByPlanetId } = usePlanetNebulaStore.getState();
  const entries = Object.entries(profilesByPlanetId);
  if (entries.length <= keep) return 0;
  entries.sort((a, b) => (b[1].updatedAt ?? 0) - (a[1].updatedAt ?? 0));
  const keepIds = new Set(entries.slice(0, keep).map(([id]) => id));
  const next: Record<string, PlanetNebulaProfile> = {};
  for (const [id, profile] of entries) {
    if (keepIds.has(id)) next[id] = profile;
  }
  const removed = entries.length - keep;
  usePlanetNebulaStore.setState({ profilesByPlanetId: next });
  usePlanetNebulaStore.getState().schedulePersistProfiles();
  return removed;
}
