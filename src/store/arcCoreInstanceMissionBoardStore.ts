import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  createEmptyArcCoreInstanceMissionBoard,
  ensurePlanetTavernInstanceBoard,
  refreshArcCoreInstanceMissionBoardState,
  resolveArcCoreInstanceDayKeyKst,
  runArcCoreTavernInstanceBoardReplenishPass,
  shouldRefreshArcCoreInstanceMissionBoard,
} from '../missions/arcCoreInstanceMissionGenerator';
import { syncArcCoreInstanceMissionMaterializedCache } from '../missions/arcCoreInstanceMissionResolver';
import type {
  ArcCoreInstanceMissionBoardEntry,
  ArcCoreInstanceMissionBoardState,
  ArcCoreInstanceMissionDailyPassResult,
} from '../missions/arcCoreInstanceMissionTypes';

const STORAGE_KEY = 'arcfire_arc_core_instance_missions_v1';

type BoardSlice = ArcCoreInstanceMissionBoardState;

interface ArcCoreInstanceMissionBoardStore extends BoardSlice {
  loadLocalArcCoreInstanceMissionBoard: () => Promise<void>;
  persistArcCoreInstanceMissionBoard: () => Promise<void>;
  resetLocalArcCoreInstanceMissionBoard: () => Promise<void>;
  findBoardEntry: (instanceId: string) => ArcCoreInstanceMissionBoardEntry | undefined;
  listBoardEntriesForPlanet: (planetId: string) => ArcCoreInstanceMissionBoardEntry[];
  markBoardEntryAccepted: (instanceId: string) => void;
  markBoardEntryCleared: (instanceId: string) => void;
  runDailyRegistrationPass: (nowMs?: number) => ArcCoreInstanceMissionDailyPassResult;
}

function applyBoardState(
  set: (partial: Partial<BoardSlice>) => void,
  next: ArcCoreInstanceMissionBoardState,
): void {
  syncArcCoreInstanceMissionMaterializedCache(next.entries);
  set(next);
}

export const useArcCoreInstanceMissionBoardStore = create<ArcCoreInstanceMissionBoardStore>((set, get) => ({
  ...createEmptyArcCoreInstanceMissionBoard(),

  loadLocalArcCoreInstanceMissionBoard: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        syncArcCoreInstanceMissionMaterializedCache([]);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ArcCoreInstanceMissionBoardState>;
      const next: ArcCoreInstanceMissionBoardState = {
        entries: parsed.entries ?? [],
        lastRegistrationDayKeyKst: parsed.lastRegistrationDayKeyKst ?? null,
        cycleStartedAtMs: parsed.cycleStartedAtMs ?? Date.now(),
      };
      applyBoardState(set, next);
    } catch {
      syncArcCoreInstanceMissionMaterializedCache([]);
    }
  },

  persistArcCoreInstanceMissionBoard: async () => {
    const { entries, lastRegistrationDayKeyKst, cycleStartedAtMs } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ entries, lastRegistrationDayKeyKst, cycleStartedAtMs }),
    );
  },

  resetLocalArcCoreInstanceMissionBoard: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    applyBoardState(set, createEmptyArcCoreInstanceMissionBoard());
  },

  findBoardEntry: (instanceId) => {
    return get().entries.find((e) => e.instanceId === instanceId);
  },

  listBoardEntriesForPlanet: (planetId) => {
    return get().entries.filter(
      (e) => e.offerPlanetId === planetId && e.boardStatus !== 'cleared',
    );
  },

  markBoardEntryAccepted: (instanceId) => {
    const state = get();
    const entries = state.entries.map((e) =>
      e.instanceId === instanceId ? { ...e, boardStatus: 'accepted' as const } : e,
    );
    applyBoardState(set, { ...state, entries });
    void get().persistArcCoreInstanceMissionBoard();
  },

  markBoardEntryCleared: (instanceId) => {
    const state = get();
    const entries = state.entries.map((e) =>
      e.instanceId === instanceId ? { ...e, boardStatus: 'cleared' as const } : e,
    );
    applyBoardState(set, { ...state, entries });
    void get().persistArcCoreInstanceMissionBoard();
  },

  runDailyRegistrationPass: (nowMs = Date.now()) => {
    let state: ArcCoreInstanceMissionBoardState = {
      entries: get().entries,
      lastRegistrationDayKeyKst: get().lastRegistrationDayKeyKst,
      cycleStartedAtMs: get().cycleStartedAtMs,
    };

    let refreshed = false;
    if (shouldRefreshArcCoreInstanceMissionBoard(state, nowMs)) {
      state = refreshArcCoreInstanceMissionBoardState(state, nowMs);
      refreshed = true;
    }

    const dayKey = resolveArcCoreInstanceDayKeyKst(nowMs);
    const replenish = runArcCoreTavernInstanceBoardReplenishPass(state, nowMs);
    const next: ArcCoreInstanceMissionBoardState = {
      ...replenish.next,
      lastRegistrationDayKeyKst: dayKey,
    };

    applyBoardState(set, next);
    void get().persistArcCoreInstanceMissionBoard();

    return {
      ran: refreshed || replenish.added > 0,
      registered: replenish.added > 0,
      refreshed,
      instanceId: replenish.lastInstanceId,
      reason: replenish.added > 0 ? 'registered' : refreshed ? 'refreshed' : 'noop',
    };
  },
}));

/** ArcCore 경유 — 단일 행성 보드 보충(일일 배치·부트 동기화와 동일 로직). */
export function replenishArcCoreInstanceMissionBoardForPlanet(
  planetId: string,
  nowMs = Date.now(),
): number {
  const state = useArcCoreInstanceMissionBoardStore.getState();
  const { next, added } = ensurePlanetTavernInstanceBoard(
    {
      entries: state.entries,
      lastRegistrationDayKeyKst: state.lastRegistrationDayKeyKst,
      cycleStartedAtMs: state.cycleStartedAtMs,
    },
    planetId,
    nowMs,
  );
  if (added > 0) {
    syncArcCoreInstanceMissionMaterializedCache(next.entries);
    useArcCoreInstanceMissionBoardStore.setState(next);
    void state.persistArcCoreInstanceMissionBoard();
  }
  return added;
}
