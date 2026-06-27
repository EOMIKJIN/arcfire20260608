// ============================================================
// 행성 총사령관 런타임 배정 — ArcCore 영토 상태 (계정 purge 제외)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pickGovernorReserveCommanderAtIndex,
  type GovernorOccupationSide,
} from './planetGovernorReservePool';

const STORAGE_KEY = 'arcfire_planet_governor_assignments_v1';
const PERSIST_COALESCE_MS = 1500;

export type PlanetGovernorAssignment = {
  captainId: string;
  occupationSide: GovernorOccupationSide;
  assignedAtMs: number;
};

type Persisted = {
  byPlanetId: Record<string, PlanetGovernorAssignment>;
  sideNextIndex: Record<GovernorOccupationSide, number>;
};

const EMPTY_SIDE_INDEX: Record<GovernorOccupationSide, number> = {
  BLUE: 0,
  RED: 0,
  NEUTRAL: 0,
};

let mem: Persisted = { byPlanetId: {}, sideNextIndex: { ...EMPTY_SIDE_INDEX } };
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem)).catch(() => {
      /* ignore */
    });
  }, PERSIST_COALESCE_MS);
}

export async function hydratePlanetGovernorAssignmentStore(): Promise<void> {
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
        sideNextIndex: {
          ...EMPTY_SIDE_INDEX,
          ...(parsed.sideNextIndex && typeof parsed.sideNextIndex === 'object'
            ? parsed.sideNextIndex
            : {}),
        },
      };
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
  }
}

export function isPlanetGovernorAssignmentStoreHydrated(): boolean {
  return hydrated;
}

export function getPlanetGovernorAssignment(planetId: string): PlanetGovernorAssignment | null {
  return mem.byPlanetId[planetId] ?? null;
}

export function assignPlanetGovernorFromReserve(params: {
  planetId: string;
  occupationSide: GovernorOccupationSide;
}): PlanetGovernorAssignment | null {
  const { planetId, occupationSide } = params;
  const index = mem.sideNextIndex[occupationSide] ?? 0;
  const reserve = pickGovernorReserveCommanderAtIndex(occupationSide, index);
  if (!reserve) return null;

  const assignment: PlanetGovernorAssignment = {
    captainId: reserve.captainId,
    occupationSide,
    assignedAtMs: Date.now(),
  };

  mem = {
    byPlanetId: { ...mem.byPlanetId, [planetId]: assignment },
    sideNextIndex: {
      ...mem.sideNextIndex,
      [occupationSide]: index + 1,
    },
  };
  schedulePersist();
  return assignment;
}
