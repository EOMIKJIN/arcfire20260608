// ============================================================
// 궤도 주둔(3h) — 코어 개방(A+B) 행성 풀 단일 정본
// ============================================================

import { listCoreOpenGameplayPlanetIds } from '../../world/coreOpenGameplayPlanets';

/** 코어 개방(A + B→A synth) 행성 id — 테이블 주둔 3h 순환 풀 */
export function listUnlockedPlanetIdsForOrbitPresence(): string[] {
  return listCoreOpenGameplayPlanetIds();
}

/** presence world index 캐시 키 — 개방 집합 변경 시 무효화 */
export function readUnlockedPlanetIdsSig(): string {
  return listUnlockedPlanetIdsForOrbitPresence().join(',');
}
