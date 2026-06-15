import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import type { Planet, StarSystem } from '../types';
import { useWorldStore } from './worldStore';
import type { PlanetCoreMetricsDetail, PlanetMasterBalanceDetail } from './planetCoreMetricTypes';

const STORAGE_KEY = 'arcfire_planet_core_runtime_v1';

export type PlanetCoreGlobalMultipliers = {
  globalEngageHpMul: number;
};

const DEFAULT_GLOBAL_MULTIPLIERS: PlanetCoreGlobalMultipliers = {
  globalEngageHpMul: 1,
};

/** UI·아크코어가 공유하는 0..100 핵심 지표(런타임 DB 레코드). */
export type PlanetCoreRuntime = {
  /** 자원(물질·에너지·광물망 등 상위 개념 통합 스칼라). 향후 DB 광물 레저·아크코어 스폰 정책의 주요 입력. */
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
  updatedAt: number;
  /** 지표별 세부 속성 확장 슬롯 */
  detail?: PlanetCoreMetricsDetail;
};

export type PlanetCoreGaugeView = Omit<PlanetCoreRuntime, 'updatedAt' | 'detail'>;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export function planetCsvBaselineToRuntime(planet: Planet): PlanetCoreRuntime {
  const t = Date.now();
  return {
    resource: clamp100(planet.coreResource),
    population: clamp100(planet.corePopulation),
    defense: clamp100(planet.coreDefense),
    technology: clamp100(planet.coreTechnology),
    environment: clamp100(planet.coreEnvironment),
    updatedAt: t,
  };
}

export function planetCoreRuntimeToGaugeView(r: PlanetCoreRuntime): PlanetCoreGaugeView {
  return {
    resource: r.resource,
    population: r.population,
    defense: r.defense,
    technology: r.technology,
    environment: r.environment,
  };
}

function findPlanetInSystems(systems: Record<string, StarSystem>, planetId: string): Planet | undefined {
  for (const sys of Object.values(systems)) {
    const hit = sys.planets.find((p) => p.id === planetId);
    if (hit) return hit;
  }
  return undefined;
}

function normalizeDetail(raw: unknown): PlanetCoreMetricsDetail | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as PlanetCoreMetricsDetail;
}

function normalizeRuntime(raw: unknown): PlanetCoreRuntime | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  let resource = clamp100(Number(o.resource));
  const legacyEnergy = o.energy;
  if (legacyEnergy !== undefined && legacyEnergy !== null && Number.isFinite(Number(legacyEnergy))) {
    resource = clamp100(Math.round((resource + clamp100(Number(legacyEnergy))) / 2));
  }
  const population = clamp100(Number(o.population));
  const defense = clamp100(Number(o.defense));
  const technology = clamp100(Number(o.technology));
  const environment = clamp100(Number(o.environment));
  return {
    resource,
    population,
    defense,
    technology,
    environment,
    updatedAt: typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) ? o.updatedAt : Date.now(),
    detail: normalizeDetail(o.detail),
  };
}

function normalizeGlobalMultipliers(raw: unknown): PlanetCoreGlobalMultipliers {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GLOBAL_MULTIPLIERS };
  const o = raw as Record<string, unknown>;
  const mul = Number(o.globalEngageHpMul);
  return {
    globalEngageHpMul:
      Number.isFinite(mul) && mul > 0 ? Math.max(0.7, Math.min(1.3, mul)) : DEFAULT_GLOBAL_MULTIPLIERS.globalEngageHpMul,
  };
}

function parseStoragePayload(raw: string | null): {
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
} {
  if (!raw) {
    return { byPlanetId: {}, globalMultipliers: { ...DEFAULT_GLOBAL_MULTIPLIERS } };
  }
  try {
    const parsed = JSON.parse(raw) as {
      byPlanetId?: Record<string, unknown>;
      globalMultipliers?: unknown;
    };
    const fromDisk: Record<string, PlanetCoreRuntime> = {};
    const bag = parsed.byPlanetId;
    if (bag && typeof bag === 'object') {
      for (const [id, rec] of Object.entries(bag)) {
        const n = normalizeRuntime(rec);
        if (n) fromDisk[id] = n;
      }
    }
    return {
      byPlanetId: fromDisk,
      globalMultipliers: normalizeGlobalMultipliers(parsed.globalMultipliers),
    };
  } catch {
    return { byPlanetId: {}, globalMultipliers: { ...DEFAULT_GLOBAL_MULTIPLIERS } };
  }
}

async function persistStoragePayload(state: {
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        byPlanetId: state.byPlanetId,
        globalMultipliers: state.globalMultipliers,
      }),
    );
    scheduleUserCloudSync();
  } catch {
    /* ignore */
  }
}

function mergeWorldWithDisk(
  systems: Record<string, StarSystem>,
  fromDisk: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const next: Record<string, PlanetCoreRuntime> = {};
  for (const sys of Object.values(systems)) {
    for (const planet of sys.planets) {
      const stored = fromDisk[planet.id];
      next[planet.id] = stored ?? planetCsvBaselineToRuntime(planet);
    }
  }
  return next;
}

interface PlanetCoreRuntimeState {
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
  /** true면 디스크 로드 + 월드 시드 완료(또는 메모리 부트스트랩 완료). */
  hydrated: boolean;
  /**
   * CSV/생성 데이터(Planet)는 초기값만 담당. 디스크에 없는 행성은 테이블 기준으로 시드한다.
   * 이미 `hydrated`이면 신규 행성 id만 추가한다.
   */
  bootstrapFromWorldAsync: () => Promise<void>;
  persistPlanetCoreRuntime: () => Promise<void>;
  resetLocalPlanetCoreRuntime: () => Promise<void>;
  getPlanetCoreRuntime: (planetId: string) => PlanetCoreRuntime | undefined;
  patchPlanetCore: (
    planetId: string,
    patch: Partial<PlanetCoreGaugeView> & { detail?: PlanetCoreRuntime['detail'] },
  ) => void;
  /** 여러 행성 5지표를 한 번에 갱신 후 디스크 1회 저장 */
  patchPlanetCoresBulk: (updates: Record<string, PlanetCoreGaugeView>) => void;
  /** 마스터 밸런스 패스 — 5지표 + detail.masterBalance 일괄 갱신 */
  patchPlanetMasterBalanceBulk: (
    updates: Record<string, { gauge: PlanetCoreGaugeView; masterBalance: PlanetMasterBalanceDetail }>,
  ) => void;
  getGlobalEngageHpMul: () => number;
  setGlobalEngageHpMul: (mul: number) => Promise<void>;
}

export const usePlanetCoreRuntimeStore = create<PlanetCoreRuntimeState>((set, get) => ({
  byPlanetId: {},
  globalMultipliers: { ...DEFAULT_GLOBAL_MULTIPLIERS },
  hydrated: false,

  bootstrapFromWorldAsync: async () => {
    const systems = useWorldStore.getState().systems;

    if (!get().hydrated) {
      let fromDisk: Record<string, PlanetCoreRuntime> = {};
      let globalMultipliers = { ...DEFAULT_GLOBAL_MULTIPLIERS };
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const payload = parseStoragePayload(raw);
        fromDisk = payload.byPlanetId;
        globalMultipliers = payload.globalMultipliers;
      } catch {
        /* ignore */
      }
      const next = mergeWorldWithDisk(systems, fromDisk);
      set({ byPlanetId: next, globalMultipliers, hydrated: true });
      await persistStoragePayload({ byPlanetId: next, globalMultipliers });
      return;
    }

    const prev = get().byPlanetId;
    const next = { ...prev };
    let dirty = false;
    for (const sys of Object.values(systems)) {
      for (const p of sys.planets) {
        if (!next[p.id]) {
          next[p.id] = planetCsvBaselineToRuntime(p);
          dirty = true;
        }
      }
    }
    if (dirty) {
      set({ byPlanetId: next });
      await persistStoragePayload({ byPlanetId: next, globalMultipliers: get().globalMultipliers });
    }
  },

  persistPlanetCoreRuntime: async () => {
    await persistStoragePayload({
      byPlanetId: get().byPlanetId,
      globalMultipliers: get().globalMultipliers,
    });
  },

  resetLocalPlanetCoreRuntime: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    const systems = useWorldStore.getState().systems;
    const next = mergeWorldWithDisk(systems, {});
    const globalMultipliers = { ...DEFAULT_GLOBAL_MULTIPLIERS };
    set({ byPlanetId: next, globalMultipliers, hydrated: true });
    await persistStoragePayload({ byPlanetId: next, globalMultipliers });
  },

  getPlanetCoreRuntime: (planetId) => get().byPlanetId[planetId],

  patchPlanetCore: (planetId, patch) => {
    if (!planetId) return;
    const systems = useWorldStore.getState().systems;
    const planet = findPlanetInSystems(systems, planetId);
    if (!planet) return;
    const prev = get().byPlanetId[planetId] ?? planetCsvBaselineToRuntime(planet);
    const merged: PlanetCoreRuntime = {
      resource: clamp100(patch.resource ?? prev.resource),
      population: clamp100(patch.population ?? prev.population),
      defense: clamp100(patch.defense ?? prev.defense),
      technology: clamp100(patch.technology ?? prev.technology),
      environment: clamp100(patch.environment ?? prev.environment),
      updatedAt: Date.now(),
      detail: patch.detail ?? prev.detail,
    };
    set({ byPlanetId: { ...get().byPlanetId, [planetId]: merged } });
    void get().persistPlanetCoreRuntime();
  },

  patchPlanetCoresBulk: (updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const systems = useWorldStore.getState().systems;
    let next = { ...get().byPlanetId };
    const t = Date.now();
    for (const planetId of keys) {
      if (!planetId) continue;
      const planet = findPlanetInSystems(systems, planetId);
      if (!planet) continue;
      const patch = updates[planetId];
      if (!patch) continue;
      const prev = next[planetId] ?? planetCsvBaselineToRuntime(planet);
      next = {
        ...next,
        [planetId]: {
          resource: clamp100(patch.resource ?? prev.resource),
          population: clamp100(patch.population ?? prev.population),
          defense: clamp100(patch.defense ?? prev.defense),
          technology: clamp100(patch.technology ?? prev.technology),
          environment: clamp100(patch.environment ?? prev.environment),
          updatedAt: t,
          detail: prev.detail,
        },
      };
    }
    set({ byPlanetId: next });
    void get().persistPlanetCoreRuntime();
  },

  patchPlanetMasterBalanceBulk: (updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const systems = useWorldStore.getState().systems;
    let next = { ...get().byPlanetId };
    const t = Date.now();
    for (const planetId of keys) {
      if (!planetId) continue;
      const planet = findPlanetInSystems(systems, planetId);
      if (!planet) continue;
      const patch = updates[planetId];
      if (!patch) continue;
      const prev = next[planetId] ?? planetCsvBaselineToRuntime(planet);
      const g = patch.gauge;
      next = {
        ...next,
        [planetId]: {
          resource: clamp100(g.resource ?? prev.resource),
          population: clamp100(g.population ?? prev.population),
          defense: clamp100(g.defense ?? prev.defense),
          technology: clamp100(g.technology ?? prev.technology),
          environment: clamp100(g.environment ?? prev.environment),
          updatedAt: t,
          detail: {
            ...prev.detail,
            masterBalance: patch.masterBalance,
          },
        },
      };
    }
    set({ byPlanetId: next });
    void get().persistPlanetCoreRuntime();
  },

  getGlobalEngageHpMul: () => get().globalMultipliers.globalEngageHpMul,

  setGlobalEngageHpMul: async (mul) => {
    const safe = Math.max(0.7, Math.min(1.3, Number.isFinite(mul) ? mul : 1));
    set({
      globalMultipliers: {
        ...get().globalMultipliers,
        globalEngageHpMul: safe,
      },
    });
    await get().persistPlanetCoreRuntime();
  },
}));
