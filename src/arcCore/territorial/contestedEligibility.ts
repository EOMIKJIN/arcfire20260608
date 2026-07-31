// ============================================================
// 분쟁지역 Eligibility 분류 — 대표님 A안(2026-07-31)
// 우군으로 완전 포위된(1홉 적대 인접=0) 분쟁성계는 반란 외 판정 제외(SAFE_HINTERLAND).
// 빈 자리는 적·아군 맞닿은 전선(FRONT) · 전략적 불리 중립(STRATEGIC_NEUTRAL) ·
// 적대 인접 독립국(INDEPENDENT_FRONT)으로 채운다.
// 순수 함수 — zustand/RN import 없음(tsx --test 호환). territorialSupplyLine.ts도 순수라 안전하게 재사용.
// ============================================================

import { countAdjacentFriendlySystems, hasAdjacentHostileFactionSystem } from './territorialSupplyLine';
import type { PlanetClanHold } from '../../types';
import type { TerritorialFactionSide } from './arcCoreTerritorialCombatPolicy';

export type ContestedHoldSide = TerritorialFactionSide | 'NEUTRAL' | 'INDEPENDENT';

export type ContestedEligibilityClass =
  | 'safe_hinterland'
  | 'eligible_front'
  | 'eligible_strategic_neutral'
  | 'eligible_independent_front'
  | 'ineligible';

export type ClassifyContestedEligibilityInput = {
  holdSide: ContestedHoldSide;
  /** 인접(1홉) BLUE/RED 점유 성계 수 — countAdjacentFriendlySystems 결과 그대로 */
  adjacency: { blue: number; red: number };
  /** 1홉에 holdSide와 적대 관계(정치관계 CSV)인 팩션 점유가 있는지 — hasAdjacentHostileFactionSystem 결과 */
  hasAdjacentHostile: boolean;
};

/**
 * 분류 우선순위:
 * 1. SAFE_HINTERLAND — holdSide ∈ {BLUE,RED} AND 적대 인접=0 (완전 포위) → 분쟁 로테이션 제외
 * 2. ELIGIBLE_FRONT — 1홉에 블루·레드 둘 다 존재(holdSide 무관) → 맞닿은 전선
 * 3. ELIGIBLE_STRATEGIC_NEUTRAL — holdSide=NEUTRAL + 한쪽만 인접 → 전략적 불리 중립
 * 4. ELIGIBLE_INDEPENDENT_FRONT — holdSide=INDEPENDENT + 적대 인접 有
 * 5. INELIGIBLE — 그 외(비중립 hold가 적대 인접은 있으나 아군 인접은 없는 경우 등)
 */
export function classifyContestedEligibility(
  input: ClassifyContestedEligibilityInput,
): ContestedEligibilityClass {
  const { holdSide, adjacency, hasAdjacentHostile } = input;
  const adjBlue = adjacency.blue > 0;
  const adjRed = adjacency.red > 0;

  if ((holdSide === 'BLUE' || holdSide === 'RED') && !hasAdjacentHostile) {
    return 'safe_hinterland';
  }
  if (adjBlue && adjRed) return 'eligible_front';
  if (holdSide === 'NEUTRAL' && adjBlue !== adjRed) return 'eligible_strategic_neutral';
  if (holdSide === 'INDEPENDENT' && hasAdjacentHostile) return 'eligible_independent_front';
  return 'ineligible';
}

export function isContestedEligibilityActive(cls: ContestedEligibilityClass): boolean {
  return cls !== 'safe_hinterland';
}

/**
 * systemId+holds로부터 인접 정보를 계산해 classify까지 한 번에 — holds를 명시 전달받으므로 여전히 순수.
 */
export function resolveContestedEligibilityForSystem(input: {
  systemId: string;
  holdSide: ContestedHoldSide;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): ContestedEligibilityClass {
  const { systemId, holdSide, holds } = input;
  const adjacency = {
    blue: countAdjacentFriendlySystems({ systemId, side: 'BLUE', holds }),
    red: countAdjacentFriendlySystems({ systemId, side: 'RED', holds }),
  };
  const hasAdjacentHostile =
    holdSide === 'BLUE' || holdSide === 'RED' || holdSide === 'INDEPENDENT'
      ? hasAdjacentHostileFactionSystem({ systemId, side: holdSide, holds })
      : false;
  return classifyContestedEligibility({ holdSide, adjacency, hasAdjacentHostile });
}
