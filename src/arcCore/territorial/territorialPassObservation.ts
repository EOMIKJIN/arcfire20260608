// ============================================================
// 20분 패스 → 일 배치 관측 버퍼. 키 상한 = poolMax. 후방 append 거부.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getArcCoreContestedPoolPolicy } from './arcCoreContestedPoolPolicy';
import { isPlanetInActiveTerritorialRotation } from './resolveWarTheaterState';

const STORAGE_KEY = 'arcfire_territorial_pass_observation_v1';
const PERSIST_COALESCE_MS = 1500;

export type TerritorialPassObservation = {
  planetId: string;
  decision: string;
  holdChanged: boolean;
  garrisonAfter01: number;
  spoilsCredits: number;
  atMs: number;
  source: 'npc' | 'player_wave' | 'skip';
};

type Persisted = { byPlanetId: Record<string, TerritorialPassObservation> };

let mem: Persisted = { byPlanetId: {} };
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function poolCap(): number {
  return Math.max(1, getArcCoreContestedPoolPolicy('draco_front').poolMax);
}

function prune(next: Persisted): Persisted {
  const cap = poolCap();
  const ids = Object.keys(next.byPlanetId);
  if (ids.length <= cap) return next;
  const ranked = ids
    .map((id) => ({ id, at: next.byPlanetId[id]?.atMs ?? 0 }))
    .sort((a, b) => b.at - a.at)
    .slice(0, cap);
  const byPlanetId: Record<string, TerritorialPassObservation> = {};
  for (let i = 0; i < ranked.length; i += 1) {
    const row = next.byPlanetId[ranked[i]!.id];
    if (row) byPlanetId[row.planetId] = row;
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

export async function hydrateTerritorialPassObservation(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed?.byPlanetId) mem = prune(parsed);
    }
  } catch {
    mem = { byPlanetId: {} };
  }
  hydrated = true;
}

export function recordTerritorialPassObservation(row: TerritorialPassObservation): void {
  const id = row.planetId.trim();
  if (!id || !isPlanetInActiveTerritorialRotation(id)) return;
  mem = prune({
    byPlanetId: {
      ...mem.byPlanetId,
      [id]: { ...row, planetId: id },
    },
  });
  schedulePersist();
}

export function getTerritorialPassObservation(planetId: string): TerritorialPassObservation | null {
  return mem.byPlanetId[planetId.trim()] ?? null;
}
