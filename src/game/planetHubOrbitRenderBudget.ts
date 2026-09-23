// ============================================================
// 행성 허브 궤도 전함 — Skia·INFO 단일 소스 (중복 출연 금지 1순위)
// ① 테이블 주둔 전함(3h·팩션) 최소 보장 → ② 아크 수송선(실제 planetId 체류)
// ============================================================

import type { ArcNpcTrafficCaptain, ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';

/** Skia·궤도 마크·INFO 공통 상한 */
export const PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8;

/**
 * 테이블 주둔 최소 예약 슬롯 — 아크 과밀(gather 등)에도 홈 허브가 빈 화면이 되지 않게 한다.
 * (관측: 수정 전 아르카디아 평균 3척+ 주둔)
 */
export const PLANET_HUB_ORBIT_TABLE_MIN_RESERVE = 3;

/**
 * 궤도 렌더 예산 — 테이블 주둔 최소 보장 후 아크 수송이 잔여 슬롯 사용.
 * (INFO는 `buildPlanetHubOrbitInfoRows`가 동일 예산 결과를 사용)
 */
export function applyPlanetHubOrbitRenderBudget(
  tableRows: NearbyOrbitPresenceRow[],
  arcShips: ArcNpcTrafficShip[],
  max = PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX,
  tableMinReserve = PLANET_HUB_ORBIT_TABLE_MIN_RESERVE,
): { tableRows: NearbyOrbitPresenceRow[]; arcShips: ArcNpcTrafficShip[] } {
  const safeMax = Math.max(0, Math.floor(max));
  const tableAvailable = Math.max(0, tableRows.length);
  const reserve = Math.max(0, Math.min(Math.floor(tableMinReserve), safeMax, tableAvailable));
  const arcCap = Math.max(0, safeMax - reserve);
  const arcShown = arcShips.slice(0, Math.min(arcShips.length, arcCap));
  const tableCap = Math.max(reserve, Math.min(tableAvailable, safeMax - arcShown.length));
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
  // merge는 함선 에셋 그래프를 끌어올 수 있어 예산 모듈 정적 import에서 분리(unit test·부트 경로).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mergeArcShipsIntoNearbyHubPresence } =
    require('../npc/mergeArcTrafficIntoNearbyPresence') as typeof import('../npc/mergeArcTrafficIntoNearbyPresence');
  return mergeArcShipsIntoNearbyHubPresence(
    tableRowsOnOrbit,
    arcShipsOnOrbit,
    captains,
    planetId,
    systemId,
  );
}
