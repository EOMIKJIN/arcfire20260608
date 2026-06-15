// ============================================================
// 행성 허브 궤도 전함 — 렌더·INFO 동시 예산 (GL·뷰·Reanimated 부하)
// v4 §6-2 INFO 5척 · 렌더는 테이블+아크 합산 상한
// ============================================================

import type { ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';

/** Skia·궤도 마크 동시 렌더 상한 (테이블 주둔 + 아크 수송 체류) */
export const PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8;

export function applyPlanetHubOrbitRenderBudget(
  tableRows: NearbyOrbitPresenceRow[],
  arcShips: ArcNpcTrafficShip[],
  max = PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX,
): { tableRows: NearbyOrbitPresenceRow[]; arcShips: ArcNpcTrafficShip[] } {
  const tableCap = Math.min(tableRows.length, max);
  const arcBudget = Math.max(0, max - tableCap);
  return {
    tableRows: tableRows.slice(0, tableCap),
    arcShips: arcShips.slice(0, arcBudget),
  };
}
