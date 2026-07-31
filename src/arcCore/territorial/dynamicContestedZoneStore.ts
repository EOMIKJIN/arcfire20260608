// ============================================================
// 동적 분쟁지역 — 플레이어가 전투(웨이브)를 치른 국가 시드 행성을
// ArcCore 순차 캠페인(draco_front 로테이션·한 번에 1곳 판정)에 자동 편입한다.
// CSV 3곳(draco_haven·omega_hub·shadow_market) 뒤 순번으로 합류(예: 시리우스=4번째).
// 정책 합성은 arcCoreTerritorialCombatPolicy.listDynamicContestedPolicies가 담당(순환 import 방지).
// 플레이어 인터랙티브 진행 → 계정 초기화 시 함께 리셋(purgeLocalAccountData).
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

const STORAGE_KEY = 'arcfire_dynamic_contested_zones_v1';

/** 정책·함대 CSV 공통 템플릿 행 planetId — 직접 판정 대상 아님(enabled=false) */
export const DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID = '__dynamic_default__';

export type DynamicContestedZoneEntry = {
  planetId: string;
  systemId: string;
  promotedAtMs: number;
  /** 편입 계기 (예: player_wave_defense) */
  source: string;
};

type Persisted = {
  byPlanetId: Record<string, DynamicContestedZoneEntry>;
  /** planetId → 강등 시각(ms) — 풀 거버너 재승격 쿨다운 판단용(2026-07-31, bounded·주기적 정리) */
  recentlyDemoted?: Record<string, number>;
};

/** 풀 거버너(arc_frontline·arc_strategic_neutral) 소스 태그 접두 — 계정 purge 시 월드축이라 보존 대상 */
export const CONTESTED_POOL_GOVERNOR_SOURCE_PREFIX = 'arc_';

let mem: Persisted = { byPlanetId: {} };
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

// 정책 목록 revision 캐시(arcCoreTerritorialCombatPolicy.listTerritorialCombatPolicies 등)가
// mem 변경 시에만 재빌드하도록 하는 세대 카운터 — mem을 바꾸는 모든 지점은 setMem()을 거쳐야 함.
let revision = 0;
function setMem(next: Persisted): void {
  mem = next;
  revision += 1;
}

/** 정책 목록 캐시 무효화 판단용 세대값 — mem이 바뀔 때마다 증가 */
export function getDynamicContestedZoneRevision(): number {
  return revision;
}

// ---- 풀 거버너(contestedPoolGovernorSync.ts) dirty 플래그 — 여기 둔 이유: clanWarFoundationStore.ts가
// hold 변경 시 markContestedPoolDirty()를 호출해야 하는데, 거버너 glue 모듈은 useClanWarFoundationStore를
// import하므로 거기 두면 순환 참조가 된다. 이 파일은 zustand import가 없어 안전하다(2026-07-31). ----
let contestedPoolDirty = true;

/** hold 변경(applyArcCoreTerritorialHold 등) 시 호출 — 다음 territorial pass에서 1회만 rebalance */
export function markContestedPoolDirty(): void {
  contestedPoolDirty = true;
}

export function isContestedPoolDirty(): boolean {
  return contestedPoolDirty;
}

export function clearContestedPoolDirty(): void {
  contestedPoolDirty = false;
}

// ---- CSV 정적 행 runtime suspend(2026-07-31, contested-active-pool-ui-fix) ----
// SAFE(완포위)로 판정된 CSV 정적 행(파일 삭제 금지)을 ActivePool·캠페인·지도 링에서 제외하기 위한
// 런타임 오버레이. 풀 거버너 rebalance가 매번 전체 재계산해 갱신(파생 캐시라 persist 불필요 —
// 부트 후 dirty=true라 첫 territorial pass에서 곧바로 채워짐). 이 파일은 zustand import가 없어
// listTerritorialCombatPolicies()(arcCoreTerritorialCombatPolicy.ts)가 순환참조 없이 안전하게 참조 가능.
let suspendedStaticPlanetIds: ReadonlySet<string> = new Set();
let suspendRevision = 0;

/** 풀 거버너 rebalance 후 호출 — 내용이 실제로 바뀔 때만 revision bump(정책 캐시 불필요한 무효화 방지) */
export function setSuspendedStaticPlanetIds(ids: ReadonlySet<string>): void {
  const changed =
    ids.size !== suspendedStaticPlanetIds.size
    || [...ids].some((id) => !suspendedStaticPlanetIds.has(id));
  suspendedStaticPlanetIds = ids;
  if (changed) suspendRevision += 1;
}

export function isSuspendedStaticPlanetId(planetId: string): boolean {
  return suspendedStaticPlanetIds.has(planetId);
}

/** listTerritorialCombatPolicies() 캐시 무효화 판단용 — suspend 상태 변경 시에만 증가 */
export function getContestedSuspendRevision(): number {
  return suspendRevision;
}

let systemIdSetCache: { rev: number; set: ReadonlySet<string> } | null = null;

/** 동적 편입 systemId Set — O(1) 조회용, mem 변경 시에만 재계산(revision 캐시) */
export function listDynamicContestedZoneSystemIdSet(): ReadonlySet<string> {
  if (systemIdSetCache && systemIdSetCache.rev === revision) return systemIdSetCache.set;
  const set = new Set(Object.values(mem.byPlanetId).map((e) => e.systemId));
  systemIdSetCache = { rev: revision, set };
  return set;
}

export async function hydrateDynamicContestedZones(): Promise<void> {
  if (hydrated) return;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Persisted>;
          if (parsed.byPlanetId && typeof parsed.byPlanetId === 'object') {
            const clean: Record<string, DynamicContestedZoneEntry> = {};
            for (const [planetId, entry] of Object.entries(parsed.byPlanetId)) {
              if (!entry || typeof entry !== 'object') continue;
              const systemId = String((entry as DynamicContestedZoneEntry).systemId ?? '').trim();
              if (!planetId.trim() || !systemId) continue;
              clean[planetId] = {
                planetId,
                systemId,
                promotedAtMs: Number((entry as DynamicContestedZoneEntry).promotedAtMs) || 0,
                source: String((entry as DynamicContestedZoneEntry).source ?? ''),
              };
            }
            const cleanDemoted: Record<string, number> = {};
            if (parsed.recentlyDemoted && typeof parsed.recentlyDemoted === 'object') {
              for (const [planetId, atMs] of Object.entries(parsed.recentlyDemoted)) {
                const n = Number(atMs);
                if (planetId.trim() && Number.isFinite(n) && n > 0) cleanDemoted[planetId] = n;
              }
            }
            setMem({ byPlanetId: clean, recentlyDemoted: cleanDemoted });
          }
        }
      } catch {
        /* ignore */
      } finally {
        hydrated = true;
      }
    })();
  }
  await hydratePromise;
}

async function persistDynamicContestedZones(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

/** 동적 편입 여부(동기) — hydrate 전에는 false (부트 로드에서 hydrate 선행) */
export function isDynamicContestedZonePlanet(planetId: string): boolean {
  return Boolean(mem.byPlanetId[planetId]);
}

export function listDynamicContestedZoneEntries(): DynamicContestedZoneEntry[] {
  return Object.values(mem.byPlanetId);
}

export function listDynamicContestedZoneSystemIds(): string[] {
  return Array.from(new Set(Object.values(mem.byPlanetId).map((e) => e.systemId)));
}

/**
 * 플레이어 전투 발생 행성 → 분쟁지역 승격 (idempotent).
 * CSV 정적 분쟁지역·정책 보유 행성은 편입하지 않는다(이중 판정 방지).
 */
export async function promoteDynamicContestedZone(input: {
  planetId: string;
  systemId: string;
  source: string;
}): Promise<boolean> {
  const planetId = input.planetId.trim();
  const systemId = input.systemId.trim();
  if (!planetId || !systemId) return false;
  if (planetId === DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID) return false;
  // CSV 정본 정책이 이미 있는 행성(정적 분쟁 3곳 등)은 그대로 CSV 규칙 사용
  // (정책 모듈 순환 import 방지 — generated CSV 행 존재만 직접 확인)
  if (ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV.some((r) => r.planetId === planetId)) {
    return false;
  }

  await hydrateDynamicContestedZones();
  if (mem.byPlanetId[planetId]) return false;

  setMem({
    byPlanetId: {
      ...mem.byPlanetId,
      [planetId]: { planetId, systemId, promotedAtMs: Date.now(), source: input.source },
    },
  });
  await persistDynamicContestedZones();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[territorial] 동적 분쟁지역 편입: ${planetId} (${systemId}) source=${input.source}`);
  }
  return true;
}

/**
 * 풀 거버너 강등(2026-07-31) — 동적 편입(arc_*·player 무관) 항목을 store에서 제거하고
 * 재승격 쿨다운 판단용 시각을 기록한다. CSV 정적 5행은 이 함수의 대상이 아님(파일 삭제 금지 —
 * SAFE 스킵 게이트로만 런타임 제외, arcCoreTerritorialCombatState.ts 참고).
 */
export async function demoteDynamicContestedZone(planetId: string): Promise<boolean> {
  await hydrateDynamicContestedZones();
  if (!mem.byPlanetId[planetId]) return false;
  const nextByPlanetId = { ...mem.byPlanetId };
  delete nextByPlanetId[planetId];
  setMem({
    byPlanetId: nextByPlanetId,
    recentlyDemoted: { ...(mem.recentlyDemoted ?? {}), [planetId]: Date.now() },
  });
  await persistDynamicContestedZones();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[territorial] 동적 분쟁지역 강등: ${planetId}`);
  }
  return true;
}

/** 강등 후 쿨다운(재승격 방지) — cooldownMs 이내면 true. 하이드레이트 전에는 안전 기본값 false(차단 없음). */
export function isRecentlyDemoted(planetId: string, cooldownMs: number, nowMs: number): boolean {
  const demotedAtMs = mem.recentlyDemoted?.[planetId];
  if (!demotedAtMs) return false;
  return nowMs - demotedAtMs < cooldownMs;
}

/** 오래된 recentlyDemoted 항목 정리(무한 누적 방지) — 거버너 rebalance 시 1회 호출 권장 */
export async function pruneExpiredRecentlyDemoted(cooldownMs: number, nowMs: number): Promise<void> {
  const src = mem.recentlyDemoted;
  if (!src) return;
  const next: Record<string, number> = {};
  let changed = false;
  for (const [planetId, atMs] of Object.entries(src)) {
    if (nowMs - atMs < cooldownMs) {
      next[planetId] = atMs;
    } else {
      changed = true;
    }
  }
  if (!changed) return;
  setMem({ byPlanetId: mem.byPlanetId, recentlyDemoted: next });
  await persistDynamicContestedZones();
}

/** 플레이어 웨이브 전투 작전 기록 소스 — 소급 편입 대상 */
const PLAYER_COMBAT_OP_SOURCES: readonly string[] = ['player_wave_defense_win'];

/**
 * 소급 편입 — 편입 트리거 도입(2026-07-21) 이전에 이미 전투가 벌어진 행성(예: 시리우스)을
 * 작전 기록(operations)으로 찾아 분쟁지역에 합류시킨다. idempotent.
 */
export async function promoteDynamicContestedZonesFromOperations(
  operations: ReadonlyArray<{
    targetPlanetId: string;
    phase: string;
    ext?: Record<string, unknown>;
  }>,
  resolveSystemId: (planetId: string) => string | null,
): Promise<number> {
  await hydrateDynamicContestedZones();
  let promoted = 0;
  for (const op of operations) {
    if (op.phase !== 'resolved') continue;
    const source = String(op.ext?.source ?? '');
    if (!PLAYER_COMBAT_OP_SOURCES.includes(source)) continue;
    const planetId = op.targetPlanetId?.trim();
    if (!planetId || mem.byPlanetId[planetId]) continue;
    const systemId = resolveSystemId(planetId);
    if (!systemId) continue;
    const ok = await promoteDynamicContestedZone({ planetId, systemId, source: `retro:${source}` });
    if (ok) promoted += 1;
  }
  return promoted;
}

/**
 * 계정 초기화 — 플레이어 전투(`player_wave*`)로 편입된 동적 분쟁지역만 리셋.
 * 풀 거버너가 승격한 `arc_*`(arc_frontline·arc_strategic_neutral) 항목은 **월드축**(플레이어
 * 귀속 진행이 아니라 ArcCore 세계 상태)이라 계정 purge와 무관하게 보존한다(2026-07-31, M6 계약).
 * recentlyDemoted(쿨다운)는 계정 상태와 무관하지만 단순화를 위해 함께 초기화.
 */
export async function resetDynamicContestedZonesForAccountPurge(): Promise<void> {
  const preserved: Record<string, DynamicContestedZoneEntry> = {};
  for (const [planetId, entry] of Object.entries(mem.byPlanetId)) {
    if (entry.source.startsWith(CONTESTED_POOL_GOVERNOR_SOURCE_PREFIX)) {
      preserved[planetId] = entry;
    }
  }
  setMem({ byPlanetId: preserved });
  hydrated = true;
  hydratePromise = Promise.resolve();
  try {
    if (Object.keys(preserved).length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
