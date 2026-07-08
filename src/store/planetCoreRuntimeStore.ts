import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { invalidatePlanetWorldObjectsListCache } from '../worldObjects/planetWorldObjectsListCacheRegistry';
import type { Planet, StarSystem } from '../types';
import { useWorldStore } from './worldStore';
import {
  listCoreOpenGameplayPlanetIds,
  resolveCoreOpenGameplayPlanetRef,
} from '../world/coreOpenGameplayPlanets';
import type { PlanetCoreMetricsDetail, PlanetMasterBalanceDetail, PlanetCoreStatOpsTrendDetail } from './planetCoreMetricTypes';
import { planetPgpStorageKey } from '../world/planetPgpModel';
import {
  hasPlanetResourceGenesisCsvRow,
  isLegacyFlatCoreSeed,
  resolvePlanetGenesisCoreGauge,
} from '../arcCore/planetResource/planetResourceEcosystemPolicy';
import {
  mergeArcCoreRedWorldPlanetRuntime,
  snapshotArcCoreRedWorldPlanetRuntime,
} from '../arcCore/planetDevelopment/arcCoreWorldPlanetRuntimePreservation';

const STORAGE_KEY = 'arcfire_planet_core_runtime_v1';

/** 드론 impact 등 고빈도 patch — 메모리 즉시·디스크는 코얼레싱 (faction vault 패턴) */
const PLANET_CORE_PERSIST_COALESCE_MS = 1500;
let planetCorePersistCoalesceTimer: ReturnType<typeof setTimeout> | null = null;
/** 변경 없으면 JSON.stringify+AsyncStorage skip (일일 배치·틱 GC 압력 완화) */
let planetCorePersistDirty = false;

function markPlanetCorePersistDirty(): void {
  planetCorePersistDirty = true;
}

/** setState 직접 호출 후 persist — 일일 배치 등 외부 패스용 */
export function markPlanetCoreRuntimeDirty(): void {
  markPlanetCorePersistDirty();
}

function scheduleCoalescedPlanetCorePersist(
  getState: () => { persistPlanetCoreRuntime: () => Promise<void> },
): void {
  if (planetCorePersistCoalesceTimer) return;
  planetCorePersistCoalesceTimer = setTimeout(() => {
    planetCorePersistCoalesceTimer = null;
    void getState().persistPlanetCoreRuntime();
  }, PLANET_CORE_PERSIST_COALESCE_MS);
}

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
  /** [보완 #4] 행성 총생산(PGP, BMU) — 12:00 KST 배치에서만 갱신 */
  pgp?: number;
  /** 지표별 세부 속성 확장 슬롯 */
  detail?: PlanetCoreMetricsDetail;
};

export type PlanetCoreGaugeView = Omit<PlanetCoreRuntime, 'updatedAt' | 'detail' | 'pgp'>;

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

/** store 초기화 후 지연 로드 — planetFacilityLegacyMigration ↔ store 순환 참조 방지 */
async function runLegacyPlanetDevModuleMigrationAll(): Promise<void> {
  const { migrateLegacyPlanetDevModulesAll } = await import(
    '../game/planetDevelopment/planetFacilityLegacyMigration'
  );
  migrateLegacyPlanetDevModulesAll();
}

let legacyMigrationQueued = false;

function scheduleDeferredLegacyPlanetDevMigration(
  persistAfter: boolean,
  getState: () => { persistPlanetCoreRuntime: () => Promise<void> },
): void {
  if (legacyMigrationQueued) return;
  legacyMigrationQueued = true;
  InteractionManager.runAfterInteractions(() => {
    void (async () => {
      try {
        await runLegacyPlanetDevModuleMigrationAll();
        if (persistAfter) {
          markPlanetCorePersistDirty();
          await getState().persistPlanetCoreRuntime();
        }
      } finally {
        legacyMigrationQueued = false;
      }
    })();
  });
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
  const pgpRaw = o.pgp;
  const pgp =
    typeof pgpRaw === 'number' && Number.isFinite(pgpRaw)
      ? Math.max(0, Math.floor(pgpRaw))
      : undefined;
  return {
    resource,
    population,
    defense,
    technology,
    environment,
    updatedAt: typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) ? o.updatedAt : Date.now(),
    pgp,
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
  /** true — raw가 존재했는데 JSON.parse 자체가 실패(손상). 최초무데이터(raw=null)와 구분 */
  corrupted: boolean;
} {
  if (!raw) {
    return { byPlanetId: {}, globalMultipliers: { ...DEFAULT_GLOBAL_MULTIPLIERS }, corrupted: false };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const fromDisk: Record<string, PlanetCoreRuntime> = {};
    const bag = parsed.byPlanetId;
    if (bag && typeof bag === 'object') {
      for (const [id, rec] of Object.entries(bag as Record<string, unknown>)) {
        const n = normalizeRuntime(rec);
        if (n) fromDisk[id] = n;
      }
    }
    // [보완 #4] planet_{planetId}_pgp 플랫 키 → byPlanetId.pgp 병합
    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith('planet_') || !key.endsWith('_pgp')) continue;
      const planetId = key.slice('planet_'.length, -'_pgp'.length);
      if (!planetId) continue;
      const pgp = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
      if (pgp === null) continue;
      const existing = fromDisk[planetId];
      if (existing) {
        fromDisk[planetId] = { ...existing, pgp };
      }
    }
    return {
      byPlanetId: fromDisk,
      globalMultipliers: normalizeGlobalMultipliers(parsed.globalMultipliers),
      corrupted: false,
    };
  } catch {
    return { byPlanetId: {}, globalMultipliers: { ...DEFAULT_GLOBAL_MULTIPLIERS }, corrupted: true };
  }
}

const CORRUPT_STASH_KEY = 'arcfire_planet_core_runtime_corrupt_stash_v1';

/** 손상된 원본 raw를 포렌식용으로 별도 키에 보관(최선노력, 실패해도 무시) */
async function stashCorruptedPlanetCoreRuntimePayload(raw: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CORRUPT_STASH_KEY,
      JSON.stringify({ atMs: Date.now(), raw }),
    );
  } catch {
    /* forensics only — 실패해도 부팅에 영향 없음 */
  }
}

/**
 * 로컬 파싱 실패(손상) 시에만 호출 — 최신 Firestore 백업의 이 키만 단건 복구 시도.
 * 매 부팅 조회가 아니라 손상이 실제로 감지된 드문 경우에만 실행되므로 리스크 낮음.
 * 실패(오프라인·백업 없음 등) 시 null 반환 — 호출부가 기존 빈 기본값으로 계속 진행.
 */
async function tryRecoverPlanetCoreRuntimeFromCloudBackup(): Promise<{
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
} | null> {
  try {
    const {
      resolveGameSaveBackupUid,
      listGameSaveBackupsForUid,
      fetchGameSaveBackupDoc,
    } = await import('../firebase/gameSaveBackup/gameSaveBackupService');
    const uid = await resolveGameSaveBackupUid();
    if (!uid) return null;
    const list = await listGameSaveBackupsForUid(uid, 1);
    const latest = list.items[0];
    if (!latest) return null;
    const doc = await fetchGameSaveBackupDoc(uid, latest.backupId);
    const snapshotRaw = doc?.snapshot?.[STORAGE_KEY];
    if (!snapshotRaw) return null;
    const recovered = parseStoragePayload(snapshotRaw);
    if (recovered.corrupted) return null;
    return { byPlanetId: recovered.byPlanetId, globalMultipliers: recovered.globalMultipliers };
  } catch {
    return null;
  }
}

function buildPlanetCoreRuntimeStoragePayload(state: {
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    byPlanetId: state.byPlanetId,
    globalMultipliers: state.globalMultipliers,
  };
  // [보완 #4] AsyncStorage 행성별 PGP 키 planet_{planetId}_pgp
  for (const [planetId, rec] of Object.entries(state.byPlanetId)) {
    if (typeof rec.pgp === 'number' && Number.isFinite(rec.pgp)) {
      payload[planetPgpStorageKey(planetId)] = rec.pgp;
    }
  }
  return payload;
}

async function persistStoragePayload(state: {
  byPlanetId: Record<string, PlanetCoreRuntime>;
  globalMultipliers: PlanetCoreGlobalMultipliers;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buildPlanetCoreRuntimeStoragePayload(state)));
    scheduleUserCloudSync();
  } catch {
    /* ignore */
  }
}

function applyGenesisCoreSeed(
  planetId: string,
  runtime: PlanetCoreRuntime,
  stored: PlanetCoreRuntime | undefined,
): PlanetCoreRuntime {
  if (stored && !isLegacyFlatCoreSeed(stored)) {
    return runtime;
  }
  const genesis = resolvePlanetGenesisCoreGauge(planetId);
  if (
    runtime.resource === genesis.resource
    && runtime.population === genesis.population
    && runtime.defense === genesis.defense
    && runtime.technology === genesis.technology
    && runtime.environment === genesis.environment
  ) {
    return runtime;
  }
  return {
    ...runtime,
    ...genesis,
    updatedAt: Date.now(),
  };
}

function mergeWorldWithDisk(
  systems: Record<string, StarSystem>,
  fromDisk: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const next: Record<string, PlanetCoreRuntime> = {};
  for (const sys of Object.values(systems)) {
    for (const planet of sys.planets) {
      const stored = fromDisk[planet.id];
      const baseline = planetCsvBaselineToRuntime(planet);
      if (/^synth_\d{3}_p$/.test(planet.id)) {
        const merged = stored
          ? {
              ...baseline,
              ...stored,
              pgp: stored.pgp,
              detail: stored.detail,
              updatedAt: stored.updatedAt,
            }
          : baseline;
        next[planet.id] = applyGenesisCoreSeed(planet.id, merged, stored);
        continue;
      }
      const merged = stored ?? baseline;
      next[planet.id] = applyGenesisCoreSeed(planet.id, merged, stored);
    }
  }
  const dtRealigned = realignStarterPlanetDefenseTechnology(systems, next);
  return realignPlanetGenesisEcosystemFromTable(dtRealigned);
}

/** 아르카디아 등 스타터 행성 — CSV 경제 생태계 기본 D/T로 1회 재정렬 */
const PLANET_DT_REALIGN_REV = 1;
const PLANET_DT_REALIGN_IDS = new Set(['arcadia_prime']);

/** 구 genesis zone=저R 곡선 오적용 → lore·planets.csv 정본 1회 보정 (planet_resource_genesis.csv 행 전체) */
const PLANET_GENESIS_ECOLOGY_REALIGN_REV = 2;

function isGenesisEcosystemRealignTarget(planetId: string): boolean {
  return hasPlanetResourceGenesisCsvRow(planetId);
}

function realignStarterPlanetDefenseTechnology(
  systems: Record<string, StarSystem>,
  byPlanetId: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const out = { ...byPlanetId };
  for (const planetId of PLANET_DT_REALIGN_IDS) {
    const stored = out[planetId];
    if (!stored) continue;
    const planet = findPlanetInSystems(systems, planetId);
    if (!planet) continue;
    const rev = stored.detail?.attackDamage?.realignRev ?? 0;
    if (rev >= PLANET_DT_REALIGN_REV) continue;

    const baseline = planetCsvBaselineToRuntime(planet);
    const prevAttack = stored.detail?.attackDamage;
    out[planetId] = {
      ...stored,
      defense: baseline.defense,
      technology: baseline.technology,
      updatedAt: Date.now(),
      detail: {
        ...stored.detail,
        attackDamage: prevAttack
          ? {
              ...prevAttack,
              realignRev: PLANET_DT_REALIGN_REV,
              microRemainder: undefined,
            }
          : {
              version: 1,
              daily: { kstDayKey: '', byKind: {} },
              lastEvents: [],
              totalEvents: 0,
              realignRev: PLANET_DT_REALIGN_REV,
            },
      },
    };
  }
  return out;
}

function realignPlanetGenesisEcosystemFromTable(
  byPlanetId: Record<string, PlanetCoreRuntime>,
): Record<string, PlanetCoreRuntime> {
  const out = { ...byPlanetId };
  for (const planetId of Object.keys(out)) {
    if (!isGenesisEcosystemRealignTarget(planetId)) continue;
    const stored = out[planetId];
    if (!stored) continue;
    const rev = stored.detail?.resource?.genesisRealignRev ?? 0;
    if (rev >= PLANET_GENESIS_ECOLOGY_REALIGN_REV) continue;

    const genesis = resolvePlanetGenesisCoreGauge(planetId);
    out[planetId] = {
      ...stored,
      resource: genesis.resource,
      population: genesis.population,
      defense: genesis.defense,
      technology: genesis.technology,
      environment: genesis.environment,
      updatedAt: Date.now(),
      detail: {
        ...stored.detail,
        resource: {
          ...stored.detail?.resource,
          version: stored.detail?.resource?.version ?? 1,
          genesisRealignRev: PLANET_GENESIS_ECOLOGY_REALIGN_REV,
        },
      },
    };
  }
  return out;
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
  /** 개방 synth·월드 갱신 후 코어 5지표 런타임 동기(일 1회 배치·개방 직후) */
  ensureUnlockedWorldPlanetsInCoreRuntime: () => number;
  persistPlanetCoreRuntime: () => Promise<void>;
  /** 전 행성 CSV baseline — dev·운영툴 전용 */
  resetLocalPlanetCoreRuntime: () => Promise<void>;
  /**
   * 계정 purge — 플레이어 귀속(BLUE·증서·홈) 행성은 baseline,
   * ArcCore RED 점령 월드 축(개발·5지표)은 기기 공유 상태로 유지.
   */
  resetLocalPlanetCoreRuntimeForAccountPurge: () => Promise<void>;
  getPlanetCoreRuntime: (planetId: string) => PlanetCoreRuntime | undefined;
  patchPlanetCore: (
    planetId: string,
    patch: Partial<PlanetCoreGaugeView> & { pgp?: number; detail?: PlanetCoreRuntime['detail'] },
  ) => void;
  /** 여러 행성 5지표를 한 번에 갱신 후 디스크 1회 저장 */
  patchPlanetCoresBulk: (updates: Record<string, PlanetCoreGaugeView>) => void;
  /** 마스터 밸런스 패스 — 5지표 + detail.masterBalance 일괄 갱신 */
  patchPlanetMasterBalanceBulk: (
    updates: Record<string, { gauge: PlanetCoreGaugeView; masterBalance: PlanetMasterBalanceDetail }>,
  ) => void;
  /** 일일 배치 statOpsTrend Δ 일괄 갱신 */
  patchPlanetCoreStatOpsTrendBulk: (
    updates: Record<string, PlanetCoreStatOpsTrendDetail>,
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
      let recoveredFromCloud = false;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const payload = parseStoragePayload(raw);
        fromDisk = payload.byPlanetId;
        globalMultipliers = payload.globalMultipliers;
        if (payload.corrupted && raw) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[MEM] planetCoreRuntime local payload corrupted(parse fail) — attempting cloud recovery');
          }
          void stashCorruptedPlanetCoreRuntimePayload(raw);
          const recovered = await tryRecoverPlanetCoreRuntimeFromCloudBackup();
          if (recovered) {
            fromDisk = recovered.byPlanetId;
            globalMultipliers = recovered.globalMultipliers;
            recoveredFromCloud = true;
          }
        }
      } catch {
        /* ignore */
      }
      const next = mergeWorldWithDisk(systems, fromDisk);
      set({ byPlanetId: next, globalMultipliers, hydrated: true });
      if (recoveredFromCloud) {
        markPlanetCorePersistDirty();
        await persistStoragePayload({ byPlanetId: next, globalMultipliers });
      }
      scheduleDeferredLegacyPlanetDevMigration(true, get);
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
      markPlanetCorePersistDirty();
      scheduleDeferredLegacyPlanetDevMigration(true, get);
    }
  },

  ensureUnlockedWorldPlanetsInCoreRuntime: () => {
    if (!get().hydrated) return 0;
    const prev = get().byPlanetId;
    const next = { ...prev };
    let touched = 0;
    const t = Date.now();

    for (const planetId of listCoreOpenGameplayPlanetIds()) {
      const ref = resolveCoreOpenGameplayPlanetRef(planetId);
      if (!ref) continue;
      const { planet, system } = ref;
      const isSynthSystem = system.id.startsWith('synth_');
      const baseline = planetCsvBaselineToRuntime(planet);
      const stored = next[planetId];
      if (!stored) {
        if (isSynthSystem && planetId.startsWith('synth_')) {
          const genesis = resolvePlanetGenesisCoreGauge(planetId);
          next[planetId] = {
            ...genesis,
            updatedAt: t,
          };
        } else {
          next[planetId] = baseline;
        }
        touched += 1;
      }
    }

    if (touched > 0) {
      set({ byPlanetId: next });
      markPlanetCorePersistDirty();
    }
    return touched;
  },

  persistPlanetCoreRuntime: async () => {
    if (!planetCorePersistDirty) return;
    await persistStoragePayload({
      byPlanetId: get().byPlanetId,
      globalMultipliers: get().globalMultipliers,
    });
    planetCorePersistDirty = false;
  },

  resetLocalPlanetCoreRuntime: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    const systems = useWorldStore.getState().systems;
    const next = mergeWorldWithDisk(systems, {});
    const globalMultipliers = { ...DEFAULT_GLOBAL_MULTIPLIERS };
    set({ byPlanetId: next, globalMultipliers, hydrated: true });
    markPlanetCorePersistDirty();
    await persistStoragePayload({ byPlanetId: next, globalMultipliers });
    planetCorePersistDirty = false;
  },

  resetLocalPlanetCoreRuntimeForAccountPurge: async () => {
    const redWorldSnap = snapshotArcCoreRedWorldPlanetRuntime(get().byPlanetId);
    await AsyncStorage.removeItem(STORAGE_KEY);
    const systems = useWorldStore.getState().systems;
    const baseline = mergeWorldWithDisk(systems, {});
    const next = mergeArcCoreRedWorldPlanetRuntime(baseline, redWorldSnap);
    const globalMultipliers = { ...DEFAULT_GLOBAL_MULTIPLIERS };
    set({ byPlanetId: next, globalMultipliers, hydrated: true });
    markPlanetCorePersistDirty();
    await persistStoragePayload({ byPlanetId: next, globalMultipliers });
    planetCorePersistDirty = false;
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
      pgp: typeof patch.pgp === 'number' ? Math.max(0, Math.floor(patch.pgp)) : prev.pgp,
      detail: patch.detail ?? prev.detail,
    };
    set({ byPlanetId: { ...get().byPlanetId, [planetId]: merged } });
    if (patch.detail !== undefined) {
      invalidatePlanetWorldObjectsListCache(planetId);
    }
    markPlanetCorePersistDirty();
    scheduleCoalescedPlanetCorePersist(get);
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
    markPlanetCorePersistDirty();
    scheduleCoalescedPlanetCorePersist(get);
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
    markPlanetCorePersistDirty();
    scheduleCoalescedPlanetCorePersist(get);
  },

  patchPlanetCoreStatOpsTrendBulk: (updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    let next = { ...get().byPlanetId };
    for (const planetId of keys) {
      const trend = updates[planetId];
      if (!planetId || !trend) continue;
      const prev = next[planetId];
      if (!prev) continue;
      next = {
        ...next,
        [planetId]: {
          ...prev,
          detail: {
            ...prev.detail,
            statOpsTrend: trend,
          },
        },
      };
    }
    set({ byPlanetId: next });
    markPlanetCorePersistDirty();
    scheduleCoalescedPlanetCorePersist(get);
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
    markPlanetCorePersistDirty();
    await get().persistPlanetCoreRuntime();
  },
}));

/** 행성개발 레벨업 등 — coalesce 대기 없이 디스크 flush (앱 종료·부트 마이그레이션 race 방지) */
export async function flushPlanetCoreRuntimePersist(): Promise<void> {
  if (planetCorePersistCoalesceTimer) {
    clearTimeout(planetCorePersistCoalesceTimer);
    planetCorePersistCoalesceTimer = null;
  }
  markPlanetCorePersistDirty();
  await usePlanetCoreRuntimeStore.getState().persistPlanetCoreRuntime();
}
