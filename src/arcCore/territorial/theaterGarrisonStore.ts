// ============================================================
// 전선 주둔 % — 월드 축 · 키 상한 = poolMax(≤12)
// persist 코얼레스 1.5s. 계정 purge 대상 아님.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getArcCoreContestedPoolPolicy } from './arcCoreContestedPoolPolicy';
import { clampTheaterGarrisonPct } from './applyTheaterGarrisonAdjustments';
import { isPlanetInActiveTerritorialRotation } from './resolveWarTheaterState';

const STORAGE_KEY = 'arcfire_theater_garrison_v1';
const PERSIST_COALESCE_MS = 1500;

export type TheaterGarrisonEntry = {
  pct: number;
  updatedAtMs: number;
};

type Persisted = {
  byPlanetId: Record<string, TheaterGarrisonEntry>;
};

let mem: Persisted = { byPlanetId: {} };
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function poolCap(): number {
  return Math.max(1, getArcCoreContestedPoolPolicy('draco_front').poolMax);
}

function pruneToCap(next: Persisted): Persisted {
  const cap = poolCap();
  const ids = Object.keys(next.byPlanetId);
  if (ids.length <= cap) return next;
  const ranked = ids
    .map((id) => ({ id, at: next.byPlanetId[id]?.updatedAtMs ?? 0, inRot: isPlanetInActiveTerritorialRotation(id) }))
    .sort((a, b) => {
      if (a.inRot !== b.inRot) return a.inRot ? -1 : 1;
      return b.at - a.at;
    });
  const keep = new Set(ranked.slice(0, cap).map((r) => r.id));
  const byPlanetId: Record<string, TheaterGarrisonEntry> = {};
  for (let i = 0; i < ranked.length; i += 1) {
    const id = ranked[i]!.id;
    if (!keep.has(id)) continue;
    const row = next.byPlanetId[id];
    if (row) byPlanetId[id] = row;
  }
  return { byPlanetId };
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  }, PERSIST_COALESCE_MS);
}

export async function hydrateTheaterGarrisonStore(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        if (parsed && parsed.byPlanetId && typeof parsed.byPlanetId === 'object') {
          mem = pruneToCap({ byPlanetId: parsed.byPlanetId });
        }
      }
    } catch {
      mem = { byPlanetId: {} };
    }
    hydrated = true;
    hydratePromise = null;
  })();
  return hydratePromise;
}

export function getTheaterGarrisonPct(planetId: string): number {
  const row = mem.byPlanetId[planetId.trim()];
  return row ? clampTheaterGarrisonPct(row.pct) : 100;
}

export function setTheaterGarrisonPct(planetId: string, pct: number, nowMs = Date.now()): void {
  const id = planetId.trim();
  if (!id || !isPlanetInActiveTerritorialRotation(id)) {
    if (mem.byPlanetId[id]) {
      const next = { ...mem.byPlanetId };
      delete next[id];
      mem = pruneToCap({ byPlanetId: next });
      schedulePersist();
    }
    return;
  }
  const next = {
    byPlanetId: {
      ...mem.byPlanetId,
      [id]: { pct: clampTheaterGarrisonPct(pct), updatedAtMs: nowMs },
    },
  };
  mem = pruneToCap(next);
  schedulePersist();
}

export function dropTheaterGarrisonIfNotInRotation(planetId: string): void {
  const id = planetId.trim();
  if (!id || isPlanetInActiveTerritorialRotation(id)) return;
  if (!mem.byPlanetId[id]) return;
  const next = { ...mem.byPlanetId };
  delete next[id];
  mem = { byPlanetId: next };
  schedulePersist();
}

export function listTheaterGarrisonPlanetIds(): string[] {
  return Object.keys(mem.byPlanetId);
}

export function resetTheaterGarrisonStoreForTests(): void {
  mem = { byPlanetId: {} };
  hydrated = true;
  hydratePromise = null;
}
