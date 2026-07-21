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

type Persisted = { byPlanetId: Record<string, DynamicContestedZoneEntry> };

let mem: Persisted = { byPlanetId: {} };
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

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
            mem = { byPlanetId: clean };
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

  mem = {
    byPlanetId: {
      ...mem.byPlanetId,
      [planetId]: { planetId, systemId, promotedAtMs: Date.now(), source: input.source },
    },
  };
  await persistDynamicContestedZones();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[territorial] 동적 분쟁지역 편입: ${planetId} (${systemId}) source=${input.source}`);
  }
  return true;
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

/** 계정 초기화 — 플레이어 전투로 편입된 동적 분쟁지역 전체 리셋(정적 3곳으로 복귀) */
export async function resetDynamicContestedZonesForAccountPurge(): Promise<void> {
  mem = { byPlanetId: {} };
  hydrated = true;
  hydratePromise = Promise.resolve();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
