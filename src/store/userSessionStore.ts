import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';

const STORAGE_KEY = 'arcfire_user_session_v1';

export interface UserSessionDbRecord {
  nicknameSnapshot: string | null;
  firstSeenAt: number;
  lastLoginAt: number;
  loginCount: number;
  totalForegroundMs: number;
  updatedAt: number;
}

interface UserSessionState {
  record: UserSessionDbRecord | null;
  hydrated: boolean;
  currentSessionStartedAt: number | null;
  loadLocalUserSession: () => Promise<void>;
  persistUserSession: () => Promise<void>;
  resetLocalUserSession: () => Promise<void>;
  recordAppLaunch: (nickname?: string | null) => void;
  resumeForegroundSession: () => void;
  finalizeForegroundSlice: () => void;
}

function createInitialSessionRecord(now: number, nickname?: string | null): UserSessionDbRecord {
  return {
    nicknameSnapshot: nickname ?? null,
    firstSeenAt: now,
    lastLoginAt: now,
    loginCount: 1,
    totalForegroundMs: 0,
    updatedAt: now,
  };
}

export const useUserSessionStore = create<UserSessionState>((set, get) => ({
  record: null,
  hydrated: false,
  currentSessionStartedAt: null,

  loadLocalUserSession: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as UserSessionDbRecord;
      if (!parsed || typeof parsed !== 'object') return;
      set({ record: parsed });
    } finally {
      set({ hydrated: true });
    }
  },

  persistUserSession: async () => {
    const { record } = get();
    if (!record) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    scheduleUserCloudSync();
  },

  resetLocalUserSession: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ record: null, hydrated: true, currentSessionStartedAt: null });
  },

  recordAppLaunch: (nickname) => {
    const now = Date.now();
    const prev = get().record;
    if (!prev) {
      set({
        record: createInitialSessionRecord(now, nickname),
        currentSessionStartedAt: now,
      });
      return;
    }
    set({
      record: {
        ...prev,
        nicknameSnapshot: nickname ?? prev.nicknameSnapshot,
        lastLoginAt: now,
        loginCount: prev.loginCount + 1,
        updatedAt: now,
      },
      currentSessionStartedAt: now,
    });
  },

  resumeForegroundSession: () => {
    const now = Date.now();
    const { record, currentSessionStartedAt } = get();
    if (!record) return;
    if (currentSessionStartedAt) return;
    set({
      currentSessionStartedAt: now,
      record: {
        ...record,
        updatedAt: now,
      },
    });
  },

  finalizeForegroundSlice: () => {
    const now = Date.now();
    const { record, currentSessionStartedAt } = get();
    if (!record || !currentSessionStartedAt) return;
    const elapsed = Math.max(0, now - currentSessionStartedAt);
    set({
      record: {
        ...record,
        totalForegroundMs: record.totalForegroundMs + elapsed,
        updatedAt: now,
      },
      currentSessionStartedAt: null,
    });
  },
}));
