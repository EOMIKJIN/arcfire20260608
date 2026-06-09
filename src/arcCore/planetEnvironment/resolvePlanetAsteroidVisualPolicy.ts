// ============================================================
// 아크코어 — 행성 환경 기반 소행성 비주얼 정책
// - 광물 종 수 ≠ 소행성 개수 (1:1 매핑 금지)
// - 비주얼 슬롯 1~3, 표시 광물은 존 풀 1~3종 중 슬롯별 결정론적 선택
// ============================================================

import { STAR_SYSTEMS } from '../../data/systems';
import type { Planet } from '../../types';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import {
  listZonePoolMineralIds,
  resolveZonePrimaryMineralId,
} from '../economy/mineralCatalogRegistry';

export const ASTEROID_VISUAL_ORBIT_MIN = 1;
export const ASTEROID_VISUAL_ORBIT_MAX = 3;

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function planetIdSeed(planetId: string): number {
  let s = 0;
  for (let i = 0; i < planetId.length; i += 1) {
    s += planetId.charCodeAt(i) * (i + 17);
  }
  return s;
}

export function findPlanetById(planetId: string): Planet | null {
  for (const system of Object.values(STAR_SYSTEMS)) {
    const planet = system.planets.find((p) => p.id === planetId);
    if (planet) return planet;
  }
  return null;
}

/** 환경·자원·기술 지표(0..100) → 0..1 */
function environmentMiningScore(planet: Planet): number {
  return (
    planet.coreEnvironment * 0.45
    + planet.coreResource * 0.35
    + planet.coreTechnology * 0.15
    + planet.coreDefense * 0.05
  ) / 100;
}

/**
 * 행성 환경(CSV 시드·코어 지표) 기준 궤도 소행성 **비주얼** 개수(1~3).
 * 매장 share·광물 종 수와 무관.
 */
export function resolvePlanetAsteroidOrbitCountFromEnvironment(planetId: string): number {
  const planet = findPlanetById(planetId);
  if (!planet) return ASTEROID_VISUAL_ORBIT_MIN;

  const score = environmentMiningScore(planet);
  const jitter = pseudoRandom(planetIdSeed(planetId)) * 0.12;
  const combined = score + jitter;

  if (combined < 0.38) return 1;
  if (combined < 0.72) return 2;
  return ASTEROID_VISUAL_ORBIT_MAX;
}

function resolveZoneIndexForPlanet(planetId: string): number {
  const system = Object.values(STAR_SYSTEMS).find((s) => s.planets.some((p) => p.id === planetId));
  return Math.max(1, Math.min(21, Math.round(resolvePlanetZoneIndex(planetId, system ?? null))));
}

/** 행성에 표시·채굴 UI용으로 쓸 광물 종류 수(1~3) — 존 풀 상한 */
export function resolvePlanetAsteroidDisplayMineralKindCount(planetId: string): number {
  const zoneIndex = resolveZoneIndexForPlanet(planetId);
  const pool = listZonePoolMineralIds(zoneIndex);
  const poolCap = Math.max(1, pool.length);
  const planet = findPlanetById(planetId);
  const resource01 = planet ? planet.coreResource / 100 : 0.5;

  let kinds = 1;
  if (resource01 >= 0.38) kinds = 2;
  if (resource01 >= 0.62) kinds = 3;
  return Math.min(ASTEROID_VISUAL_ORBIT_MAX, poolCap, kinds);
}

/** 표시용 광물 id 풀(1~3종) — 존 풀에서 결정론적 추출 */
export function resolvePlanetAsteroidDisplayMineralPool(planetId: string): string[] {
  const zoneIndex = resolveZoneIndexForPlanet(planetId);
  const pool = listZonePoolMineralIds(zoneIndex);
  const primary = pool[0] ?? resolveZonePrimaryMineralId(zoneIndex);
  if (pool.length <= 1) return [primary];

  const kindCount = resolvePlanetAsteroidDisplayMineralKindCount(planetId);
  const ordered = [primary, ...pool.filter((id) => id !== primary)];
  const seed = planetIdSeed(planetId);
  const picked: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < kindCount && picked.length < kindCount; i += 1) {
    const start = Math.floor(pseudoRandom(seed + i * 41) * ordered.length);
    for (let j = 0; j < ordered.length; j += 1) {
      const id = ordered[(start + j) % ordered.length]!;
      if (used.has(id)) continue;
      used.add(id);
      picked.push(id);
      break;
    }
  }

  return picked.length > 0 ? picked : [primary];
}

/** 소행성 슬롯별 표시 광물 — display 풀(1~3종)에서 슬롯마다 결정론적 선택 */
export function resolvePlanetAsteroidVisualMineralIds(planetId: string, slotCount: number): string[] {
  const count = Math.max(0, Math.floor(slotCount));
  if (count <= 0) return [];

  const displayPool = resolvePlanetAsteroidDisplayMineralPool(planetId);
  const seed = planetIdSeed(planetId);

  return Array.from({ length: count }, (_, slotIndex) => {
    const roll = pseudoRandom(seed + slotIndex * 97 + 13);
    const idx = Math.min(displayPool.length - 1, Math.floor(roll * displayPool.length));
    return displayPool[idx] ?? displayPool[0] ?? 'ore_ferrite';
  });
}
