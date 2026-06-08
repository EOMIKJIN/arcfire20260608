// ============================================================
// 은하 광물 “우주 통계” — `buildPlanetMineralDepositIndex` 프로필 전체를 집계
// - 광물별: 모든 행성의 shareOfGalaxyByMineral 합 → 정규화해 전역 비중(prevalence)
// - 행성별: 총 은하 점유 합으로 richness, 동 집단 내 퍼센타일
// - 행성 광물 구성 vs 전역 비중 정렬도(내적) — 비중 큰 광물 쪽과 맞을수록 높음
// 아크코어 `runPlanetEnergyCorePass`에서 Resource 목표에 사용
//
// 로드맵: 입력 맵이 CSV 빌드 대신 **DB 스냅샷**이 되어도 동일 시그니처로 집계하면 된다.
// 아크코어는 DB를 직접 두지 않고, “프로필 맵 공급자” 한 겹을 두고 여기로 넘긴다.
//
// 되는: 입력 맵에 **있는** 행성만으로 전역 prevalence·퍼센타일·정렬도 계산(결정적).
// 안 되는: 맵에 없는 행성은 여기서 **존재하지 않는 것과 동일**; 월드 전체와 1:1 대응이 아님.
// ============================================================

import type { PlanetMineralDepositProfile } from '../types';

export interface GalaxyMineralUniverseStats {
  /** 광물 id → 전 우주(프로필 행성 합산) 상대 비중, 합 1 */
  mineralPrevalence: Record<string, number>;
  /** 행성 id → 은하 점유 합계(sum_m share) */
  planetTotalGalaxyShare: Record<string, number>;
  /** 행성 id → [0,1] 풍부도 퍼센타일(총 점유가 클수록 큼) */
  planetRichnessPercentile: Record<string, number>;
  /** 프로필이 있는 행성 수 */
  profilePlanetCount: number;
}

function sumRecord(rec: Record<string, number>): number {
  let s = 0;
  for (const v of Object.values(rec)) {
    s += Math.max(0, v);
  }
  return s;
}

/**
 * `buildPlanetMineralDepositIndex().profilesByPlanetId` 를 넣어 전역 통계를 만든다.
 */
export function computeGalaxyMineralUniverseStats(
  profilesByPlanetId: ReadonlyMap<string, PlanetMineralDepositProfile>,
): GalaxyMineralUniverseStats {
  const mineralAgg: Record<string, number> = {};
  const planetTotalGalaxyShare: Record<string, number> = {};

  for (const prof of profilesByPlanetId.values()) {
    const t = sumRecord(prof.shareOfGalaxyByMineral);
    planetTotalGalaxyShare[prof.planetId] = t;
    for (const [m, v] of Object.entries(prof.shareOfGalaxyByMineral)) {
      if (!m) continue;
      mineralAgg[m] = (mineralAgg[m] ?? 0) + Math.max(0, v);
    }
  }

  const sumMinerals = sumRecord(mineralAgg);
  const mineralPrevalence: Record<string, number> = {};
  if (sumMinerals > 0) {
    for (const [m, v] of Object.entries(mineralAgg)) {
      mineralPrevalence[m] = Math.max(0, v) / sumMinerals;
    }
  }

  const entries = Object.entries(planetTotalGalaxyShare).sort((a, b) => a[1] - b[1]);
  const n = entries.length;
  const planetRichnessPercentile: Record<string, number> = {};
  if (n === 0) {
    return { mineralPrevalence, planetTotalGalaxyShare, planetRichnessPercentile, profilePlanetCount: 0 };
  }
  if (n === 1) {
    planetRichnessPercentile[entries[0]![0]] = 0.5;
    return {
      mineralPrevalence,
      planetTotalGalaxyShare,
      planetRichnessPercentile,
      profilePlanetCount: 1,
    };
  }
  for (let i = 0; i < n; i++) {
    const [pid] = entries[i]!;
    planetRichnessPercentile[pid] = i / (n - 1);
  }

  return {
    mineralPrevalence,
    planetTotalGalaxyShare,
    planetRichnessPercentile,
    profilePlanetCount: n,
  };
}

/**
 * 행성 광물 구성(정규화)과 전역 prevalence 벡터의 정렬도 [0,1].
 * 전 우주에서 비중이 큰 광물을 많이 가진 행성일수록 값이 커진다.
 */
export function planetMineralAlignmentWithGalaxy(
  profile: PlanetMineralDepositProfile,
  mineralPrevalence: Record<string, number>,
): number {
  const t = sumRecord(profile.shareOfGalaxyByMineral);
  if (t <= 0) return 0;
  let dot = 0;
  for (const [m, raw] of Object.entries(profile.shareOfGalaxyByMineral)) {
    const p = Math.max(0, raw) / t;
    dot += p * (mineralPrevalence[m] ?? 0);
  }
  return Math.max(0, Math.min(1, dot));
}
