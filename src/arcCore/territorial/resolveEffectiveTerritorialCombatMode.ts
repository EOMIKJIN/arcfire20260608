// ============================================================
// 중립 hold 런타임 보급 비대칭 P0 — 인접(1홉) 적국 부재 시 인접 팩션 우세 (2026-07-28 대표님 정본)
// NEUTRAL hold에서만 CSV combatMode를 런타임 supplyAdjacency로 덮어씀.
// BLUE/RED/INDEPENDENT hold는 기존 CSV combatMode 그대로 (오버라이드 없음).
// 순수 함수 — zustand/RN import 없음 (tsx --test 호환, 리그레션 대상).
// ============================================================

import type { TerritorialCombatMode } from './arcCoreTerritorialCombatPolicy';
import type { TerritorialFactionSide } from './arcCoreTerritorialCombatPolicy';

export type ResolveEffectiveTerritorialCombatModeInput = {
  holdSide: TerritorialFactionSide | 'NEUTRAL';
  policyCombatMode: TerritorialCombatMode;
  /** 인접(1홉) 아군 점유 성계 수 — countAdjacentFriendlySystems 결과 그대로 */
  supplyAdjacency: { blue: number; red: number };
};

/**
 * 중립 hold의 실효 combatMode 해석 — 우선순위(P0):
 * 블루만 인접>0 → blue_neutral · 레드만 인접>0 → red_neutral · 둘다>0 → blue_red(CSV 무관)
 * 둘다 0(고립 중립) → P0 미적용, 기존 policy.combatMode 그대로(P1 폴백).
 * 비중립 hold는 항상 policy.combatMode 그대로 (P0 조건 자체가 NEUTRAL 한정).
 */
export function resolveEffectiveTerritorialCombatMode(
  input: ResolveEffectiveTerritorialCombatModeInput,
): TerritorialCombatMode {
  const { holdSide, policyCombatMode, supplyAdjacency } = input;
  if (holdSide !== 'NEUTRAL') return policyCombatMode;

  const blueCan = supplyAdjacency.blue > 0;
  const redCan = supplyAdjacency.red > 0;
  if (blueCan && !redCan) return 'blue_neutral';
  if (redCan && !blueCan) return 'red_neutral';
  if (blueCan && redCan) return 'blue_red';
  return policyCombatMode;
}
