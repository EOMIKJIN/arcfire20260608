// ============================================================
// 행성 총사령관 예비 풀 — CSV O(1) · 팩션별 순환 배정
// ============================================================

import {
  PLANET_GOVERNOR_RESERVE_COMMANDERS_FROM_CSV,
  type PlanetGovernorReserveCommanderRow,
} from '../../data/generated';

export type GovernorOccupationSide = PlanetGovernorReserveCommanderRow['occupationSide'];

const RESERVE_BY_SIDE: Readonly<Record<GovernorOccupationSide, readonly PlanetGovernorReserveCommanderRow[]>> =
  (() => {
    const buckets: Record<GovernorOccupationSide, PlanetGovernorReserveCommanderRow[]> = {
      BLUE: [],
      RED: [],
      NEUTRAL: [],
    };
    for (const row of PLANET_GOVERNOR_RESERVE_COMMANDERS_FROM_CSV) {
      if (!row.enabled) continue;
      buckets[row.occupationSide].push(row);
    }
    for (const side of Object.keys(buckets) as GovernorOccupationSide[]) {
      buckets[side].sort((a, b) => a.reserveOrder - b.reserveOrder);
    }
    return buckets;
  })();

const RESERVE_BY_CAPTAIN_ID: ReadonlyMap<string, PlanetGovernorReserveCommanderRow> = (() => {
  const map = new Map<string, PlanetGovernorReserveCommanderRow>();
  for (const row of PLANET_GOVERNOR_RESERVE_COMMANDERS_FROM_CSV) {
    map.set(row.captainId, row);
  }
  return map;
})();

export function listGovernorReserveCommanders(
  side: GovernorOccupationSide,
): readonly PlanetGovernorReserveCommanderRow[] {
  return RESERVE_BY_SIDE[side];
}

export function getGovernorReserveCommanderById(
  captainId: string,
): PlanetGovernorReserveCommanderRow | null {
  return RESERVE_BY_CAPTAIN_ID.get(captainId) ?? null;
}

/** side별 round-robin — sideNextIndex는 호출측에서 증가 */
export function pickGovernorReserveCommanderAtIndex(
  side: GovernorOccupationSide,
  index: number,
): PlanetGovernorReserveCommanderRow | null {
  const pool = RESERVE_BY_SIDE[side];
  if (pool.length === 0) return null;
  const normalized = ((index % pool.length) + pool.length) % pool.length;
  return pool[normalized] ?? null;
}
