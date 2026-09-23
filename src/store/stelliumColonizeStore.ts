import { create } from 'zustand';
import type { StelliumColonizeRecord } from '../arcCore/colonize/stelliumColonizeTypes';
import { invalidatePlanetWorldObjectsListCache } from '../worldObjects/planetWorldObjectsListCacheRegistry';

export const STELLIUM_COLONIZE_STORAGE_KEY = 'arcfire_stellium_colonize_v1';
const PERSIST_COALESCE_MS = 1500;

type StelliumColonizeState = {
  hydrated: boolean;
  revision: number;
  byPlanetId: Record<string, StelliumColonizeRecord>;
  /** 유휴 개척선이 다시 출항 가능한 시각. 미초기화면 시드 */
  fleetReadyAtMs: number[] | null;
};

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      };
      getItem?: (key: string) => Promise<string | null>;
      setItem?: (key: string, value: string) => Promise<void>;
      removeItem?: (key: string) => Promise<void>;
    };
    const impl = mod.default ?? mod;
    if (typeof impl.getItem !== 'function' || typeof impl.setItem !== 'function') return null;
    return impl as {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is StelliumColonizeRecord {
  if (!v || typeof v !== 'object') return false;
  const r = v as StelliumColonizeRecord;
  return typeof r.planetId === 'string' && typeof r.systemId === 'string' && typeof r.phase === 'string';
}

function normalizePayload(raw: unknown): Record<string, StelliumColonizeRecord> {
  const src = raw && typeof raw === 'object' && 'byPlanetId' in raw
    ? (raw as { byPlanetId: Record<string, unknown> }).byPlanetId
    : raw;
  if (!src || typeof src !== 'object') return {};
  const out: Record<string, StelliumColonizeRecord> = {};
  for (const [id, row] of Object.entries(src as Record<string, unknown>)) {
    if (!isRecord(row)) continue;
    out[id] = {
      ...row,
      outpostDueAtMs: typeof row.outpostDueAtMs === 'number' ? row.outpostDueAtMs : null,
      lastOpexDayKey: typeof row.lastOpexDayKey === 'string' ? row.lastOpexDayKey : null,
    };
  }
  return out;
}

function colonizePhaseRank(phase: string): number {
  if (phase === 'success') return 4;
  if (phase === 'outpost' || phase === 'fail_wait') return 3;
  if (phase === 'in_flight') return 2;
  if (phase === 'queued') return 1;
  return 0;
}

/** 디스크 vs 메모리 — 더 진행된 장부를 남긴다. 착륙 재출항이 hydrate보다 빨랐을 때 도착분을 지우지 않음. */
export function mergeStelliumColonizeRecords(
  memory: Record<string, StelliumColonizeRecord>,
  disk: Record<string, StelliumColonizeRecord>,
): Record<string, StelliumColonizeRecord> {
  const out: Record<string, StelliumColonizeRecord> = { ...memory };
  const ids = Object.keys(disk);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const d = disk[id];
    const m = out[id];
    if (!d) continue;
    if (!m) {
      out[id] = d;
      continue;
    }
    const dr = colonizePhaseRank(d.phase);
    const mr = colonizePhaseRank(m.phase);
    if (dr > mr) {
      out[id] = d;
      continue;
    }
    if (dr < mr) continue;
    if (d.phase === 'in_flight' && m.phase === 'in_flight') {
      const dd = d.outpostDueAtMs;
      const md = m.outpostDueAtMs;
      if (dd != null && (md == null || dd < md)) out[id] = d;
    }
  }
  return out;
}

function normalizeReadyAt(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const out: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const n = Number(raw[i]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export const useStelliumColonizeStore = create<StelliumColonizeState>(() => ({
  hydrated: false,
  revision: 0,
  byPlanetId: {},
  fleetReadyAtMs: null,
}));

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let hydratePromise: Promise<void> | null = null;
/** purge 중 진행 중인 hydrate가 옛 레코드를 되돌리지 못하게 */
let hydrateEpoch = 0;

export async function persistStelliumColonizeStore(): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    const { byPlanetId, fleetReadyAtMs } = useStelliumColonizeStore.getState();
    await storage.setItem(
      STELLIUM_COLONIZE_STORAGE_KEY,
      JSON.stringify({ byPlanetId, fleetReadyAtMs }),
    );
  } catch {
    /* node test / native 미기동 */
  }
}

export function scheduleStelliumColonizePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistStelliumColonizeStore();
  }, PERSIST_COALESCE_MS);
}

export async function hydrateStelliumColonizeStore(): Promise<void> {
  const storage = getAsyncStorage();
  const epoch = hydrateEpoch;
  try {
    const raw = storage ? await storage.getItem(STELLIUM_COLONIZE_STORAGE_KEY) : null;
    if (epoch !== hydrateEpoch) return;
    const parsed = raw ? JSON.parse(raw) as { byPlanetId?: unknown; fleetReadyAtMs?: unknown } : null;
    const diskByPlanetId = parsed ? normalizePayload(parsed) : {};
    const diskReadyAt = parsed ? normalizeReadyAt(parsed.fleetReadyAtMs) : null;
    const memory = useStelliumColonizeStore.getState();
    if (epoch !== hydrateEpoch) return;
    if (memory.revision > 0) {
      const merged = mergeStelliumColonizeRecords(memory.byPlanetId, diskByPlanetId);
      useStelliumColonizeStore.setState({
        hydrated: true,
        byPlanetId: merged,
        fleetReadyAtMs: memory.fleetReadyAtMs ?? diskReadyAt,
      });
      invalidatePlanetWorldObjectsListCache();
      return;
    }
    useStelliumColonizeStore.setState({
      hydrated: true,
      revision: Object.keys(diskByPlanetId).length > 0 ? 1 : 0,
      byPlanetId: diskByPlanetId,
      fleetReadyAtMs: diskReadyAt,
    });
    invalidatePlanetWorldObjectsListCache();
  } catch {
    if (epoch !== hydrateEpoch) return;
    useStelliumColonizeStore.setState({ hydrated: true });
  }
}

export function ensureStelliumColonizeHydrated(): Promise<void> {
  if (useStelliumColonizeStore.getState().hydrated) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = hydrateStelliumColonizeStore().finally(() => {
      hydratePromise = null;
    });
  }
  return hydratePromise;
}

export function replaceStelliumColonizeRecords(
  byPlanetId: Record<string, StelliumColonizeRecord>,
  persistNow = false,
  fleetReadyAtMs?: number[] | null,
): void {
  const prev = useStelliumColonizeStore.getState();
  useStelliumColonizeStore.setState({
    hydrated: true,
    revision: prev.revision + 1,
    byPlanetId,
    fleetReadyAtMs: fleetReadyAtMs === undefined ? prev.fleetReadyAtMs : fleetReadyAtMs,
  });
  invalidatePlanetWorldObjectsListCache();
  if (persistNow) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    void persistStelliumColonizeStore();
    return;
  }
  scheduleStelliumColonizePersist();
}

export async function resetStelliumColonizeForAccountPurge(): Promise<void> {
  hydrateEpoch += 1;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  hydratePromise = null;
  try {
    const {
      clearStelliumColonizeHandoffWatch,
      clearStelliumColonizeOutpostWatch,
    } =
      require('../arcCore/colonize/tickStelliumColonizeRealtime') as typeof import('../arcCore/colonize/tickStelliumColonizeRealtime');
    clearStelliumColonizeHandoffWatch();
    clearStelliumColonizeOutpostWatch();
  } catch {
    /* 테스트·부트 전 */
  }
  useStelliumColonizeStore.setState({
    hydrated: true,
    revision: 0,
    byPlanetId: {},
    fleetReadyAtMs: null,
  });
  invalidatePlanetWorldObjectsListCache();
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    await storage.removeItem(STELLIUM_COLONIZE_STORAGE_KEY);
  } catch {
    /* node test / native 미기동 */
  }
}

export function listStelliumColonizeInFlightRecords(): StelliumColonizeRecord[] {
  const byPlanetId = useStelliumColonizeStore.getState().byPlanetId;
  const out: StelliumColonizeRecord[] = [];
  const keys = Object.keys(byPlanetId);
  for (let i = 0; i < keys.length; i += 1) {
    const row = byPlanetId[keys[i]];
    if (row?.phase === 'in_flight') out.push(row);
  }
  return out;
}
