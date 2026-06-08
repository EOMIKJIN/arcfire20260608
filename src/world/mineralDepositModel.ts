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
import { ORBIT_ASTEROID_MINING_ENABLED } from '../game/miningConfig';
import {
  GALACTIC_MINERAL_POOL_FROM_CSV,
  MINERAL_REGION_MEMBERS_FROM_CSV,
  MINERAL_REGIONS_FROM_CSV,
} from '../data/generated/csvMineralEconomy';
import { STAR_SYSTEMS } from '../data/systems';

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
/** 테스트 임시 오버라이드: 전역 채굴 비활성 상태에서도 소행성 노출을 허용할 행성 */
const TEMP_ASTEROID_ENABLED_PLANET_IDS = new Set<string>(['arcadia_prime', 'minerva_deep']);
/** 테스트 임시 오버라이드: 행성별 소행성 개수(향후 CSV로 이관 가능) */
const TEMP_ASTEROID_ORBIT_COUNT_BY_PLANET_ID: Record<string, number> = {
  arcadia_prime: 1,
  minerva_deep: 4,
};
export const ASTEROID_ORBIT_COUNT_MIN = 1;
export const ASTEROID_ORBIT_COUNT_MAX = 10;

function getCachedPlanetDepositProfiles(): ReadonlyMap<string, PlanetMineralDepositProfile> {
  if (!cachedDepositProfiles) {
    cachedDepositProfiles = buildPlanetMineralDepositIndex().profilesByPlanetId;
  }
  return cachedDepositProfiles;
}

/** 테이블에 매장 프로필이 있는 행성 = 궤도 채광 소행성 노출 후보 (`ORBIT_ASTEROID_MINING_ENABLED` 꺼지면 항상 false) */
export function planetHasMineableOrbitalDeposits(planetId: string): boolean {
  if (TEMP_ASTEROID_ENABLED_PLANET_IDS.has(planetId)) return true;
  if (!ORBIT_ASTEROID_MINING_ENABLED) return false;
  return getCachedPlanetDepositProfiles().has(planetId);
}

/**
 * 행성별 궤도 소행성 개수(최소 1 ~ 최대 10).
 * - 현재는 테스트 행성 override 우선
 * - 그 외는 매장 비중(total share) 기반 자동 산정
 * 추후 CSV 컬럼으로 직접 지정 가능하도록 이 API를 단일 진입점으로 유지.
 */
export function resolvePlanetAsteroidOrbitCount(planetId: string): number {
  const override = TEMP_ASTEROID_ORBIT_COUNT_BY_PLANET_ID[planetId];
  if (override != null) {
    return Math.max(ASTEROID_ORBIT_COUNT_MIN, Math.min(ASTEROID_ORBIT_COUNT_MAX, Math.round(override)));
  }
  const profile = getCachedPlanetDepositProfiles().get(planetId);
  if (!profile) return ASTEROID_ORBIT_COUNT_MIN;
  const totalShare = Object.values(profile.shareOfGalaxyByMineral).reduce((s, v) => s + Math.max(0, v), 0);
  // 기본 자동 분포: 매우 작은 share라도 1개는 보장, 상한은 10개.
  const scaled = Math.round(totalShare * 1200);
  return Math.max(ASTEROID_ORBIT_COUNT_MIN, Math.min(ASTEROID_ORBIT_COUNT_MAX, scaled));
}

/**
 * 행성별 채굴 가능 광물 아이템 id 목록.
 * `shareOfGalaxyByMineral` 가중치가 큰 순으로 정렬해 반환한다.
 */
export function resolvePlanetMineableMineralItemIds(planetId: string): string[] {
  const profile = getCachedPlanetDepositProfiles().get(planetId);
  if (!profile) return [];
  return Object.entries(profile.shareOfGalaxyByMineral)
    .filter(([, share]) => Number.isFinite(share) && share > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([mineralId]) => mineralId);
}

/**
 * 행성 소행성 슬롯(궤도 개수) 기준 광물 배정.
 * - 테이블 광물 목록을 순환(round-robin) 배정
 * - 테이블이 비어 있으면 기본 채굴 아이템(`ore_mineral_1`)로 폴백
 */
export function resolvePlanetAsteroidAssignedMineralIds(planetId: string, orbitCount: number): string[] {
  const count = Math.max(ASTEROID_ORBIT_COUNT_MIN, Math.floor(Number.isFinite(orbitCount) ? orbitCount : 0));
  const pool = GALACTIC_MINERAL_POOL_FROM_CSV
    .filter((row) => String(row.mineralId ?? '').trim().length > 0)
    .sort((a, b) => Math.max(0, b.poolWeight) - Math.max(0, a.poolWeight))
    .map((row) => row.mineralId.trim());
  if (pool.length === 0) {
    return Array.from({ length: count }, () => 'ore_mineral_1');
  }
  const start = Math.abs(
    [...planetId].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0),
  ) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}
