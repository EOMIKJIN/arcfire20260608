import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import type { NpcCaptainProgress } from '../types';
import { getNpcCaptain } from '../npc/npcFleetRegistry';

const STORAGE_KEY = 'arcfire_npc_captain_progress_v1';

/** persist 게이트 — UI 구독 없이 모듈 플래그만. 틱 경로 set 유발 금지. */
let captainProgressDirty = false;

const CAPTAIN_BATTLE_BASE_EXP = 12;
const CAPTAIN_WIN_BONUS_EXP = 8;
const CAPTAIN_KILL_EXP = 22;
/** 영토 패스 BLUE/RED 함락(독립국 침공 포함). 전투 12/8/22와 분리. */
const CAPTAIN_OCCUPATION_CAPTURE_EXP = 80;

function captainExpToNext(level: number, curve: { base: number; linear: number; quadratic: number }): number {
  const lv = Math.max(1, Math.floor(level));
  return curve.base + lv * curve.linear + lv * lv * curve.quadratic;
}

function getCaptainProgressionSeed(captainId: string): {
  initialLevel: number;
  initialExp: number;
  expCurveBase: number;
  expCurveLinear: number;
  expCurveQuadratic: number;
} {
  const captain = getNpcCaptain(captainId);
  return {
    initialLevel: Math.max(1, captain?.progression.initialLevel ?? 1),
    initialExp: Math.max(0, captain?.progression.initialExp ?? 0),
    expCurveBase: Math.max(1, captain?.progression.expCurveBase ?? 80),
    expCurveLinear: Math.max(0, captain?.progression.expCurveLinear ?? 35),
    expCurveQuadratic: Math.max(0, captain?.progression.expCurveQuadratic ?? 12),
  };
}

function createCaptainProgress(captainId: string): NpcCaptainProgress {
  const seed = getCaptainProgressionSeed(captainId);
  const curve = {
    base: seed.expCurveBase,
    linear: seed.expCurveLinear,
    quadratic: seed.expCurveQuadratic,
  };
  const level = seed.initialLevel;
  const nextReq = captainExpToNext(level, curve);
  const exp = Math.min(seed.initialExp, Math.max(0, nextReq - 1));
  return {
    captainId,
    level,
    exp,
    expToNext: nextReq,
    totalExp: exp,
    battleCount: 0,
    winCount: 0,
    killCount: 0,
    updatedAt: Date.now(),
  };
}

function applyExp(record: NpcCaptainProgress, expDelta: number): NpcCaptainProgress {
  const seed = getCaptainProgressionSeed(record.captainId);
  const curve = {
    base: seed.expCurveBase,
    linear: seed.expCurveLinear,
    quadratic: seed.expCurveQuadratic,
  };
  let level = record.level;
  let exp = record.exp + Math.max(0, Math.floor(expDelta));
  while (exp >= captainExpToNext(level, curve)) {
    exp -= captainExpToNext(level, curve);
    level += 1;
  }
  return {
    ...record,
    level,
    exp,
    expToNext: captainExpToNext(level, curve),
    totalExp: record.totalExp + Math.max(0, Math.floor(expDelta)),
    updatedAt: Date.now(),
  };
}

type CaptainDelta = {
  exp?: number;
  battleCount?: number;
  winCount?: number;
  killCount?: number;
};

interface NpcCaptainProgressState {
  records: Record<string, NpcCaptainProgress>;
  hydrated: boolean;
  loadLocalNpcCaptainProgress: () => Promise<void>;
  persistNpcCaptainProgress: () => Promise<void>;
  resetLocalNpcCaptainProgress: () => Promise<void>;
  /** 신규 레코드가 생겼으면 true — persist는 dirty일 때만 디스크에 쓴다. */
  ensureCaptainsRegistered: (captainIds: readonly string[]) => boolean;
  grantCaptainDelta: (captainId: string, delta: CaptainDelta) => void;
  grantBattleWaveResult: (
    participantCaptainIds: readonly string[],
    winnerCaptainIds: readonly string[],
  ) => void;
  getCaptainProgress: (captainId: string) => NpcCaptainProgress | undefined;
}

export const useNpcCaptainProgressStore = create<NpcCaptainProgressState>((set, get) => ({
  records: {},
  hydrated: false,

  loadLocalNpcCaptainProgress: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { records?: Record<string, NpcCaptainProgress> };
      if (!parsed.records || typeof parsed.records !== 'object') return;
      set({ records: parsed.records });
      captainProgressDirty = false;
    } finally {
      set({ hydrated: true });
    }
  },

  persistNpcCaptainProgress: async () => {
    if (!captainProgressDirty) return;
    const { records } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ records }));
    captainProgressDirty = false;
    scheduleUserCloudSync();
  },

  resetLocalNpcCaptainProgress: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    captainProgressDirty = false;
    set({ records: {}, hydrated: true });
  },

  ensureCaptainsRegistered: (captainIds) => {
    if (captainIds.length === 0) return false;
    const next = { ...get().records };
    let dirty = false;
    for (const id of captainIds) {
      if (!id) continue;
      if (!next[id]) {
        next[id] = createCaptainProgress(id);
        dirty = true;
      }
    }
    if (dirty) {
      captainProgressDirty = true;
      set({ records: next });
    }
    return dirty;
  },

  grantCaptainDelta: (captainId, delta) => {
    if (!captainId) return;
    const prev = get().records[captainId] ?? createCaptainProgress(captainId);
    let next = applyExp(prev, delta.exp ?? 0);
    next = {
      ...next,
      battleCount: next.battleCount + Math.max(0, delta.battleCount ?? 0),
      winCount: next.winCount + Math.max(0, delta.winCount ?? 0),
      killCount: next.killCount + Math.max(0, delta.killCount ?? 0),
      updatedAt: Date.now(),
    };
    captainProgressDirty = true;
    set({ records: { ...get().records, [captainId]: next } });
  },

  grantBattleWaveResult: (participantCaptainIds, winnerCaptainIds) => {
    const uniqueParticipants = Array.from(new Set(participantCaptainIds.filter(Boolean)));
    if (uniqueParticipants.length === 0) return;
    const winnerSet = new Set(winnerCaptainIds.filter(Boolean));
    const next = { ...get().records };
    for (const captainId of uniqueParticipants) {
      const prev = next[captainId] ?? createCaptainProgress(captainId);
      const exp = CAPTAIN_BATTLE_BASE_EXP + (winnerSet.has(captainId) ? CAPTAIN_WIN_BONUS_EXP : 0);
      const afterExp = applyExp(prev, exp);
      next[captainId] = {
        ...afterExp,
        battleCount: afterExp.battleCount + 1,
        winCount: afterExp.winCount + (winnerSet.has(captainId) ? 1 : 0),
      };
    }
    captainProgressDirty = true;
    set({ records: next });
  },

  getCaptainProgress: (captainId) => get().records[captainId],
}));

export const NPC_CAPTAIN_PROGRESS_EXP = {
  battleBase: CAPTAIN_BATTLE_BASE_EXP,
  winBonus: CAPTAIN_WIN_BONUS_EXP,
  kill: CAPTAIN_KILL_EXP,
  occupationCapture: CAPTAIN_OCCUPATION_CAPTURE_EXP,
} as const;
