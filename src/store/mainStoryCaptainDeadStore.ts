// ============================================================
// 메인스토리 주요 함장 — 영구 사망 원장 (계정 귀속)
// 정본 설계: docs/NPC_CAPTAIN_PERMANENT_DEATH_DESIGN.md v0.2
// CSV deathEligible/deathClass = 자격 · 본 스토어 = 플레이 결과
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { MainStoryCaptainDeathCause } from '../types';

export const MAIN_STORY_CAPTAIN_DEAD_STORAGE_KEY = 'arcfire_main_story_captain_dead_v1';

export type MainStoryCaptainDeadEntry = {
  captainId: string;
  deadAtMs: number;
  cause: MainStoryCaptainDeathCause;
};

type PersistedV1 = {
  v: 1;
  entries: MainStoryCaptainDeadEntry[];
};

type MainStoryCaptainDeadState = {
  /** O(1) 조회용 — persist 배열과 동기 */
  deadIdSet: ReadonlySet<string>;
  entriesById: Readonly<Record<string, MainStoryCaptainDeadEntry>>;
  loaded: boolean;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  isDead: (captainId: string) => boolean;
  getEntry: (captainId: string) => MainStoryCaptainDeadEntry | undefined;
  /** 이미 사망이면 false · 신규 mark면 true */
  markDead: (captainId: string, cause: MainStoryCaptainDeathCause) => boolean;
  resetLocal: () => Promise<void>;
};

function buildSet(entries: Record<string, MainStoryCaptainDeadEntry>): Set<string> {
  return new Set(Object.keys(entries));
}

function parsePersisted(raw: string): Record<string, MainStoryCaptainDeadEntry> {
  const parsed = JSON.parse(raw) as unknown;
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as PersistedV1).entries)
      ? (parsed as PersistedV1).entries
      : [];
  const out: Record<string, MainStoryCaptainDeadEntry> = {};
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<MainStoryCaptainDeadEntry>;
    const id = String(row.captainId ?? '').trim();
    if (!id) continue;
    const cause: MainStoryCaptainDeathCause =
      row.cause === 'story_script' ? 'story_script' : 'story_combat';
    const deadAtMs =
      typeof row.deadAtMs === 'number' && Number.isFinite(row.deadAtMs)
        ? row.deadAtMs
        : Date.now();
    out[id] = { captainId: id, deadAtMs, cause };
  }
  return out;
}

export const useMainStoryCaptainDeadStore = create<MainStoryCaptainDeadState>((set, get) => ({
  deadIdSet: new Set(),
  entriesById: {},
  loaded: false,

  loadLocal: async () => {
    try {
      const raw = await AsyncStorage.getItem(MAIN_STORY_CAPTAIN_DEAD_STORAGE_KEY);
      if (!raw) {
        set({ deadIdSet: new Set(), entriesById: {}, loaded: true });
        return;
      }
      const entriesById = parsePersisted(raw);
      set({ entriesById, deadIdSet: buildSet(entriesById), loaded: true });
    } catch {
      set({ deadIdSet: new Set(), entriesById: {}, loaded: true });
    }
  },

  persistLocal: async () => {
    const entries = Object.values(get().entriesById);
    const payload: PersistedV1 = { v: 1, entries };
    await AsyncStorage.setItem(MAIN_STORY_CAPTAIN_DEAD_STORAGE_KEY, JSON.stringify(payload));
  },

  isDead: (captainId) => {
    const id = String(captainId ?? '').trim();
    if (!id) return false;
    return get().deadIdSet.has(id);
  },

  getEntry: (captainId) => {
    const id = String(captainId ?? '').trim();
    if (!id) return undefined;
    return get().entriesById[id];
  },

  markDead: (captainId, cause) => {
    const id = String(captainId ?? '').trim();
    if (!id) return false;
    if (get().deadIdSet.has(id)) return false;
    const entry: MainStoryCaptainDeadEntry = {
      captainId: id,
      deadAtMs: Date.now(),
      cause: cause === 'story_script' ? 'story_script' : 'story_combat',
    };
    const entriesById = { ...get().entriesById, [id]: entry };
    set({ entriesById, deadIdSet: buildSet(entriesById) });
    return true;
  },

  resetLocal: async () => {
    set({ deadIdSet: new Set(), entriesById: {}, loaded: true });
    await AsyncStorage.removeItem(MAIN_STORY_CAPTAIN_DEAD_STORAGE_KEY);
  },
}));
