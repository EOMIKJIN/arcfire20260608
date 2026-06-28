// ============================================================
// 행성개발 Lv1 설치 — 영역별 전투 선행 (v2.0 §8 개정)
// - 블루·동맹 거점: 전투 조건 없음 (소유·크레딧·시설 체인)
// - 레드·중립·점령 거점: 해당 행성 전투 승리 1회 (누적 N회 아님)
// - 2026-06-27: 전투 선행조건 전역 비활성 (미개척·시설 설치 UX)
// ============================================================

export type PlanetDevInstallTerritory = 'blue_allied' | 'contested';

/** 설치 전투 선행 — 현재 비활성 */
export function requiresInstallVictoryOnPlanet(_planetId: string): boolean {
  return false;
}

/** contested 영역 — 승리 1회 미충족 시 설치 차단 사유 (현재 비활성) */
export function resolvePlanetInstallVictoryBlock(_planetId: string): string | null {
  return null;
}
