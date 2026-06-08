import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Planet, ZoneType } from '../types';
import { useWorldStore } from './worldStore';

const STORAGE_KEY = 'arcfire_planet_nebula_profiles_v1';
const PERSIST_DEBOUNCE_MS = 700;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export type PlanetNebulaProfile = {
  seed: number;
  flowSpeed: number;
  swirl: number;
  density: number;
  paletteA: string;
  paletteB: string;
  paletteC: string;
  updatedAt: number;
};

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

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mixHex(a: string, b: string, tRaw: number): string {
  const t = clamp01(tRaw);
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

function resolveZonePalette(zone: ZoneType): { a: string; b: string; c: string } {
  switch (zone) {
    case 'safe':
      return { a: '#17253f', b: '#335b9a', c: '#78b7ff' };
    case 'neutral':
      return { a: '#221b3e', b: '#5a3d9a', c: '#7f65d7' };
    case 'pvp':
      return { a: '#33142a', b: '#8c2f51', c: '#f29e5c' };
    case 'endgame':
    default:
      return { a: '#161128', b: '#4c3f87', c: '#d7c46f' };
  }
}

function dayKeyUtc(ms: number): number {
  return Math.floor(ms / 86400000);
}

function buildNebulaProfile(planet: Planet, zone: ZoneType): PlanetNebulaProfile {
  const seed = hashStringToInt(
    `${planet.id}:${planet.factionId}:${planet.coreResource}:${planet.corePopulation}:${planet.coreDefense}:${planet.coreTechnology}:${planet.coreEnvironment}`,
  );
  const rand = mulberry32(seed);
  const base = resolveZonePalette(zone);
  const techFactor = clamp01(planet.coreTechnology / 100);
  const envFactor = clamp01(planet.coreEnvironment / 100);
  const defenseFactor = clamp01(planet.coreDefense / 100);
  const resourceFactor = clamp01(planet.coreResource / 100);

  const paletteA = mixHex(base.a, '#0b0f18', 0.24 * (1 - envFactor));
  const paletteB = mixHex(base.b, '#4ec5ff', 0.18 * techFactor + rand() * 0.08);
  const paletteC = mixHex(base.c, '#ffcc66', 0.12 * resourceFactor + 0.1 * defenseFactor);

  return {
    seed,
    flowSpeed: 0.012 + techFactor * 0.018 + rand() * 0.01,
    swirl: 1.2 + defenseFactor * 1.1 + rand() * 0.6,
    density: 0.36 + resourceFactor * 0.42 + rand() * 0.14,
    paletteA,
    paletteB,
    paletteC,
    updatedAt: Date.now(),
  };
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

