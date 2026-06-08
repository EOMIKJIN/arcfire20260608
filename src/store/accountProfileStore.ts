import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Platform } from 'react-native';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import type { Player, PlayerShip } from '../types';
import type { UserSessionDbRecord } from './userSessionStore';

const STORAGE_KEY = 'arcfire_account_profile_v1';

export interface AccountActivitySnapshot {
  loginCount: number;
  firstSeenAt: number | null;
  lastLoginAt: number | null;
  totalForegroundMs: number;
}

export interface AccountProgressionSnapshot {
  level: number;
  exp: number;
  expToNext: number;
  skillPoints: number;
  skillsOwnedCount: number;
  shipCount: number;
  credits: number;
  /** 액티브 함선 10슬롯 중 장착된 슬롯 수 — 계정 요약용(정본은 `player.ship.equipSlots` + `arcfire_player_v1`) */
  shipEquippedSlotCount: number;
}

export interface AccountProfileRecord {
  uid: string;
  nicknameSnapshot: string | null;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
  activity: AccountActivitySnapshot;
  progression: AccountProgressionSnapshot;
  dbRefs: {
    itemDb: string;
    skillDb: string;
  };
  ext: Record<string, unknown>;
}

interface AccountProfileState {
  profilesByUid: Record<string, AccountProfileRecord>;
  hydrated: boolean;
  loadLocalAccountProfiles: () => Promise<void>;
  persistAccountProfiles: () => Promise<void>;
  resetLocalAccountProfiles: () => Promise<void>;
  ensureAccountProfile: (uid: string, nickname?: string | null) => void;
  purgeAccountProfile: (uid: string) => void;
  syncFromPlayerAndSession: (
    player: Player | null,
    session: UserSessionDbRecord | null,
  ) => void;
}

function resolveDeviceModel(): string {
  const constants = Platform.constants as { Model?: string; Brand?: string } | undefined;
  const model = constants?.Model;
  if (typeof model === 'string' && model.trim().length > 0) return model.trim();
  const brand = constants?.Brand;
  if (typeof brand === 'string' && brand.trim().length > 0) return `${brand.trim()} device`;
  return `${Platform.OS} device`;
}

function createEmptyProgression(): AccountProgressionSnapshot {
  return {
    level: 1,
    exp: 0,
    expToNext: 0,
    skillPoints: 0,
    skillsOwnedCount: 0,
    shipCount: 1,
    credits: 0,
    shipEquippedSlotCount: 0,
  };
}

function countFilledShipEquipSlots(equipSlots: PlayerShip['equipSlots']): number {
  if (!equipSlots) return 0;
  return Object.values(equipSlots).filter((v) => v && typeof v === 'object').length;
}

function createEmptyActivity(): AccountActivitySnapshot {
  return {
    loginCount: 0,
    firstSeenAt: null,
    lastLoginAt: null,
    totalForegroundMs: 0,
  };
}

function createRecord(uid: string, now: number, nickname?: string | null): AccountProfileRecord {
  const lastLogin = now;
  const createdAt = now;
  const deviceModel = resolveDeviceModel();
  return {
    uid,
    nicknameSnapshot: nickname ?? null,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: now,
    activity: createEmptyActivity(),
    progression: createEmptyProgression(),
    dbRefs: {
      itemDb: 'arcfire_item_ledger_v1',
      skillDb: 'arcfire_skill_db_v1',
    },
    ext: {
      createdAt,
      lastLogin,
      deviceModel,
    },
  };
}

export const useAccountProfileStore = create<AccountProfileState>((set, get) => ({
  profilesByUid: {},
  hydrated: false,

  loadLocalAccountProfiles: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Pick<AccountProfileState, 'profilesByUid'>;
      if (!parsed || typeof parsed !== 'object') return;
      const bag = parsed.profilesByUid ?? {};
      const next: Record<string, AccountProfileRecord> = {};
      for (const [uid, rec] of Object.entries(bag)) {
        if (!rec || typeof rec !== 'object') continue;
        const p = rec as AccountProfileRecord;
        next[uid] = {
          ...p,
          progression: {
            ...createEmptyProgression(),
            ...p.progression,
            shipEquippedSlotCount: p.progression?.shipEquippedSlotCount ?? 0,
          },
          ext: p.ext && typeof p.ext === 'object' ? p.ext : {},
        };
      }
      set({ profilesByUid: next });
    } finally {
      set({ hydrated: true });
    }
  },

  persistAccountProfiles: async () => {
    const { profilesByUid } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profilesByUid }));
    scheduleUserCloudSync();
  },

  resetLocalAccountProfiles: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ profilesByUid: {}, hydrated: true });
  },

  ensureAccountProfile: (uid, nickname) => {
    if (!uid) return;
    const now = Date.now();
    const state = get();
    const prev = state.profilesByUid[uid];
    if (prev) {
      const nextExt = { ...prev.ext };
      if (typeof nextExt.createdAt !== 'number') nextExt.createdAt = prev.createdAt;
      if (typeof nextExt.lastLogin !== 'number') nextExt.lastLogin = now;
      if (typeof nextExt.deviceModel !== 'string') nextExt.deviceModel = resolveDeviceModel();
      set({
        profilesByUid: {
          ...state.profilesByUid,
          [uid]: {
            ...prev,
            nicknameSnapshot: nickname ?? prev.nicknameSnapshot,
            updatedAt: now,
            ext: nextExt,
          },
        },
      });
      return;
    }
    set({
      profilesByUid: {
        ...state.profilesByUid,
        [uid]: createRecord(uid, now, nickname),
      },
    });
  },
  purgeAccountProfile: (uid) => {
    if (!uid) return;
    const state = get();
    if (!state.profilesByUid[uid]) return;
    const next = { ...state.profilesByUid };
    delete next[uid];
    set({ profilesByUid: next });
  },

  syncFromPlayerAndSession: (player, session) => {
    if (!player?.uid) return;
    const now = Date.now();
    const state = get();
    const prev = state.profilesByUid[player.uid] ?? createRecord(player.uid, now, player.nickname);
    const next: AccountProfileRecord = {
      ...prev,
      nicknameSnapshot: player.nickname ?? prev.nicknameSnapshot,
      updatedAt: now,
      lastSyncedAt: now,
      activity: {
        loginCount: session?.loginCount ?? prev.activity.loginCount,
        firstSeenAt: session?.firstSeenAt ?? prev.activity.firstSeenAt,
        lastLoginAt: session?.lastLoginAt ?? prev.activity.lastLoginAt,
        totalForegroundMs: session?.totalForegroundMs ?? prev.activity.totalForegroundMs,
      },
      progression: {
        level: player.level,
        exp: player.exp,
        expToNext: player.expToNext,
        skillPoints: player.skillPoints,
        skillsOwnedCount: player.skills.length,
        shipCount: 1 + (player.shipHangar?.length ?? 0),
        credits: player.credits,
        shipEquippedSlotCount: countFilledShipEquipSlots(player.ship.equipSlots),
      },
      ext: {
        ...prev.ext,
        createdAt: typeof prev.ext.createdAt === 'number' ? prev.ext.createdAt : prev.createdAt,
        lastLogin: session?.lastLoginAt ?? now,
        deviceModel: typeof prev.ext.deviceModel === 'string' ? prev.ext.deviceModel : resolveDeviceModel(),
      },
    };

    set({
      profilesByUid: {
        ...state.profilesByUid,
        [player.uid]: next,
      },
    });
  },
}));
