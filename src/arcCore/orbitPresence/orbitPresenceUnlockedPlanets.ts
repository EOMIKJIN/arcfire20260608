// ============================================================
// 궤도 주둔(3h) — 코어 개방(A+B) 행성 풀 단일 정본
// ============================================================

import { listCoreOpenGameplayPlanetIds } from '../../world/coreOpenGameplayPlanets';

type WorldIdentity = {
  loaded?: boolean;
  unlockedSystemIds?: readonly string[];
  synthColonizationPhaseByPlanetId?: object;
  systems?: object;
};

function readWorldIdentity(): WorldIdentity | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    return useWorldStore.getState();
  } catch {
    return null;
  }
}

let cachedIds: readonly string[] | null = null;
let cachedSig = '';
let sawLoaded = false;
let sawUnlocked: readonly string[] | null = null;
let sawPhase: object | null = null;
let sawSystems: object | null = null;

/**
 * 개방 행성 목록은 월드 참조가 바뀔 때만 다시 만든다.
 * 스파이 틱이 매초 join 하면 전 행성 배열이 네이티브 힙에 남는다.
 */
function ensureUnlockedPlanetCache(): { ids: readonly string[]; sig: string } {
  const world = readWorldIdentity();
  const loaded = !!world?.loaded;
  const unlocked = world?.unlockedSystemIds ?? null;
  const phase = world?.synthColonizationPhaseByPlanetId ?? null;
  const systems = world?.systems ?? null;
  if (
    cachedIds
    && sawLoaded === loaded
    && sawUnlocked === unlocked
    && sawPhase === phase
    && sawSystems === systems
  ) {
    return { ids: cachedIds, sig: cachedSig };
  }
  const ids = listCoreOpenGameplayPlanetIds();
  cachedIds = ids;
  cachedSig = ids.join(',');
  sawLoaded = loaded;
  sawUnlocked = unlocked;
  sawPhase = phase;
  sawSystems = systems;
  return { ids, sig: cachedSig };
}

/** 코어 개방(A + B→A synth) 행성 id — 테이블 주둔 3h 순환 풀 */
export function listUnlockedPlanetIdsForOrbitPresence(): string[] {
  return ensureUnlockedPlanetCache().ids.slice();
}

/** presence world index 캐시 키 — 개방 집합 변경 시 무효화 */
export function readUnlockedPlanetIdsSig(): string {
  return ensureUnlockedPlanetCache().sig;
}
