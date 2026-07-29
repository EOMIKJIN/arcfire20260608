// ============================================================
// 중립 hold 런타임 보급 비대칭 P0 (2026-07-28) + 접전 프로세스 충돌 재수정 (2026-07-29)
// R1: 분쟁지역(contestedZone)에서 런타임 1홉에 블루·레드가 모두 있으면 holdSide 무관 접전(blue_red).
//     CSV blue_neutral/red_neutral(geo-flank 등)로 한쪽 우세를 고정해도, 실제 양쪽 인접이면
//     접전이 정론 — 홀드가 BLUE/RED로 바뀐 뒤에도 CSV가 영구 고정돼 반대편 배제되는 재발 방지
//     (오메가 스테이션 사례: BLUE 홀드 + 타이탄(RED) 인접 유지 → CSV blue_neutral 고착).
// R2/R3: NEUTRAL hold에서만 CSV combatMode를 런타임 supplyAdjacency로 덮어씀(한쪽만 인접·고립 폴백).
//        BLUE/RED hold(양쪽 아님)는 기존 CSV combatMode 그대로.
// 순수 함수 — zustand/RN import 없음 (tsx --test 호환, 리그레션 대상).
// ============================================================

import type { TerritorialCombatMode } from './arcCoreTerritorialCombatPolicy';
import type { TerritorialFactionSide } from './arcCoreTerritorialCombatPolicy';

export type ResolveEffectiveTerritorialCombatModeInput = {
  holdSide: TerritorialFactionSide | 'NEUTRAL';
  policyCombatMode: TerritorialCombatMode;
  /** 인접(1홉) 아군 점유 성계 수 — countAdjacentFriendlySystems 결과 그대로 */
  supplyAdjacency: { blue: number; red: number };
  /** 분쟁지역(policy.contestedZone) 여부 — R1(양쪽 인접 시 blue_red 강제)은 분쟁지역에만 적용 */
  contestedZone: boolean;
};

/**
 * 실효 combatMode 해석 — 우선순위:
 * NEUTRAL hold(기존 P0, 2026-07-28 — contestedZone 무관, 회귀 없음):
 *   블루만 인접>0 → `blue_neutral` · 레드만 인접>0 → `red_neutral` · 둘다>0 → `blue_red`(CSV 무관) ·
 *   둘다 0(고립) → policy.combatMode 그대로(P1 폴백)
 * 비중립(BLUE/RED) hold — R1(2026-07-29 재수정):
 *   contestedZone && 블루·레드 둘 다 인접>0 → `blue_red`(CSV·holdSide 무관, 접전이 항상 최우선).
 *   홀드가 BLUE/RED로 바뀐 뒤에도 CSV blue_neutral/red_neutral이 영구 고정돼 반대편이 전투에서
 *   배제되는 재발(오메가 스테이션 사례)을 막는다. 그 외(단측 인접·고립·비분쟁지역)는 policy.combatMode 그대로.
 */
export function resolveEffectiveTerritorialCombatMode(
  input: ResolveEffectiveTerritorialCombatModeInput,
): TerritorialCombatMode {
  const { holdSide, policyCombatMode, supplyAdjacency, contestedZone } = input;
  const blueCan = supplyAdjacency.blue > 0;
  const redCan = supplyAdjacency.red > 0;

  if (holdSide === 'NEUTRAL') {
    if (blueCan && !redCan) return 'blue_neutral';
    if (redCan && !blueCan) return 'red_neutral';
    if (blueCan && redCan) return 'blue_red';
    return policyCombatMode;
  }

  if (contestedZone && blueCan && redCan) return 'blue_red';
  return policyCombatMode;
}
