// ============================================================
// Daily Ops 관측 큐 — 총독·비콘·체류 보정은 배치에서만 AABS 반영 (v3.1 Rule 14)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AabsMultiplierKey } from '../aabs/aabsConstants';
import { useAabsPolicyStore } from '../aabs/aabsPolicyStore';

const STORAGE_KEY = 'arcfire_daily_ops_observations_v1';

export type GovernorPolicyChoice = 'security' | 'free_trade' | 'tech_prospecting';

type GovernorObservation = {
  kind: 'governor_policy';
  choice: GovernorPolicyChoice;
  planetId: string;
  observedAt: number;
};

type ProsperityBeaconObservation = {
  kind: 'prosperity_beacon';
  planetId: string;
  observedAt: number;
};

type DwellCorrectionObservation = {
  kind: 'dwell_correction';
  alert: {
    bandId: string;
    playerLevel: number;
    dwellRatio: number;
    suggestReduceDifficulty: boolean;
  };
  observedAt: number;
};

export type DailyOpsObservation =
  | GovernorObservation
  | ProsperityBeaconObservation
  | DwellCorrectionObservation;

const POLICY_SHIFTS: Record<GovernorPolicyChoice, Partial<Record<AabsMultiplierKey, number>>> = {
  security: { expReward: 1.05, combatDifficulty: 1.05, tradeIncome: 0.98 },
  free_trade: { tradeIncome: 1.05, creditReward: 1.03, combatDifficulty: 0.98 },
  tech_prospecting: { dropWeight: 1.05, miningYield: 1.04, expReward: 1.02 },
};

let memoryQueue: DailyOpsObservation[] = [];
let hydratePromise: Promise<void> | null = null;
const MAX_DAILY_OPS_QUEUE = 200;
let persistQueueTimer: ReturnType<typeof setTimeout> | null = null;
const DAILY_OPS_PERSIST_COALESCE_MS = 1500;

function schedulePersistQueue(): void {
  if (persistQueueTimer) clearTimeout(persistQueueTimer);
  persistQueueTimer = setTimeout(() => {
    persistQueueTimer = null;
    void persistQueue();
  }, DAILY_OPS_PERSIST_COALESCE_MS);
}

async function ensureHydrated(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DailyOpsObservation[];
      if (Array.isArray(parsed)) memoryQueue = parsed;
    } catch {
      memoryQueue = [];
    }
  })();
  return hydratePromise;
}

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryQueue));
  } catch {
    /* ignore */
  }
}

export async function enqueueDailyOpsObservation(entry: DailyOpsObservation): Promise<void> {
  await ensureHydrated();
  memoryQueue.push(entry);
  if (memoryQueue.length > MAX_DAILY_OPS_QUEUE) {
    memoryQueue = memoryQueue.slice(-MAX_DAILY_OPS_QUEUE);
  }
  schedulePersistQueue();
}

export async function flushDailyOpsObservationsToAabs(): Promise<number> {
  await ensureHydrated();
  if (memoryQueue.length === 0) return 0;

  const store = useAabsPolicyStore.getState();
  if (store.safeModeEnabled) {
    memoryQueue = [];
    await persistQueue();
    return 0;
  }

  let applied = 0;
  for (const entry of memoryQueue) {
    if (entry.kind === 'governor_policy') {
      const shift = POLICY_SHIFTS[entry.choice];
      (Object.keys(shift) as AabsMultiplierKey[]).forEach((key) => {
        const target = shift[key];
        if (target != null) store.applyStepToward(key, target);
      });
      applied += 1;
    } else if (entry.kind === 'prosperity_beacon') {
      store.applyStepToward('miningYield', (store.multipliers.miningYield ?? 1) * 1.05);
      store.applyStepToward('dropWeight', (store.multipliers.dropWeight ?? 1) * 1.05);
      applied += 1;
    } else if (entry.kind === 'dwell_correction' && entry.alert.suggestReduceDifficulty) {
      store.applyStepToward('expReward', (store.multipliers.expReward ?? 1) * 1.03);
      store.applyStepToward('combatDifficulty', (store.multipliers.combatDifficulty ?? 1) * 0.97);
      applied += 1;
    }
  }

  memoryQueue = [];
  await persistQueue();
  if (applied > 0) await store.persistAsync();
  return applied;
}
