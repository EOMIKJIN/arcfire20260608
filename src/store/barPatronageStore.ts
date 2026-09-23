// ============================================================
// 바 후원 — 세션·구매·인기도 집계 (계정 귀속)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  getDefaultBarDrink,
  getBarAttendantById,
  getBarDrinkById,
  resolveBarDrinkUnitPrice,
} from '../game/bar/patronage/barPatronageTables';
import { usePlayerStore } from './playerStore';

const STORAGE_KEY = 'arcfire_bar_patronage_v1';
/** 구 Tavern 키 — hydrate 시 1회 이전 후 삭제 */
const LEGACY_STORAGE_KEY = 'arcfire_tavern_patronage_v1';
const PERSIST_COALESCE_MS = 1500;
export const BAR_PATRONAGE_SPEND_LEDGER_CAP = 200;

export type BarPatronageSession = {
  planetId: string;
  attendantId: string;
  startedAtMs: number;
  endsAtMs: number;
  drinksPurchased: number;
  unlockedBundleTier: number;
  phase: 'active' | 'paused' | 'ended';
  lastDrinkId: string;
};

export type BarPatronageSpendEvent = {
  atMs: number;
  planetId: string;
  attendantId: string;
  drinkId: string;
  qty: number;
  unitPrice: number;
  totalCredits: number;
};

type CreditMap = Record<string, number>;

type BarPatronageState = {
  loaded: boolean;
  activeSession: BarPatronageSession | null;
  /** attendantId → 해당 종업원에게 쓴 크레딧 합 (인기도) */
  popularityByAttendantId: CreditMap;
  /** attendantId → 누적 잔수 */
  drinksBoughtByAttendantId: CreditMap;
  spendByPlanetId: CreditMap;
  totalPatronageSpendCredits: number;
  spendLedger: BarPatronageSpendEvent[];
  loadLocal: () => Promise<void>;
  persist: () => Promise<void>;
  resetLocal: () => Promise<void>;
  startOrExtendSession: (params: {
    planetId: string;
    attendantId: string;
    drinkId?: string;
    /** 한 번에 살 잔 수 (기본 1) */
    drinkCount?: number;
  }) => { ok: true; session: BarPatronageSession } | { ok: false; reason: string };
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  /** 만료·ended 좀비 세션을 persist에서 제거. 만료 시 true. */
  expireSessionIfNeeded: (nowMs?: number) => boolean;
  remainingMs: (nowMs?: number) => number;
};

/** 현재 행성에서 지불·유효한 후원 세션인지 (Show 탭·resume 게이트). */
export function isLivePaidPatronageSession(
  session: BarPatronageSession | null | undefined,
  planetId: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!session || !planetId) return false;
  if (session.phase === 'ended') return false;
  if (session.planetId !== planetId) return false;
  return session.endsAtMs > nowMs;
}

function noteBarPatronageExpireWatch(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isBarPatronageExpireWatchBusy, scheduleBarPatronageExpireWatch } =
      require('../game/bar/patronage/barPatronageExpireRealtimeWatch') as typeof import('../game/bar/patronage/barPatronageExpireRealtimeWatch');
    if (isBarPatronageExpireWatchBusy()) return;
    scheduleBarPatronageExpireWatch();
  } catch {
    /* 워치 미기동 */
  }
}

function clearBarPatronageExpireWatchSafe(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { clearBarPatronageExpireWatch } =
      require('../game/bar/patronage/barPatronageExpireRealtimeWatch') as typeof import('../game/bar/patronage/barPatronageExpireRealtimeWatch');
    clearBarPatronageExpireWatch();
  } catch {
    /* 워치 미기동 */
  }
}

type PersistSnap = {
  activeSession: BarPatronageSession | null;
  popularityByAttendantId: CreditMap;
  drinksBoughtByAttendantId: CreditMap;
  spendByPlanetId: CreditMap;
  totalPatronageSpendCredits: number;
  spendLedger: BarPatronageSpendEvent[];
};

const EMPTY_SNAP: PersistSnap = {
  activeSession: null,
  popularityByAttendantId: {},
  drinksBoughtByAttendantId: {},
  spendByPlanetId: {},
  totalPatronageSpendCredits: 0,
  spendLedger: [],
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(run: () => void): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    run();
  }, PERSIST_COALESCE_MS);
}

function copyCreditMap(raw: unknown): CreditMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: CreditMap = {};
  for (const [k, v] of Object.entries(raw as CreditMap)) {
    const id = String(k ?? '').trim();
    const n = Math.max(0, Math.floor(Number(v) || 0));
    if (id && n > 0) out[id] = n;
  }
  return out;
}

function sanitizeLedger(raw: unknown): BarPatronageSpendEvent[] {
  if (!Array.isArray(raw)) return [];
  const start = Math.max(0, raw.length - BAR_PATRONAGE_SPEND_LEDGER_CAP);
  const out: BarPatronageSpendEvent[] = [];
  for (let i = start; i < raw.length; i++) {
    const e = raw[i] as Partial<BarPatronageSpendEvent> | null;
    if (!e || typeof e !== 'object') continue;
    const qty = Math.max(1, Math.floor(Number(e.qty) || 1));
    const unitPrice = Math.max(0, Math.floor(Number(e.unitPrice) || 0));
    const planetId = String(e.planetId ?? '').trim();
    const attendantId = String(e.attendantId ?? '').trim();
    const drinkId = String(e.drinkId ?? '').trim();
    if (!planetId || !attendantId || !drinkId) continue;
    out.push({
      atMs: Math.max(0, Math.floor(Number(e.atMs) || 0)),
      planetId,
      attendantId,
      drinkId,
      qty,
      unitPrice,
      totalCredits: Math.max(0, Math.floor(Number(e.totalCredits) || unitPrice * qty)),
    });
  }
  return out;
}

function appendSpendLedger(
  prev: BarPatronageSpendEvent[],
  ev: BarPatronageSpendEvent,
): BarPatronageSpendEvent[] {
  const keepFrom =
    prev.length >= BAR_PATRONAGE_SPEND_LEDGER_CAP
      ? prev.length - BAR_PATRONAGE_SPEND_LEDGER_CAP + 1
      : 0;
  const next = prev.slice(keepFrom);
  next.push(ev);
  return next;
}

function bumpCredit(map: CreditMap, key: string, delta: number): CreditMap {
  const id = String(key ?? '').trim();
  const add = Math.max(0, Math.floor(delta));
  if (!id || add <= 0) return map;
  const next = { ...map };
  next[id] = (next[id] ?? 0) + add;
  return next;
}

function migrateLoad(parsed: {
  activeSession?: BarPatronageSession | null;
  popularityByAttendantId?: CreditMap;
  drinksBoughtByAttendantId?: CreditMap;
  affinityByAttendantId?: CreditMap;
  spendByPlanetId?: CreditMap;
  totalPatronageSpendCredits?: number;
  spendLedger?: unknown;
}): PersistSnap {
  let drinksBought = copyCreditMap(parsed.drinksBoughtByAttendantId);
  if (Object.keys(drinksBought).length === 0) {
    drinksBought = copyCreditMap(parsed.affinityByAttendantId);
  }
  return {
    activeSession: parsed.activeSession ?? null,
    popularityByAttendantId: copyCreditMap(parsed.popularityByAttendantId),
    drinksBoughtByAttendantId: drinksBought,
    spendByPlanetId: copyCreditMap(parsed.spendByPlanetId),
    totalPatronageSpendCredits: Math.max(
      0,
      Math.floor(Number(parsed.totalPatronageSpendCredits) || 0),
    ),
    spendLedger: sanitizeLedger(parsed.spendLedger),
  };
}

function snapshotFromState(s: BarPatronageState): PersistSnap {
  return {
    activeSession: s.activeSession,
    popularityByAttendantId: s.popularityByAttendantId,
    drinksBoughtByAttendantId: s.drinksBoughtByAttendantId,
    spendByPlanetId: s.spendByPlanetId,
    totalPatronageSpendCredits: s.totalPatronageSpendCredits,
    spendLedger: s.spendLedger,
  };
}

export const useBarPatronageStore = create<BarPatronageState>((set, get) => ({
  loaded: false,
  ...EMPTY_SNAP,

  loadLocal: async () => {
    try {
      let raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          raw = legacy;
          try {
            await AsyncStorage.setItem(STORAGE_KEY, legacy);
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {
            /* migrate best-effort */
          }
        }
      }
      if (!raw) {
        set({ loaded: true, ...EMPTY_SNAP });
        return;
      }
      const parsed = JSON.parse(raw) as Parameters<typeof migrateLoad>[0];
      const migrated = migrateLoad(parsed);
      let session = migrated.activeSession;
      if (session && session.phase === 'active' && session.endsAtMs <= Date.now()) {
        session = { ...session, phase: 'ended' };
      }
      set({
        loaded: true,
        ...migrated,
        activeSession: session && session.phase !== 'ended' ? session : null,
      });
      get().expireSessionIfNeeded();
      noteBarPatronageExpireWatch();
    } catch {
      set({ loaded: true, ...EMPTY_SNAP });
    }
  },

  persist: async () => {
    const snap = snapshotFromState(get());
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      /* ignore */
    }
  },

  resetLocal: async () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    clearBarPatronageExpireWatchSafe();
    set({ ...EMPTY_SNAP, loaded: true });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },

  startOrExtendSession: ({ planetId, attendantId, drinkId, drinkCount }) => {
    const attendant = getBarAttendantById(attendantId);
    if (!attendant) return { ok: false, reason: 'unknown_attendant' };
    const drink = drinkId ? getBarDrinkById(drinkId) : getDefaultBarDrink();
    if (!drink) return { ok: false, reason: 'unknown_drink' };
    const qty = Math.max(1, Math.floor(Number(drinkCount) || 1));
    const prev = get().activeSession;
    const same =
      prev &&
      prev.phase !== 'ended' &&
      prev.planetId === planetId &&
      prev.attendantId === attendantId;

    const already = same ? prev.drinksPurchased : 0;
    const unitPrice = resolveBarDrinkUnitPrice(planetId, drink.drinkId);
    const totalCost = unitPrice * qty;
    const spent = usePlayerStore.getState().spendCredits(totalCost);
    if (!spent) return { ok: false, reason: 'insufficient_credits' };
    void usePlayerStore.getState().persist();

    const now = Date.now();
    const durationMs = Math.max(60_000, drink.durationSec * 1000) * qty;
    const nextDrinks = already + qty;
    const baseEnd = same && prev.endsAtMs > now ? prev.endsAtMs : now;
    const session: BarPatronageSession = {
      planetId,
      attendantId,
      startedAtMs: same ? prev.startedAtMs : now,
      endsAtMs: baseEnd + durationMs,
      drinksPurchased: nextDrinks,
      unlockedBundleTier: Math.max(
        same ? prev.unlockedBundleTier : 0,
        drink.unlockBundleTier,
        nextDrinks,
      ),
      phase: 'active',
      lastDrinkId: drink.drinkId,
    };

    const cur = get();
    set({
      activeSession: session,
      popularityByAttendantId: bumpCredit(cur.popularityByAttendantId, attendantId, totalCost),
      drinksBoughtByAttendantId: bumpCredit(cur.drinksBoughtByAttendantId, attendantId, qty),
      spendByPlanetId: bumpCredit(cur.spendByPlanetId, planetId, totalCost),
      totalPatronageSpendCredits: cur.totalPatronageSpendCredits + totalCost,
      spendLedger: appendSpendLedger(cur.spendLedger, {
        atMs: now,
        planetId,
        attendantId,
        drinkId: drink.drinkId,
        qty,
        unitPrice,
        totalCredits: totalCost,
      }),
    });
    schedulePersist(() => {
      void get().persist();
    });
    noteBarPatronageExpireWatch();
    return { ok: true, session };
  },

  pauseSession: () => {
    const s = get().activeSession;
    if (!s || s.phase !== 'active') return;
    set({ activeSession: { ...s, phase: 'paused' } });
    schedulePersist(() => {
      void get().persist();
    });
  },

  resumeSession: () => {
    const s = get().activeSession;
    if (!s || s.phase !== 'paused') return;
    if (s.endsAtMs <= Date.now()) {
      set({ activeSession: { ...s, phase: 'ended' } });
    } else {
      set({ activeSession: { ...s, phase: 'active' } });
    }
    schedulePersist(() => {
      void get().persist();
    });
    noteBarPatronageExpireWatch();
  },

  endSession: () => {
    const s = get().activeSession;
    if (!s) return;
    set({ activeSession: null });
    schedulePersist(() => {
      void get().persist();
    });
    clearBarPatronageExpireWatchSafe();
  },

  expireSessionIfNeeded: (nowMs = Date.now()) => {
    const s = get().activeSession;
    if (!s) return false;
    if (s.phase !== 'ended' && s.endsAtMs > nowMs) return false;
    set({ activeSession: null });
    schedulePersist(() => {
      void get().persist();
    });
    noteBarPatronageExpireWatch();
    return true;
  },

  remainingMs: (nowMs = Date.now()) => {
    const s = get().activeSession;
    if (!s || s.phase === 'ended') return 0;
    return Math.max(0, s.endsAtMs - nowMs);
  },
}));
