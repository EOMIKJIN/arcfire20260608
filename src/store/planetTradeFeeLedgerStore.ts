// ============================================================
// 행성 무역 수수료 일일 집계 — 플레이어 지갑 1일 1회 지급 풀
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { planetAttackKstDayKey } from '../arcCore/planetAttack/planetAttackKstDayKey';
import {
  computeConvoyTradeFeeBreakdown,
  computePlanetTradeFeeBreakdown,
} from '../arcCore/economy/planetUpkeepPolicy';

const STORAGE_KEY = 'arcfire_planet_trade_fee_ledger_v1';

export type PlanetTradeFeeBucket = {
  grossCredits: number;
  playerWalletPending: number;
  arcFeeCredits: number;
  /** @deprecated UI·감사용 — `convoyFeeCredits` 사용 */
  convoyGrossCredits: number;
  /** @deprecated UI·감사용 — `playerTradeFeeCredits` 사용 */
  playerTradeGrossCredits: number;
  /** 수송선단 거래 — 수수료율 적용 수수료 수익(금일) */
  convoyFeeCredits: number;
  /** 플레이어 거래 — 수수료율 적용 수수료 수익(금일) */
  playerTradeFeeCredits: number;
};

type PlanetTradeFeeLedgerState = {
  hydrated: boolean;
  kstDayKey: string;
  byPlanetId: Record<string, PlanetTradeFeeBucket>;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  ensureDay: (kstDayKey: string) => void;
  accumulate: (
    planetId: string,
    grossCredits: number,
    playerPoolShare: number,
    arcShare: number,
    source?: 'player' | 'convoy',
  ) => void;
  reverseAccumulate: (
    planetId: string,
    grossCredits: number,
    playerPoolShare: number,
    arcShare: number,
    source?: 'player' | 'convoy',
  ) => void;
  takePlayerWalletPendingForPlanets: (planetIds: string[]) => number;
  snapshotBuckets: () => Record<string, PlanetTradeFeeBucket>;
  getBucket: (planetId: string) => PlanetTradeFeeBucket;
};

function emptyBucket(): PlanetTradeFeeBucket {
  return {
    grossCredits: 0,
    playerWalletPending: 0,
    arcFeeCredits: 0,
    convoyGrossCredits: 0,
    playerTradeGrossCredits: 0,
    convoyFeeCredits: 0,
    playerTradeFeeCredits: 0,
  };
}

/** 행성 경제 UI·스냅샷 — 미집계 행성 폴백 */
export function emptyPlanetTradeFeeBucket(): PlanetTradeFeeBucket {
  return emptyBucket();
}

function parseBucket(raw: unknown): PlanetTradeFeeBucket {
  if (!raw || typeof raw !== 'object') return emptyBucket();
  const o = raw as Partial<PlanetTradeFeeBucket>;
  const convoyGross = Math.max(0, Math.floor(Number(o.convoyGrossCredits) || 0));
  const playerGross = Math.max(0, Math.floor(Number(o.playerTradeGrossCredits) || 0));
  const hasConvoyFee = Object.prototype.hasOwnProperty.call(o, 'convoyFeeCredits');
  const hasPlayerFee = Object.prototype.hasOwnProperty.call(o, 'playerTradeFeeCredits');
  const convoyFeeStored = Math.max(0, Math.floor(Number(o.convoyFeeCredits) || 0));
  const playerFeeStored = Math.max(0, Math.floor(Number(o.playerTradeFeeCredits) || 0));
  return {
    grossCredits: Math.max(0, Math.floor(Number(o.grossCredits) || 0)),
    playerWalletPending: Math.max(0, Math.floor(Number(o.playerWalletPending) || 0)),
    arcFeeCredits: Math.max(0, Math.floor(Number(o.arcFeeCredits) || 0)),
    convoyGrossCredits: convoyGross,
    playerTradeGrossCredits: playerGross,
    convoyFeeCredits: hasConvoyFee
      ? convoyFeeStored
      : convoyGross > 0
        ? computeConvoyTradeFeeBreakdown(convoyGross).totalFee
        : 0,
    playerTradeFeeCredits: hasPlayerFee
      ? playerFeeStored
      : playerGross > 0
        ? computePlanetTradeFeeBreakdown(playerGross).totalFee
        : 0,
  };
}

export const usePlanetTradeFeeLedgerStore = create<PlanetTradeFeeLedgerState>((set, get) => ({
  hydrated: false,
  kstDayKey: planetAttackKstDayKey(),
  byPlanetId: {},

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true, kstDayKey: planetAttackKstDayKey(), byPlanetId: {} });
        return;
      }
      const parsed = JSON.parse(raw) as {
        kstDayKey?: string;
        byPlanetId?: Record<string, unknown>;
      };
      const byPlanetId: Record<string, PlanetTradeFeeBucket> = {};
      const bag = parsed.byPlanetId ?? {};
      for (const [planetId, bucket] of Object.entries(bag)) {
        byPlanetId[planetId] = parseBucket(bucket);
      }
      set({
        hydrated: true,
        kstDayKey: parsed.kstDayKey ?? planetAttackKstDayKey(),
        byPlanetId,
      });
    } catch {
      set({ hydrated: true, kstDayKey: planetAttackKstDayKey(), byPlanetId: {} });
    }
  },

  persist: async () => {
    const { kstDayKey, byPlanetId } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ kstDayKey, byPlanetId }));
  },

  ensureDay: (kstDayKey) => {
    const state = get();
    if (state.kstDayKey === kstDayKey) return;
    set({ kstDayKey, byPlanetId: {} });
    void get().persist();
  },

  accumulate: (planetId, grossCredits, playerPoolShare, arcShare, source = 'player') => {
    if (!planetId) return;
    const dayKey = planetAttackKstDayKey();
    get().ensureDay(dayKey);
    const gross = Math.max(0, Math.floor(grossCredits));
    const playerAdd = Math.max(0, Math.floor(playerPoolShare));
    const arcAdd = Math.max(0, Math.floor(arcShare));
    const prev = get().byPlanetId[planetId] ?? emptyBucket();
    const convoyAdd = source === 'convoy' ? gross : 0;
    const playerGrossAdd = source === 'player' ? gross : 0;
    const feeAdd = playerAdd + arcAdd;
    const next = {
      ...get().byPlanetId,
      [planetId]: {
        grossCredits: prev.grossCredits + gross,
        playerWalletPending: prev.playerWalletPending + playerAdd,
        arcFeeCredits: prev.arcFeeCredits + arcAdd,
        convoyGrossCredits: prev.convoyGrossCredits + convoyAdd,
        playerTradeGrossCredits: prev.playerTradeGrossCredits + playerGrossAdd,
        convoyFeeCredits: prev.convoyFeeCredits + (source === 'convoy' ? feeAdd : 0),
        playerTradeFeeCredits: prev.playerTradeFeeCredits + (source === 'player' ? feeAdd : 0),
      },
    };
    set({ byPlanetId: next });
    void get().persist();
  },

  reverseAccumulate: (planetId, grossCredits, playerPoolShare, arcShare, source = 'player') => {
    if (!planetId) return;
    const prev = get().byPlanetId[planetId];
    if (!prev) return;
    const gross = Math.max(0, Math.floor(grossCredits));
    const playerSub = Math.max(0, Math.floor(playerPoolShare));
    const arcSub = Math.max(0, Math.floor(arcShare));
    const convoySub = source === 'convoy' ? gross : 0;
    const playerGrossSub = source === 'player' ? gross : 0;
    const feeSub = playerSub + arcSub;
    const nextBucket: PlanetTradeFeeBucket = {
      grossCredits: Math.max(0, prev.grossCredits - gross),
      playerWalletPending: Math.max(0, prev.playerWalletPending - playerSub),
      arcFeeCredits: Math.max(0, prev.arcFeeCredits - arcSub),
      convoyGrossCredits: Math.max(0, prev.convoyGrossCredits - convoySub),
      playerTradeGrossCredits: Math.max(0, prev.playerTradeGrossCredits - playerGrossSub),
      convoyFeeCredits: Math.max(0, prev.convoyFeeCredits - (source === 'convoy' ? feeSub : 0)),
      playerTradeFeeCredits: Math.max(
        0,
        prev.playerTradeFeeCredits - (source === 'player' ? feeSub : 0),
      ),
    };
    const next = { ...get().byPlanetId, [planetId]: nextBucket };
    set({ byPlanetId: next });
    void get().persist();
  },

  takePlayerWalletPendingForPlanets: (planetIds) => {
    let total = 0;
    const next = { ...get().byPlanetId };
    for (const planetId of planetIds) {
      const bucket = next[planetId];
      if (!bucket) continue;
      total += bucket.playerWalletPending;
      next[planetId] = { ...bucket, playerWalletPending: 0 };
    }
    if (total > 0) {
      set({ byPlanetId: next });
      void get().persist();
    }
    return total;
  },

  snapshotBuckets: () => ({ ...get().byPlanetId }),

  getBucket: (planetId: string) => get().byPlanetId[planetId] ?? emptyBucket(),
}));
