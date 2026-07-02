// ============================================================
// 코어 개방(A) + 개방 프론티어(B→A 자동 편입) — 단일 gameplay 풀
//
// A: planets.csv 21성계 (GAMEPLAY_SYSTEM_IDS) — 항상 개방
// B: ArcCore 개방 synth — phase≥1 즉시 A와 동일 기능·설정
// C: 잠금 synth(지도 표시·이동 불가) — 코어 풀 제외
// D/E: 비표시·그래프 제외 — 별도 worldmap 필터
// ============================================================

import { GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import {
  isSynthFrontierPlanetId,
  isSynthFrontierSystemId,
} from './isSynthFrontierPlanetId';
import { resolveSystemIdForPlanetIdFromGalaxy } from './resolvePlanetSystemPosition';

/** 정적 21성계 — A tier baseline */
export const BASELINE_CORE_OPEN_SYSTEM_IDS = GAMEPLAY_SYSTEM_IDS;

export function isBaselineCoreOpenSystemId(systemId: string): boolean {
  return BASELINE_CORE_OPEN_SYSTEM_IDS.has(systemId.trim());
}

function readWorldStoreState():
  | {
      loaded: boolean;
      unlockedSystemIds: string[];
      getSystem: (id: string) => import('../types').StarSystem | undefined;
      getSynthColonizationPhase: (planetId: string) => number;
    }
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../store/worldStore') as typeof import('../store/worldStore');
    return useWorldStore.getState();
  } catch {
    return null;
  }
}

/** 개방 synth(B→A) — unlocked + colonization phase≥1 */
export function isCoreOpenSynthSystemId(systemId: string): boolean {
  const id = systemId?.trim();
  if (!isSynthFrontierSystemId(id)) return false;
  const world = readWorldStoreState();
  if (!world?.loaded) return false;
  if (!world.unlockedSystemIds.includes(id)) return false;
  const system = world.getSystem(id);
  const planetId = system?.planets[0]?.id;
  if (!planetId) return false;
  return world.getSynthColonizationPhase(planetId) >= 1;
}

/** A baseline 또는 B→A 편입 synth */
export function isCoreOpenSystemId(systemId: string): boolean {
  const id = systemId?.trim();
  if (!id) return false;
  if (isBaselineCoreOpenSystemId(id)) return true;
  return isCoreOpenSynthSystemId(id);
}

export function isCanonicalCoreOpenPlanetId(planetId: string): boolean {
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(planetId.trim());
  return systemId ? isBaselineCoreOpenSystemId(systemId) : false;
}

/** A(21 CSV) 또는 B→A 편입 synth 행성 */
export function isCoreOpenPlanetId(planetId: string): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  if (!isSynthFrontierPlanetId(id)) return isCanonicalCoreOpenPlanetId(id);
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(id);
  return systemId ? isCoreOpenSystemId(systemId) : false;
}

/** 통계·경제·궤도 풀 — 21 + 개방 synth (정렬) */
export function listCoreOpenGameplaySystemIds(): string[] {
  const out = new Set<string>(BASELINE_CORE_OPEN_SYSTEM_IDS);
  const world = readWorldStoreState();
  if (world?.loaded) {
    for (const sid of world.unlockedSystemIds) {
      if (isCoreOpenSystemId(sid)) out.add(sid);
    }
  }
  return [...out].sort();
}

export function listCoreOpenGameplayPlanetIds(): string[] {
  const world = readWorldStoreState();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const sid of listCoreOpenGameplaySystemIds()) {
    const sys = world?.getSystem(sid);
    if (!sys) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { STAR_SYSTEMS } = require('../data/systems') as typeof import('../data/systems');
      const staticSys = STAR_SYSTEMS[sid];
      for (const planet of staticSys?.planets ?? []) {
        const pid = String(planet.id ?? '').trim();
        if (!pid || seen.has(pid)) continue;
        seen.add(pid);
        out.push(pid);
      }
      continue;
    }
    for (const planet of sys.planets) {
      const pid = String(planet.id ?? '').trim();
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      out.push(pid);
    }
  }
  out.sort();
  return out;
}

export function countCoreOpenGameplayPlanets(): number {
  return listCoreOpenGameplayPlanetIds().length;
}
