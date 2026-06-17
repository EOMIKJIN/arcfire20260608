// ============================================================
// 행성 허브 궤도 전함 — 렌더·INFO 동시 예산 (GL·뷰·Reanimated 부하)
// 표기 우선순위: ① 아크 수송선(보라 ◇) → ② ‹AI› 허브 트래픽 → ③ 행성 체류 전함(테이블)
// ============================================================

import type { ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';

/** Skia·궤도 마크 동시 렌더 상한 (아크 + 테이블 체류 전함) */
export const PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8;

/** 궤도·INFO 마크 표기 우선순위 (숫자 작을수록 높음) */
export const HUB_ORBIT_MARK_PRIORITY = {
  arcTransport: 1,
  hubTraffic: 2,
  tableStationed: 3,
} as const;

/**
 * 궤도 렌더 예산 — 아크 수송선 전량 우선, 행성 체류 전함(테이블)은 남는 슬롯만.
 */
export function applyPlanetHubOrbitRenderBudget(
  tableRows: NearbyOrbitPresenceRow[],
  arcShips: ArcNpcTrafficShip[],
  max = PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX,
): { tableRows: NearbyOrbitPresenceRow[]; arcShips: ArcNpcTrafficShip[] } {
  const arcShown = arcShips.slice(0, Math.min(arcShips.length, max));
  const tableCap = Math.max(0, max - arcShown.length);
  return {
    tableRows: tableRows.slice(0, tableCap),
    arcShips: arcShown,
  };
}

/**
 * INFO·근접 목록 cap — `capHubOrbitPresenceToBudget`와 동일 slice이지만
 * 입력 순서가 우선순위(아크 → 허브 트래픽 → 체류 전함)를 반영해야 한다.
 */
export function capHubOrbitPresenceByRenderPriority(
  arcRows: NearbyOrbitPresenceRow[],
  hubTrafficRows: NearbyOrbitPresenceRow[],
  tableRows: NearbyOrbitPresenceRow[],
  maxActive: number,
): NearbyOrbitPresenceRow[] {
  const merged = [...arcRows, ...hubTrafficRows, ...tableRows];
  if (merged.length <= maxActive) return merged;
  return merged.slice(0, maxActive);
}
