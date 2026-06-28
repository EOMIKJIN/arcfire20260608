// ============================================================
// ArcCore Learning Store — 일 1회 배치 KPI·ingest 이력 전용
// hot path publish·부트 hydrate·거래마다 persist 금지
// @see docs/ecosystem/ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArcCoreObservationEvent } from '../observation/arcCoreObservationTypes';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { EconomySimOverlayDelta_FROM_SIM } from '../../data/balance/generated/economySimOverlayDelta';

const STORAGE_KEY = 'arcfire_arc_core_learning_v1';
const MAX_OBSERVATIONS = 2000;
const MAX_KPI_TIMELINE = 120;
const MAX_SIM_RUNS = 32;
const MAX_POLICY_HISTORY = 64;

export type ArcCoreLearningKpiTimelineEntry = {
  dayKey: string;
  economy: {
    f2pWhaleRatio?: number;
    bandDrift?: number;
    planetsReconciled?: number;
    windowTradeGross?: number;
    windowConvoyTrips?: number;
    simKpiStatus?: string;
    deltaId?: string | null;
    fiscalMaxFeeUpkeepRatio?: number;
    fiscalGini?: number;
    fiscalOverall?: 'ok' | 'warn' | 'fail';
    fiscalWarnStreak?: number;
    fiscalFailPlanets?: number;
    fiscalTradeRouteAdjusted?: boolean;
  };
  combat: {
    avgEngageSec?: number;
    globalEngageHpMul?: number;
  };
  memory?: {
    pssFloorMb?: number;
  };
};

export type ArcCoreLearningSimRun = {
  runId: string;
  startedAt: number;
  finishedAt: number;
  kpi: Record<string, number>;
  deltaId: string | null;
};

export type ArcCoreLearningPolicyHistoryEntry = {
  packId: string;
  ingestedAt: number;
  source: 'local_sim' | 'firestore' | 'ci' | 'rtdb';
};

export type ArcCoreLearningStore = {
  schemaVersion: 1;
  observations: {
    tail: ArcCoreObservationEvent[];
    lastFlushDayKey: string | null;
  };
  simRuns: ArcCoreLearningSimRun[];
  kpiTimeline: ArcCoreLearningKpiTimelineEntry[];
  policyHistory: ArcCoreLearningPolicyHistoryEntry[];
  lastUpdatedAt: number;
};

function emptyStore(): ArcCoreLearningStore {
  return {
    schemaVersion: 1,
    observations: { tail: [], lastFlushDayKey: null },
    simRuns: [],
    kpiTimeline: [],
    policyHistory: [],
    lastUpdatedAt: 0,
  };
}

let memoryStore: ArcCoreLearningStore = emptyStore();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let persistPromise: Promise<void> | null = null;

function normalizeStore(raw: unknown): ArcCoreLearningStore {
  if (!raw || typeof raw !== 'object') return emptyStore();
  const o = raw as Partial<ArcCoreLearningStore>;
  if (o.schemaVersion !== 1) return emptyStore();
  const obs = o.observations;
  const tail = Array.isArray(obs?.tail) ? obs.tail.slice(-MAX_OBSERVATIONS) : [];
  return {
    schemaVersion: 1,
    observations: {
      tail,
      lastFlushDayKey:
        typeof obs?.lastFlushDayKey === 'string' ? obs.lastFlushDayKey : null,
    },
    simRuns: Array.isArray(o.simRuns) ? o.simRuns.slice(-MAX_SIM_RUNS) : [],
    kpiTimeline: Array.isArray(o.kpiTimeline) ? o.kpiTimeline.slice(-MAX_KPI_TIMELINE) : [],
    policyHistory: Array.isArray(o.policyHistory)
      ? o.policyHistory.slice(-MAX_POLICY_HISTORY)
      : [],
    lastUpdatedAt: typeof o.lastUpdatedAt === 'number' ? o.lastUpdatedAt : 0,
  };
}

async function persistStore(): Promise<void> {
  if (persistPromise) return persistPromise;
  persistPromise = (async () => {
    try {
      memoryStore.lastUpdatedAt = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch {
      /* ignore */
    } finally {
      persistPromise = null;
    }
  })();
  return persistPromise;
}

export async function hydrateArcCoreLearningStore(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) memoryStore = normalizeStore(JSON.parse(raw));
    } catch {
      memoryStore = emptyStore();
    }
    hydrated = true;
  })();
  return hydratePromise;
}

export function isArcCoreLearningStoreHydrated(): boolean {
  return hydrated;
}

export function getArcCoreLearningStoreSnapshot(): Readonly<ArcCoreLearningStore> {
  return memoryStore;
}

export function getArcCoreLearningObservationCount(): number {
  return memoryStore.observations.tail.length;
}

/** 번들 SIM KPI — learning store가 비어 있을 때 1회 시드(재빌드·초기화 불필요) */
export async function seedEconomyKpiBaselineIfEmpty(): Promise<boolean> {
  await hydrateArcCoreLearningStore();
  if (memoryStore.kpiTimeline.length > 0) return false;

  const kpi = EconomySimOverlayDelta_FROM_SIM.kpi;
  const dayKey = planetAttackKstDayKey();
  memoryStore.kpiTimeline.push({
    dayKey,
    economy: {
      f2pWhaleRatio: kpi?.whaleToF2pPowerRatio,
      simKpiStatus: kpi?.status,
      deltaId: EconomySimOverlayDelta_FROM_SIM.deltaId,
    },
    combat: {},
  });
  await persistStore();
  return true;
}

export async function appendObservationsToLearningStore(
  events: ArcCoreObservationEvent[],
): Promise<number> {
  if (events.length === 0) return 0;
  await hydrateArcCoreLearningStore();

  const merged = memoryStore.observations.tail.concat(events);
  memoryStore.observations.tail = merged.slice(-MAX_OBSERVATIONS);
  memoryStore.observations.lastFlushDayKey = planetAttackKstDayKey();
  await persistStore();
  return events.length;
}

export async function appendOrUpdateKpiTimeline(
  entry: ArcCoreLearningKpiTimelineEntry,
): Promise<void> {
  await hydrateArcCoreLearningStore();
  applyKpiTimelineEntryInMemory(entry);
  await persistStore();
}

function applyKpiTimelineEntryInMemory(entry: ArcCoreLearningKpiTimelineEntry): void {
  const idx = memoryStore.kpiTimeline.findIndex((e) => e.dayKey === entry.dayKey);
  if (idx >= 0) {
    const prev = memoryStore.kpiTimeline[idx];
    memoryStore.kpiTimeline[idx] = {
      dayKey: entry.dayKey,
      economy: { ...prev.economy, ...entry.economy },
      combat: { ...prev.combat, ...entry.combat },
      memory: entry.memory ?? prev.memory,
    };
  } else {
    memoryStore.kpiTimeline.push(entry);
    if (memoryStore.kpiTimeline.length > MAX_KPI_TIMELINE) {
      memoryStore.kpiTimeline = memoryStore.kpiTimeline.slice(-MAX_KPI_TIMELINE);
    }
  }
}

/** RTDB boot merge — tail 일괄 병합 후 persist 1회 */
export async function mergeKpiTimelineBatch(
  entries: ArcCoreLearningKpiTimelineEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;
  await hydrateArcCoreLearningStore();
  for (const entry of entries) {
    applyKpiTimelineEntryInMemory(entry);
  }
  await persistStore();
  return entries.length;
}

export async function appendPolicyHistoryEntry(
  entry: ArcCoreLearningPolicyHistoryEntry,
): Promise<void> {
  await hydrateArcCoreLearningStore();
  const appended = applyPolicyHistoryEntryInMemory(entry);
  if (appended) await persistStore();
}

function applyPolicyHistoryEntryInMemory(entry: ArcCoreLearningPolicyHistoryEntry): boolean {
  const dup = memoryStore.policyHistory.some((p) => p.packId === entry.packId);
  if (dup) return false;
  memoryStore.policyHistory.push(entry);
  if (memoryStore.policyHistory.length > MAX_POLICY_HISTORY) {
    memoryStore.policyHistory = memoryStore.policyHistory.slice(-MAX_POLICY_HISTORY);
  }
  return true;
}

/** RTDB boot — policyHistory + kpiTimeline 단일 persist */
export async function mergeRtdbLearningSnapshot(input: {
  kpiEntries: ArcCoreLearningKpiTimelineEntry[];
  policyEntry?: ArcCoreLearningPolicyHistoryEntry | null;
}): Promise<{ kpiMerged: number; policyAppended: boolean }> {
  await hydrateArcCoreLearningStore();
  for (const entry of input.kpiEntries) {
    applyKpiTimelineEntryInMemory(entry);
  }
  const policyAppended = input.policyEntry
    ? applyPolicyHistoryEntryInMemory(input.policyEntry)
    : false;
  if (input.kpiEntries.length > 0 || policyAppended) {
    await persistStore();
  }
  return { kpiMerged: input.kpiEntries.length, policyAppended };
}

export async function appendSimRunToLearningStore(run: ArcCoreLearningSimRun): Promise<void> {
  await hydrateArcCoreLearningStore();
  memoryStore.simRuns.push(run);
  if (memoryStore.simRuns.length > MAX_SIM_RUNS) {
    memoryStore.simRuns = memoryStore.simRuns.slice(-MAX_SIM_RUNS);
  }
  await persistStore();
}
