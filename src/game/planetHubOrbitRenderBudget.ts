// ============================================================
// 행성 허브 궤도 전함 — Skia·INFO 단일 소스 (중복 출연 금지 1순위)
// ① 아크 수송선(실제 planetId 체류) → ② 테이블 주둔 전함(3h·팩션 순환)
// ============================================================

import type { ArcNpcTrafficCaptain, ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';
import { mergeArcShipsIntoNearbyHubPresence } from '../npc/mergeArcTrafficIntoNearbyPresence';

/** Skia·궤도 마크·INFO 공통 상한 */
export const PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8;

/**
 * 궤도 렌더 예산 — 아크 수송선 우선, 테이블 주둔은 남는 슬롯만.
 * (INFO는 `buildPlanetHubOrbitInfoRows`가 동일 예산 결과를 사용)
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
 * 궤도에 실제 표시 중인 전함만 INFO 행으로 합침.
 * 전함 id · 함장 id · 표시명 중복은 merge 측에서 1순위 차단.
 */
export function buildPlanetHubOrbitInfoRows(
  tableRowsOnOrbit: NearbyOrbitPresenceRow[],
  arcShipsOnOrbit: ArcNpcTrafficShip[],
  captains: ArcNpcTrafficCaptain[],
  planetId: string,
  systemId: string,
): NearbyOrbitPresenceRow[] {
  return mergeArcShipsIntoNearbyHubPresence(
    tableRowsOnOrbit,
    arcShipsOnOrbit,
    captains,
    planetId,
    systemId,
  );
}
