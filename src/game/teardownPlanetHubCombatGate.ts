import { isPlanetHubCombatSessionLock } from '../systems/planetHub/planetHubCombatMenuLock';

export type TeardownPlanetHubCombatGateInput = {
  battleReadyVisible: boolean;
  capitalCombatOrbitActive: boolean;
  waveDefenseActive: boolean;
  /** 이번 허브 체류 중 Ready·교전·웨이브가 한 번이라도 켜짐 — 종료 직후 출발 포함 */
  hadCombatThisVisit: boolean;
};

/**
 * 비전투 Hop에서 전투급 GPU/Fresco teardown을 돌리지 않는다.
 * 전투 중·전투 직후 출발은 기존 경로 유지(연출·기능 불변).
 */
export function shouldTeardownPlanetHubCombatForGalaxyDeparture(
  input: TeardownPlanetHubCombatGateInput,
): boolean {
  return input.hadCombatThisVisit || isPlanetHubCombatSessionLock(input);
}
