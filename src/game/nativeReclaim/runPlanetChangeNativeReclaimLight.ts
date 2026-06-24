import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { prunePlanetNebulaProfilesForPlanets } from '../../store/planetNebulaStore';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';

/**
 * 행성 간 착륙(planet_change) — 허브 UI·Skia mount 유지, 이전 행성 프로필만 정리.
 * route_blur 전용 full reclaim 과 분리해 성운/이미지 스킵을 방지한다.
 */
export function runPlanetChangeNativeReclaimLight(previousPlanetId: string): void {
  runCombatSkiaPresentationReclaim();
  prunePlanetNebulaProfilesForPlanets([previousPlanetId]);
  compactPlanetMemoRegistryShells();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetChangeNativeReclaimLight prev=${previousPlanetId}`);
  }
}
