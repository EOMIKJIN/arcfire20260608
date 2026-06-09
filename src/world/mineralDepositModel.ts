/**
 * 광물 매장 **자동 배치 기반** (테이블 → 행성별 비율).
 *
 * - 아이템 테이블(`item_defs.csv`의 `galactic_mineral` 태그 + `attrs.poolWeight`) 가중을 정규화한 뒤,
 * - 지역(`mineral_regions`)의 `clusterShareOfGalaxy`만큼 은하 매장을 할당하고,
 * - 지역에 속한 행성(`mineral_region_members`)에 **균등 분배**한다.
 *
 * 추후: 행성 타입·군집 속성별 가중(`planetMineralWeight` 등)을 곱해 같은 테이블 파이프라인에서 확장.
 * 전 프로필 집계·지표 반영: `computeGalaxyMineralUniverseStats` + 아크코어 `runPlanetEnergyCorePass`.
 *
 * 로드맵(광물 생성·관리): 현재는 CSV→생성 TS가 정본. 이후에는 **아크코어가 DB(행성 광물 레저)** 를
 * 읽어 `PlanetMineralDepositProfile` 동등 구조를 채우고, 소행성 스폰·소모·재생을 같은 서브코어 축에서
 * 돌리며, **`planetCoreRuntimeStore`의 Resource 등 지표**를 광물 정책의 입력으로 쓴다(지표↔광물 루프).
 */

import type { PlanetMineralDepositProfile } from '../types';
import {
  filterMineralIdsForPlanetZone,
  resolveZonePrimaryMineralId,
} from '../arcCore/economy/mineralTradePricing';
import {
  ASTEROID_VISUAL_ORBIT_MAX,
  ASTEROID_VISUAL_ORBIT_MIN,
  resolvePlanetAsteroidOrbitCountFromEnvironment,
  resolvePlanetAsteroidVisualMineralIds,
} from '../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetZoneIndex } from '../arcCore/planetBalance/planetZoneIndexRegistry';
import { ORBIT_ASTEROID_MINING_ENABLED } from '../game/miningConfig';
import {
  GALACTIC_MINERAL_POOL_FROM_CSV,
  MINERAL_REGION_MEMBERS_FROM_CSV,
  MINERAL_REGIONS_FROM_CSV,
} from '../data/generated/csvMineralEconomy';
import { STAR_SYSTEMS } from '../data/systems';
import { getPlanetRecord } from './planetTradePortDb';

const KNOWN_PLANET_IDS = new Set<string>();
for (const sys of Object.values(STAR_SYSTEMS)) {
  for (const p of sys.planets) {
    KNOWN_PLANET_IDS.add(p.id);
  }
}

/** 은하 전체에서 광물별 상대 비율 (합계 1) — 소스: `item_defs.csv`에서 생성된 풀 */
export function normalizeGalacticMineralMix(): Record<string, number> {
  const entries = GALACTIC_MINERAL_POOL_FROM_CSV.filter((e) => e.mineralId);
  let sum = 0;
  for (const e of entries) {
    sum += Math.max(0, e.poolWeight);
  }
  const out: Record<string, number> = {};
  if (sum <= 0) {
    const u = entries.length > 0 ? 1 / entries.length : 0;
    for (const e of entries) {
      out[e.mineralId] = u;
    }
    return out;
  }
  for (const e of entries) {
    out[e.mineralId] = Math.max(0, e.poolWeight) / sum;
  }
  return out;
}

export interface MineralDepositBuildResult {
  profilesByPlanetId: ReadonlyMap<string, PlanetMineralDepositProfile>;
  warnings: string[];
}

/**
 * 행성 id → 매장 프로필.
 * 테이블에 없는 행성은 맵에 포함되지 않음(추후 기본값·보간 정책을 붙일 수 있음).
 */
export function buildPlanetMineralDepositIndex(): MineralDepositBuildResult {
  const warnings: string[] = [];
  const mix = normalizeGalacticMineralMix();
  const mineralIds = Object.keys(mix);

  const regionShareSum = MINERAL_REGIONS_FROM_CSV.reduce(
    (s, r) => s + Math.max(0, r.clusterShareOfGalaxy),
    0,
  );
  if (regionShareSum > 1.000001) {
    warnings.push(
      `mineral_regions: clusterShareOfGalaxy 합계(${regionShareSum.toFixed(4)})가 1을 초과합니다.`,
    );
  }

  const planetToRegion = new Map<string, string>();
  for (const row of MINERAL_REGION_MEMBERS_FROM_CSV) {
    const pid = row.planetId?.trim();
    const rid = row.regionId?.trim();
    if (!pid || !rid) continue;
    if (planetToRegion.has(pid)) {
      warnings.push(
        `mineral_region_members: 행성 "${pid}"가 중복 지정됨 — 첫 지역(${planetToRegion.get(pid)}) 유지, "${rid}" 무시.`,
      );
      continue;
    }
    if (!KNOWN_PLANET_IDS.has(pid)) {
      warnings.push(
        `mineral_region_members: 행성 "${pid}"가 현재 STAR_SYSTEMS에 없음 — 추후 CSV/은하 확장 시 정합 확인.`,
      );
    }
    planetToRegion.set(pid, rid);
  }

  const membersByRegion = new Map<string, string[]>();
  for (const row of MINERAL_REGION_MEMBERS_FROM_CSV) {
    const pid = row.planetId?.trim();
    const rid = row.regionId?.trim();
    if (!pid || !rid) continue;
    if (planetToRegion.get(pid) !== rid) continue;
    const arr = membersByRegion.get(rid) ?? [];
    arr.push(pid);
    membersByRegion.set(rid, arr);
  }

  const profiles = new Map<string, PlanetMineralDepositProfile>();

  for (const region of MINERAL_REGIONS_FROM_CSV) {
    const share = Math.max(0, region.clusterShareOfGalaxy);
    const planetIds = membersByRegion.get(region.id) ?? [];
    if (share > 0 && planetIds.length === 0) {
      warnings.push(`mineral_regions: 지역 "${region.id}"에 행성이 없어 매장 비율 ${share}이 적용되지 않음.`);
      continue;
    }
    if (planetIds.length === 0) continue;

    const n = planetIds.length;
    for (const planetId of planetIds) {
      const shareOfGalaxyByMineral: Record<string, number> = {};
      for (const m of mineralIds) {
        shareOfGalaxyByMineral[m] = (share * (mix[m] ?? 0)) / n;
      }
      profiles.set(planetId, {
        planetId,
        regionId: region.id,
        shareOfGalaxyByMineral,
      });
    }
  }

  return { profilesByPlanetId: profiles, warnings };
}

/** 개발 시 콘솔에 경고 출력 (프로덕션에서는 호출 생략 가능) */
export function logMineralDepositWarnings(result: MineralDepositBuildResult): void {
  if (result.warnings.length === 0) return;
  console.warn('[mineralDepositModel]', result.warnings.join('\n'));
}

let cachedDepositProfiles: ReadonlyMap<string, PlanetMineralDepositProfile> | null = null;

export function invalidateMineralDepositProfileCache(): void {
  cachedDepositProfiles = null;
}

function resolveZoneIndexForPlanetId(planetId: string): number {
  const planet = getPlanetRecord(planetId);
  const system = planet
    ? Object.values(STAR_SYSTEMS).find((s) => s.planets.some((p) => p.id === planetId))
    : undefined;
  return resolvePlanetZoneIndex(planetId, system ?? null);
}

export const ASTEROID_ORBIT_COUNT_MIN = ASTEROID_VISUAL_ORBIT_MIN;
export const ASTEROID_ORBIT_COUNT_MAX = ASTEROID_VISUAL_ORBIT_MAX;

function getCachedPlanetDepositProfiles(): ReadonlyMap<string, PlanetMineralDepositProfile> {
  if (!cachedDepositProfiles) {
    cachedDepositProfiles = buildPlanetMineralDepositIndex().profilesByPlanetId;
  }
  return cachedDepositProfiles;
}

/** 테이블에 매장 프로필이 있는 행성 = 궤도 채광 소행성 노출 후보 */
export function planetHasMineableOrbitalDeposits(planetId: string): boolean {
  if (!ORBIT_ASTEROID_MINING_ENABLED) return false;
  return getCachedPlanetDepositProfiles().has(planetId);
}

/**
 * 행성별 궤도 소행성 **비주얼** 개수(1~3).
 * - 아크코어 `resolvePlanetAsteroidOrbitCountFromEnvironment` — 행성 환경 지표 기준
 * - 광물 종 수·매장 share와 **무관** (1 광물 = 1 소행성 아님)
 */
export function resolvePlanetAsteroidOrbitCount(planetId: string): number {
  if (!planetHasMineableOrbitalDeposits(planetId)) return 0;
  return resolvePlanetAsteroidOrbitCountFromEnvironment(planetId);
}

/**
 * 행성별 채굴 가능 광물 아이템 id 목록.
 * `shareOfGalaxyByMineral` 가중치가 큰 순으로 정렬해 반환한다.
 */
export function resolvePlanetMineableMineralItemIds(planetId: string): string[] {
  const profile = getCachedPlanetDepositProfiles().get(planetId);
  if (!profile) return [];
  const ranked = Object.entries(profile.shareOfGalaxyByMineral)
    .filter(([, share]) => Number.isFinite(share) && share > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([mineralId]) => mineralId);
  const filtered = filterMineralIdsForPlanetZone(planetId, ranked);
  if (filtered.length > 0) return filtered;
  const zoneIndex = resolveZoneIndexForPlanetId(planetId);
  return [resolveZonePrimaryMineralId(zoneIndex)];
}

/**
 * 행성 소행성 슬롯(궤도 개수) 기준 광물 배정 — 시각용(실제 채굴은 확률 드랍).
 */
export function resolvePlanetAsteroidAssignedMineralIds(planetId: string, orbitCount: number): string[] {
  return resolvePlanetAsteroidVisualMineralIds(planetId, orbitCount);
}
