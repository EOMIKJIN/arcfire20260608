/**
 * 허브 전투 세션 메뉴 잠금 — Ready 카운트·교전·웨이브 런 동안
 * 시설(무역/조선/바/연구소)·스캔 행을 잠근다.
 * 제외: 출발, 상단 탭(종료·설정·랭킹·지갑상점).
 */
export function isPlanetHubCombatSessionLock(input: {
  battleReadyVisible: boolean;
  capitalCombatOrbitActive: boolean;
  waveDefenseActive: boolean;
}): boolean {
  return (
    input.battleReadyVisible
    || input.capitalCombatOrbitActive
    || input.waveDefenseActive
  );
}
