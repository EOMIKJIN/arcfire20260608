import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { StarSystem } from '../types';
import { GALAXY_SYSTEMS, GAMEPLAY_SYSTEM_IDS, LEGACY_VISIBLE_TOTAL_SYSTEMS, parseSynthOrdinal } from '../data/galaxy100';
import {
  getSynthSystemColonizationRow,
  getWorldExpansionTimingPolicy,
} from '../arcCore/balance/balanceTableRegistry';
import { GALAXY_ROUTE_POLICIES, GalaxyRouteDirection } from '../world/galaxyRouteFactionPolicy';
import { isDevHarnessAllowed } from '../game/gameplayModeContract';
import { ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS } from '../arcCore/worldExpansionConstants';

const STORAGE_KEY = 'arcfire_world_v1';

interface WorldState {
  systems: Record<string, StarSystem>;
  loaded: boolean;
  selectedSystemId: string | null;
  visitedSystemIds: string[];
  unlockedSystemIds: string[];
  lastExpansionAtMs: number | null;
  loadLocalWorld: () => Promise<void>;
  persistWorld: () => Promise<void>;
  resetLocalWorld: () => Promise<void>;
  getSystem: (id: string) => StarSystem | undefined;
  selectSystem: (id: string | null) => void;
  markVisited: (id: string) => void;
  isSystemUnlocked: (id: string) => boolean;
  unlockSystem: (id: string, source?: 'arc_core_daily' | 'arc_core_legacy_seed' | 'manual') => void;
  pickNextUnlockCandidateNearCurrent: (currentSystemId: string | null | undefined) => string | null;
  /** 아크코어 마스터 일일 개방: 잠금 synth만, 개방 성계와 연결선이 있는 프론티어만 (후보 없으면 null). */
  pickArcCoreDailyUnlockCandidate: (currentSystemId: string | null | undefined) => string | null;
}

const DEFAULT_UNLOCKED_SYSTEM_IDS = Array.from(GAMEPLAY_SYSTEM_IDS);

type QuadrantKey = GalaxyRouteDirection;

function normalizeSynthSystemId(id: string): string {
  if (!id.startsWith('synth_')) return id;
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return id;
  return `synth_${String(n).padStart(3, '0')}`;
}

/** 운영 경로 — 레거시 부트 시드 synth 잔재(in-memory) 제거. */
function stripLegacyGuaranteedUnlockIdsForProduction(
  ids: readonly string[],
  lastExpansionAtMs: number | null | undefined,
): string[] {
  if (isDevHarnessAllowed()) return [...ids];
  if (typeof lastExpansionAtMs === 'number' && Number.isFinite(lastExpansionAtMs)) return [...ids];
  const blocked = new Set(ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS.map(normalizeSynthSystemId));
  return ids.filter((id) => !blocked.has(normalizeSynthSystemId(id)));
}

function resolveLegacySynthColonizationCount(): number {
  return getWorldExpansionTimingPolicy().legacySynthColonizationCount;
}

function isLegacySynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  return ord <= resolveLegacySynthColonizationCount();
}

function isExpansionSynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  return ord > resolveLegacySynthColonizationCount();
}

function resolveQuadrantForSystem(pos: { x: number; y: number }): QuadrantKey {
  const dx = pos.x - 0.5;
  const dy = pos.y - 0.5;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'south' : 'north';
}

function resolveFactionForQuadrant(q: QuadrantKey): string {
  return GALAXY_ROUTE_POLICIES[q].factionId;
}

function resolveZoneForQuadrant(q: QuadrantKey): StarSystem['zone'] {
  return GALAXY_ROUTE_POLICIES[q].zone;
}

function parseCsvNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseCsvBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function resolveZoneFromBalanceZoneIndex(zoneIndex: number): StarSystem['zone'] {
  if (zoneIndex <= 5) return 'safe';
  if (zoneIndex <= 12) return 'neutral';
  return 'pvp';
}

function resolveQuadrantFromTradeProfile(profile: string | undefined, fallback: QuadrantKey): QuadrantKey {
  const p = String(profile ?? '').trim().toLowerCase();
  if (p === 'north' || p === 'east' || p === 'south' || p === 'west') return p;
  return fallback;
}

/** synth 행성 5대 코어 — CSV·galaxy100 시드와 동일(개척 직후·첫 실행 50 고정). 일일 배치에서만 변동. */
export const SYNTH_PLANET_CORE_SEED = 50;

function applySynthSystemAutogen(base: StarSystem): StarSystem {
  if (!base.id.startsWith('synth_')) return base;
  const normalizedId = normalizeSynthSystemId(base.id);
  const csvRow = getSynthSystemColonizationRow(normalizedId);
  const posQuadrant = resolveQuadrantForSystem(base.position);
  const q = csvRow
    ? resolveQuadrantFromTradeProfile(csvRow.tradeProfile, posQuadrant)
    : posQuadrant;
  const factionId = resolveFactionForQuadrant(q);
  const zoneIndex = csvRow ? parseCsvNum(csvRow.zoneIndex, 1) : 1;
  const zone = csvRow ? resolveZoneFromBalanceZoneIndex(zoneIndex) : resolveZoneForQuadrant(q);
  const targetCombatLevel = csvRow ? parseCsvNum(csvRow.targetCombatLevel, 3) : (zone === 'pvp' ? 7 : zone === 'neutral' ? 5 : 3);
  const rawSuffix = base.id.slice('synth_'.length);
  const suffixNum = Number.parseInt(rawSuffix, 10);
  const nameSuffix = Number.isFinite(suffixNum)
    ? String(suffixNum).padStart(3, '0')
    : rawSuffix;
  const coreSeed = SYNTH_PLANET_CORE_SEED;
  return {
    ...base,
    name: csvRow?.systemNameKo ?? `미개척 ${nameSuffix}`,
    zone,
    description: csvRow?.systemDescriptionKo ?? '최초 발견 이후 아직 본격 개발되지 않은 미개척 성계.',
    enemyLevel: targetCombatLevel,
    planets: base.planets.map((p, i) => ({
      ...p,
      name: i === 0 ? (csvRow?.planetNameKo ?? `미개척 행성-${nameSuffix}`) : p.name,
      description: csvRow?.planetDescriptionKo ?? `최초 발견 이후 개발 전 단계 · ${factionId} 영향권`,
      factionId,
      hasTradePort: csvRow ? parseCsvBool(csvRow.hasTradePort) : zone !== 'pvp',
      hasShipyard: csvRow ? parseCsvBool(csvRow.hasShipyard) : zone !== 'pvp',
      hasTavern: csvRow ? parseCsvBool(csvRow.hasTavern) : true,
      coreResource: coreSeed,
      corePopulation: coreSeed,
      coreDefense: coreSeed,
      coreTechnology: coreSeed,
      coreEnvironment: coreSeed,
    })),
  };
}

/** 디스크에 unlocked만 남은 synth — 재기동 시 colonization autogen 재적용(이름·존·50 시드). */
function rehydrateUnlockedSynthSystems(
  systems: Record<string, StarSystem>,
  unlockedSystemIds: readonly string[],
): Record<string, StarSystem> {
  let next: Record<string, StarSystem> | null = null;
  for (const id of unlockedSystemIds) {
    const normalizedId = normalizeSynthSystemId(id);
    if (!normalizedId.startsWith('synth_')) continue;
    const src = (next ?? systems)[normalizedId];
    if (!src) continue;
    if (!next) next = { ...systems };
    next[normalizedId] = applySynthSystemAutogen(src);
  }
  return next ?? systems;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  systems: { ...GALAXY_SYSTEMS },
  loaded: false,
  selectedSystemId: null,
  visitedSystemIds: ['arcadia'],
  unlockedSystemIds: Array.from(new Set([...DEFAULT_UNLOCKED_SYSTEM_IDS])),
  lastExpansionAtMs: null,

  loadLocalWorld: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          visitedSystemIds?: string[];
          unlockedSystemIds?: string[];
          lastExpansionAtMs?: number | null;
        };
        if (parsed.visitedSystemIds?.length) {
          const systems = get().systems;
          const cleaned = parsed.visitedSystemIds
            .map(normalizeSynthSystemId)
            .filter((id) => systems[id]);
          set({ visitedSystemIds: cleaned.length ? cleaned : ['arcadia'] });
        }
        if (parsed.unlockedSystemIds?.length) {
          const systems = get().systems;
          const cleanedUnlocked = stripLegacyGuaranteedUnlockIdsForProduction(
            parsed.unlockedSystemIds
              .map(normalizeSynthSystemId)
              .filter((id) => systems[id]),
            parsed.lastExpansionAtMs,
          );
          set({
            unlockedSystemIds: cleanedUnlocked.length
              ? Array.from(new Set([...DEFAULT_UNLOCKED_SYSTEM_IDS, ...cleanedUnlocked]))
              : Array.from(new Set([...DEFAULT_UNLOCKED_SYSTEM_IDS])),
          });
        }
        if (typeof parsed.lastExpansionAtMs === 'number' || parsed.lastExpansionAtMs === null) {
          set({ lastExpansionAtMs: parsed.lastExpansionAtMs ?? null });
        }
      }
    } catch {
      /* ignore */
    } finally {
      const state = get();
      const systems = rehydrateUnlockedSynthSystems(state.systems, state.unlockedSystemIds);
      if (systems !== state.systems) {
        set({ systems });
      }
      set({ loaded: true });
    }
  },

  persistWorld: async () => {
    const { visitedSystemIds, unlockedSystemIds, lastExpansionAtMs } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ visitedSystemIds, unlockedSystemIds, lastExpansionAtMs }),
    );
    scheduleUserCloudSync();
  },

  resetLocalWorld: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    const unlockedSystemIds = Array.from(new Set([...DEFAULT_UNLOCKED_SYSTEM_IDS]));
    set({
      systems: rehydrateUnlockedSynthSystems({ ...GALAXY_SYSTEMS }, unlockedSystemIds),
      loaded: true,
      selectedSystemId: null,
      visitedSystemIds: ['arcadia'],
      unlockedSystemIds,
      lastExpansionAtMs: null,
    });
  },

  getSystem: (id) => get().systems[id],

  selectSystem: (id) => set({ selectedSystemId: id }),

  markVisited: (id) => {
    const { visitedSystemIds } = get();
    if (visitedSystemIds.includes(id)) return;
    set({ visitedSystemIds: [...visitedSystemIds, id] });
    void get().persistWorld();
  },

  isSystemUnlocked: (id) => get().unlockedSystemIds.includes(id),

  unlockSystem: (id, source = 'manual') => {
    const state = get();
    const normalizedId = normalizeSynthSystemId(id);
    const target = state.systems[normalizedId];
    if (!target) return;
    if (state.unlockedSystemIds.includes(normalizedId)) return;
    const unlockedSystemIds = [...state.unlockedSystemIds, normalizedId];
    const nextSystems = { ...state.systems };
    nextSystems[normalizedId] = applySynthSystemAutogen(target);
    set({
      systems: nextSystems,
      unlockedSystemIds,
      lastExpansionAtMs:
        source === 'arc_core_daily' ? Date.now() : state.lastExpansionAtMs,
    });
    void get().persistWorld();
  },

  pickNextUnlockCandidateNearCurrent: (currentSystemId) => {
    const state = get();
    const systems = state.systems;
    const unlocked = new Set(state.unlockedSystemIds);
    const pickNeighborBy = (fromId: string, pred: (id: string) => boolean): string | null => {
      const sys = systems[fromId];
      if (!sys) return null;
      for (const cid of sys.connections) {
        if (unlocked.has(cid)) continue;
        if (!systems[cid]) continue;
        if (pred(cid)) return cid;
      }
      return null;
    };
    const current = currentSystemId ? systems[currentSystemId] : null;
    const fromIds = current ? [current.id] : state.unlockedSystemIds;
    // 1) 아크코어 정책: 기존 미개척(legacy synth) frontier를 우선 개방
    for (const fromId of fromIds) {
      const legacy = pickNeighborBy(fromId, isLegacySynthSystemId);
      if (legacy) return legacy;
    }
    // 2) 그다음 미발견 확장(expansion synth) frontier
    for (const fromId of fromIds) {
      const expansion = pickNeighborBy(fromId, isExpansionSynthSystemId);
      if (expansion) return expansion;
    }
    // 3) 마지막으로 타입 무관 frontier
    for (const fromId of fromIds) {
      const any = pickNeighborBy(fromId, () => true);
      if (any) return any;
    }
    // fallback: 전체 연결 그래프에서 잠금 노드 하나
    for (const sys of Object.values(systems)) {
      if (!unlocked.has(sys.id)) continue;
      for (const cid of sys.connections) {
        if (!unlocked.has(cid) && systems[cid]) return cid;
      }
    }
    // fail-safe: 차수 캡/그래프 단절로 frontier가 비는 경우에도
    // 잠금 성계 1개를 반환해 월드 확장이 멈추지 않게 한다.
    for (const sys of Object.values(systems)) {
      if (!unlocked.has(sys.id)) return sys.id;
    }
    return null;
  },

  pickArcCoreDailyUnlockCandidate: (currentSystemId) => {
    const state = get();
    const systems = state.systems;
    const unlocked = new Set(state.unlockedSystemIds);
    const unlockedIds = state.unlockedSystemIds.filter((id) => systems[id]).sort();
    const orderedFromIds =
      currentSystemId && systems[currentSystemId]
        ? [currentSystemId, ...unlockedIds.filter((id) => id !== currentSystemId)]
        : unlockedIds;
    /** 이미 개방된 성계와 연결선으로 붙은 잠금 synth만 모은다(미개척 004 = synth_004 등). */
    const collectFrontierSynthIds = (pred: (id: string) => boolean): string[] => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const fromId of orderedFromIds) {
        const sys = systems[fromId];
        if (!sys) continue;
        for (const cid of [...sys.connections].sort()) {
          if (unlocked.has(cid)) continue;
          const t = systems[cid];
          if (!t || !cid.startsWith('synth_')) continue;
          if (!pred(cid)) continue;
          if (seen.has(cid)) continue;
          seen.add(cid);
          out.push(cid);
        }
      }
      return out;
    };
    const pickRandom = (ids: string[]): string | null => {
      if (ids.length === 0) return null;
      const i = Math.floor(Math.random() * ids.length);
      return ids[i] ?? null;
    };
    const legacyFrontier = collectFrontierSynthIds(isLegacySynthSystemId);
    const legacyPick = pickRandom(legacyFrontier);
    if (legacyPick) return legacyPick;
    const expansionFrontier = collectFrontierSynthIds(isExpansionSynthSystemId);
    return pickRandom(expansionFrontier);
  },
}));
