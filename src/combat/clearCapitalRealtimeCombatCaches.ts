import { runCombatSkiaPresentationReclaim } from './combatSkiaPresentationReclaim';

/**
 * 전투·행성 이탈 시 combat Skia 모듈 캐시만 회수.
 * STAGE full reclaim 과 분리 — planet_change 중 hub Skia 유지.
 */
export function clearCapitalRealtimeCombatPresentationCaches(): void {
  runCombatSkiaPresentationReclaim();
}
