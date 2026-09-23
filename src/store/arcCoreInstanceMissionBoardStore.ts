import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  createEmptyArcCoreInstanceMissionBoard,
  dedupeArcCoreInstanceBoardEntries,
  ensurePlanetBarInstanceBoard,
  refreshArcCoreInstanceMissionBoardState,
  resolveArcCoreInstanceDayKeyKst,
  runArcCoreBarInstanceBoardReplenishPass,
  shouldRefreshArcCoreInstanceMissionBoard,
} from '../missions/arcCoreInstanceMissionGenerator';
import { syncArcCoreInstanceMissionMaterializedCache } from '../missions/arcCoreInstanceMissionResolver';
import type {
  ArcCoreInstanceMissionBoardEntry,
  ArcCoreInstanceMissionBoardState,
  ArcCoreInstanceMissionDailyPassResult,
} from '../missions/arcCoreInstanceMissionTypes';

const STORAGE_KEY = 'arcfire_arc_core_instance_missions_v1';

function persistBoard(state: ArcCoreInstanceMissionBoardState): void {
  void AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      entries: state.entries,
      lastRegistrationDayKeyKst: state.lastRegistrationDayKeyKst,
      cycleStartedAtMs: state.cycleStartedAtMs,
    }),
  );
}

type BoardSlice = ArcCoreInstanceMissionBoardState;

interface ArcCoreInstanceMissionBoardStore extends BoardSlice {
  /** persist 대상 아님 — 부트 로드 완료 여부. */
  hydrated: boolean;
  /** persist 파일에서 읽었으면 true. 초회 빈 보드는 false. */
  loadedFromStorage: boolean;
  loadLocalArcCoreInstanceMissionBoard: () => Promise<void>;
  persistArcCoreInstanceMissionBoard: () => Promise<void>;
  resetLocalArcCoreInstanceMissionBoard: () => Promise<void>;
  findBoardEntry: (instanceId: string) => ArcCoreInstanceMissionBoardEntry | undefined;
  listBoardEntriesForPlanet: (planetId: string) => ArcCoreInstanceMissionBoardEntry[];
  markBoardEntryAccepted: (instanceId: string) => void;
  /** 만료 재수락 — accepted만 listed로 되돌린다. */
  markBoardEntryListed: (instanceId: string) => void;
  markBoardEntryCleared: (instanceId: string) => void;
  runDailyRegistrationPass: (nowMs?: number) => ArcCoreInstanceMissionDailyPassResult;
}

function applyBoardState(
  set: (partial: Partial<BoardSlice>) => void,
  next: ArcCoreInstanceMissionBoardState,
): void {
  const entries = dedupeArcCoreInstanceBoardEntries(next.entries);
  const cleaned: ArcCoreInstanceMissionBoardState =
    entries === next.entries ? next : { ...next, entries };
  syncArcCoreInstanceMissionMaterializedCache(cleaned.entries);
  set(cleaned);
  if (entries !== next.entries) persistBoard(cleaned);
}

export const useArcCoreInstanceMissionBoardStore = create<ArcCoreInstanceMissionBoardStore>((set, get) => ({
  ...createEmptyArcCoreInstanceMissionBoard(),
  hydrated: false,
  loadedFromStorage: false,

  loadLocalArcCoreInstanceMissionBoard: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        applyBoardState(set, createEmptyArcCoreInstanceMissionBoard());
        set({ hydrated: true, loadedFromStorage: false });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ArcCoreInstanceMissionBoardState>;
      const next: ArcCoreInstanceMissionBoardState = {
        entries: parsed.entries ?? [],
        lastRegistrationDayKeyKst: parsed.lastRegistrationDayKeyKst ?? null,
        cycleStartedAtMs: parsed.cycleStartedAtMs ?? Date.now(),
      };
      applyBoardState(set, next);
      set({ hydrated: true, loadedFromStorage: true });
    } catch {
      applyBoardState(set, createEmptyArcCoreInstanceMissionBoard());
      set({ hydrated: true, loadedFromStorage: false });
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
    set({ hydrated: true, loadedFromStorage: false });
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

  markBoardEntryListed: (instanceId) => {
    const state = get();
    let changed = false;
    const entries = state.entries.map((e) => {
      if (e.instanceId !== instanceId || e.boardStatus !== 'accepted') return e;
      changed = true;
      return { ...e, boardStatus: 'listed' as const };
    });
    if (!changed) return;
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
      if (get().hydrated) {
        const keptIds = new Set<string>();
        for (let i = 0; i < state.entries.length; i += 1) {
          keptIds.add(state.entries[i]!.instanceId);
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useMissionStore } = require('./missionStore') as typeof import('./missionStore');
        useMissionStore.getState().pruneOrphanArcInstProgresses(keptIds);
      }
    }

    const dayKey = resolveArcCoreInstanceDayKeyKst(nowMs);
    const replenish = runArcCoreBarInstanceBoardReplenishPass(state, nowMs);
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
  const { next, added } = ensurePlanetBarInstanceBoard(
    {
      entries: state.entries,
      lastRegistrationDayKeyKst: state.lastRegistrationDayKeyKst,
      cycleStartedAtMs: state.cycleStartedAtMs,
    },
    planetId,
    nowMs,
  );
  const entries = dedupeArcCoreInstanceBoardEntries(next.entries);
  const cleaned = entries === next.entries ? next : { ...next, entries };
  syncArcCoreInstanceMissionMaterializedCache(cleaned.entries);
  if (added > 0 || next.entries.length !== state.entries.length) {
    useArcCoreInstanceMissionBoardStore.setState(cleaned);
    void useArcCoreInstanceMissionBoardStore.getState().persistArcCoreInstanceMissionBoard();
  }
  return added;
}

/** 돔 레벨업 후 보상 재계산 — persist 없이 materialized 캐시만. */
export function rematerializeArcCoreInstanceMissionBoard(): void {
  const { entries } = useArcCoreInstanceMissionBoardStore.getState();
  syncArcCoreInstanceMissionMaterializedCache(entries);
}
