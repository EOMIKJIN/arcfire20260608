import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_arc_core_territorial_combat_v1';

type Persisted = {
  byPlanetId: Record<string, { lastPassAtMs: number }>;
};

let mem: Persisted = { byPlanetId: {} };
let hydrated = false;

export async function hydrateArcCoreTerritorialCombatState(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      mem = {
        byPlanetId:
          parsed.byPlanetId && typeof parsed.byPlanetId === 'object'
            ? parsed.byPlanetId
            : {},
      };
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
  }
}

export function getTerritorialCombatLastPassAtMs(planetId: string): number | null {
  const row = mem.byPlanetId[planetId];
  return typeof row?.lastPassAtMs === 'number' ? row.lastPassAtMs : null;
}

export async function markTerritorialCombatPassCompleted(
  planetId: string,
  nowMs: number,
): Promise<void> {
  mem = {
    byPlanetId: {
      ...mem.byPlanetId,
      [planetId]: { lastPassAtMs: nowMs },
    },
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}
