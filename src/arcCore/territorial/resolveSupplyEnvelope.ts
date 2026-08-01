// ============================================================
// 보급 3성계 포위 우세 — 대표님 정본(2026-08-01)
// 블루(또는 레드) 보급선이 3성계 이상으로 둘러싸고 반대 팩션이 0이면 STRONG.
// A) NEUTRAL+STRONG → 다음 순차 분쟁에서 battle 가중 상향 + dominantSideWeightPct 고확률 오버라이드.
// B) BLUE/RED hold + 동측 STRONG → 분쟁 neutral_declare 억제(중립화는 반란 경로가 주 원인이어야 함).
// 순수 함수 — zustand/RN import 없음(tsx --test 호환). 행성 식별자 자체를 입력받지 않음(구조적 하드코딩 불가).
// ============================================================

export type SupplyEnvelopeStrength = 'blue_strong' | 'red_strong' | 'none';

/** 인접(1홉) 아군 성계 수 — countAdjacentFriendlySystems 결과 그대로(블루/레드 각각) */
export type SupplyEnvelopeAdjacency = { blue: number; red: number };

/**
 * threshold(기본 3) 이상 인접 + 반대 팩션 인접=0 → STRONG.
 * 연결 수가 threshold 미만인 성계는 구조적으로 STRONG 불가(자연 폴백 — 기존 P0 ≥1 인접 규칙만 적용).
 */
export function resolveSupplyEnvelope(input: {
  adjacency: SupplyEnvelopeAdjacency;
  threshold: number;
}): SupplyEnvelopeStrength {
  const { adjacency, threshold } = input;
  if (adjacency.blue >= threshold && adjacency.red === 0) return 'blue_strong';
  if (adjacency.red >= threshold && adjacency.blue === 0) return 'red_strong';
  return 'none';
}

export type TerritorialRollWeights = {
  battleWeightPct: number;
  neutralDeclareWeightPct: number;
  statusQuoWeightPct: number;
};

/**
 * rollDecision 가중치 보정 — envelope이 NEUTRAL hold와(A) 또는 hold와 동측(B)일 때만 조정.
 * A(NEUTRAL): battle 가중 상향, 그만큼 status_quo 하향(neutral_declare는 NEUTRAL hold에 실질
 *   no-op이라 조정 대상 아님 — 기존 runTerritorialCombatPassForPlanet가 NEUTRAL+neutral_declare를
 *   hold 변경 없이 처리함).
 * B(BLUE/RED hold + 동측 STRONG): neutral_declare 가중에 envelopeNeutralDeclareMul(기본 0) 적용,
 *   제거된 가중치는 status_quo로 흡수(현상 유지 강화 — 전투로 소비되지 않고 그대로 보류).
 * 그 외(envelope 없음, 반대측 STRONG, 전선=반대 보급>0)는 입력 그대로 반환(기존 CSV 가중 유지).
 */
export function applySupplyEnvelopeDecisionWeights(input: {
  holdSide: 'BLUE' | 'RED' | 'NEUTRAL';
  envelope: SupplyEnvelopeStrength;
  weights: TerritorialRollWeights;
  envelopeBattleWeightBoostPct: number;
  envelopeNeutralDeclareMul: number;
}): TerritorialRollWeights {
  const { holdSide, envelope, weights, envelopeBattleWeightBoostPct, envelopeNeutralDeclareMul } = input;
  if (envelope === 'none') return weights;

  if (holdSide === 'NEUTRAL') {
    const boost = Math.max(0, envelopeBattleWeightBoostPct);
    return {
      battleWeightPct: weights.battleWeightPct + boost,
      neutralDeclareWeightPct: weights.neutralDeclareWeightPct,
      statusQuoWeightPct: Math.max(0, weights.statusQuoWeightPct - boost),
    };
  }

  const sameSideStrong =
    (holdSide === 'BLUE' && envelope === 'blue_strong') || (holdSide === 'RED' && envelope === 'red_strong');
  if (!sameSideStrong) return weights;

  const mul = Math.min(1, Math.max(0, envelopeNeutralDeclareMul));
  const suppressed = weights.neutralDeclareWeightPct * mul;
  const removed = weights.neutralDeclareWeightPct - suppressed;
  return {
    battleWeightPct: weights.battleWeightPct,
    neutralDeclareWeightPct: suppressed,
    statusQuoWeightPct: weights.statusQuoWeightPct + removed,
  };
}

/**
 * NEUTRAL hold + STRONG일 때만 dominantSideWeightPct를 occupyHighWeightPct로 오버라이드.
 * 그 외는 null(호출측이 policy.dominantSideWeightPct 그대로 사용).
 */
export function resolveSupplyEnvelopeDominantOverridePct(input: {
  holdSide: 'BLUE' | 'RED' | 'NEUTRAL';
  envelope: SupplyEnvelopeStrength;
  occupyHighWeightPct: number;
}): number | null {
  if (input.holdSide !== 'NEUTRAL' || input.envelope === 'none') return null;
  return input.occupyHighWeightPct;
}
