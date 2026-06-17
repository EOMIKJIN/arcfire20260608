// ============================================================
// 행성별 아크코어 공격 레벨 리졸버 (기반작업 · inert)
// 현재 단계: 모든 행성 baseline(레벨1=현재 수준) 반환 → 동작 변화 없음.
// 추후 단계: planetCoreRuntimeStore.detail / 커맨드버스 directive / zone 매핑에서
//            행성별 레벨을 읽어 1~5로 반환(상향 확장). 호출부는 본 함수만 의존하면 됨.
// ============================================================

import { ARC_ATTACK_LEVEL_BASELINE, clampArcAttackLevel } from './arcCoreAttackModel';

export function resolvePlanetAttackLevel(planetId: string): number {
  // 확장점: planetId 기반 런타임/정책 조회. 기반작업 단계에서는 baseline 고정.
  void planetId;
  return clampArcAttackLevel(ARC_ATTACK_LEVEL_BASELINE);
}
