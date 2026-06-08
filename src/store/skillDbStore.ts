import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';

const STORAGE_KEY = 'arcfire_skill_db_v1';

export interface SkillAcquireEvent {
  id: string;
  uid: string;
  skillId: string;
  playerLevelAtAcquire: number;
  source: 'level_up' | 'manual_learn' | 'mission_reward' | 'unknown';
  createdAt: number;
}

export interface AccountSkillDbRecord {
  uid: string;
  ownedSkillIds: string[];
  totalLearnedCount: number;
  acquiredEvents: SkillAcquireEvent[];
  updatedAt: number;
  ext: Record<string, unknown>;
}

interface SkillDbState {
  skillDbsByUid: Record<string, AccountSkillDbRecord>;
  hydrated: boolean;
  loadLocalSkillDb: () => Promise<void>;
  persistSkillDb: () => Promise<void>;
  resetLocalSkillDb: () => Promise<void>;
  ensureSkillDb: (uid: string) => void;
  purgeAccountSkillDb: (uid: string) => void;
  syncOwnedSkills: (params: {
    uid: string;
    ownedSkillIds: string[];
    playerLevel: number;
    source?: SkillAcquireEvent['source'];
    at?: number;
  }) => void;
}

function createSkillDb(uid: string, now: number): AccountSkillDbRecord {
  return {
    uid,
    ownedSkillIds: [],
    totalLearnedCount: 0,
    acquiredEvents: [],
    updatedAt: now,
    ext: {},
  };
}

function makeEventId(now: number, uid: string, skillId: string): string {
  return `${now}:${uid}:${skillId}:${Math.floor(Math.random() * 1_000_000)}`;
}

const EVENT_HISTORY_LIMIT = 300;

export const useSkillDbStore = create<SkillDbState>((set, get) => ({
  skillDbsByUid: {},
  hydrated: false,

  loadLocalSkillDb: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Pick<SkillDbState, 'skillDbsByUid'>;
      if (!parsed || typeof parsed !== 'object') return;
      set({ skillDbsByUid: parsed.skillDbsByUid ?? {} });
    } finally {
      set({ hydrated: true });
    }
  },

  persistSkillDb: async () => {
    const { skillDbsByUid } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ skillDbsByUid }));
    scheduleUserCloudSync();
  },

  resetLocalSkillDb: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ skillDbsByUid: {}, hydrated: true });
  },

  ensureSkillDb: (uid) => {
    if (!uid) return;
    const state = get();
    if (state.skillDbsByUid[uid]) return;
    const now = Date.now();
    set({
      skillDbsByUid: {
        ...state.skillDbsByUid,
        [uid]: createSkillDb(uid, now),
      },
    });
  },
  purgeAccountSkillDb: (uid) => {
    if (!uid) return;
    const state = get();
    if (!state.skillDbsByUid[uid]) return;
    const next = { ...state.skillDbsByUid };
    delete next[uid];
    set({ skillDbsByUid: next });
  },

  syncOwnedSkills: ({ uid, ownedSkillIds, playerLevel, source = 'unknown', at }) => {
    if (!uid) return;
    const now = at ?? Date.now();
    const state = get();
    const prev = state.skillDbsByUid[uid] ?? createSkillDb(uid, now);
    const prevSet = new Set(prev.ownedSkillIds);
    const nextSet = new Set(ownedSkillIds);

    const newlyAcquired = ownedSkillIds.filter((id) => id && !prevSet.has(id));
    const events = [
      ...newlyAcquired.map<SkillAcquireEvent>((skillId) => ({
        id: makeEventId(now, uid, skillId),
        uid,
        skillId,
        playerLevelAtAcquire: playerLevel,
        source,
        createdAt: now,
      })),
      ...prev.acquiredEvents,
    ].slice(0, EVENT_HISTORY_LIMIT);

    set({
      skillDbsByUid: {
        ...state.skillDbsByUid,
        [uid]: {
          ...prev,
          ownedSkillIds: Array.from(nextSet),
          totalLearnedCount: nextSet.size,
          acquiredEvents: events,
          updatedAt: now,
        },
      },
    });
  },
}));
