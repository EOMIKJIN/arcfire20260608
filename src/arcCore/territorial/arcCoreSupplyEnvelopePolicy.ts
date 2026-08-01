// ============================================================
// 보급 3성계 포위 우세 정책 — Table-First 정본
// (tables/balance/arc_core_supply_envelope_policy.csv)
// ============================================================

import { ArcCoreSupplyEnvelopePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreSupplyEnvelopePolicy = {
  policyId: string;
  /** 이 이상 인접 아군 성계면 STRONG(포위) — 대표님 정본 기본 3 */
  envelopeMinSystems: number;
  /** NEUTRAL+STRONG battle 진입 시 dominantSideWeightPct 오버라이드(고확률 점유) */
  occupyHighWeightPct: number;
  /** NEUTRAL+STRONG일 때 rollDecision battle 가중 가산(그만큼 status_quo 하향) */
  envelopeBattleWeightBoostPct: number;
  /** BLUE/RED hold + 동측 STRONG일 때 neutral_declare 가중 배율(0=분쟁 중립선포 완전 차단) */
  envelopeNeutralDeclareMul: number;
  /** 동측 STRONG hold의 반란 전복(overthrow) 성공확률 배율 — wealth 곡선 자체는 무변경, 최종 factionMul에만 곱함 */
  envelopeRebellionOverthrowMul: number;
};

const DEFAULT_POLICY: ArcCoreSupplyEnvelopePolicy = {
  policyId: 'default_v1',
  envelopeMinSystems: 3,
  occupyHighWeightPct: 88,
  envelopeBattleWeightBoostPct: 20,
  envelopeNeutralDeclareMul: 0,
  envelopeRebellionOverthrowMul: 1.35,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cached: ArcCoreSupplyEnvelopePolicy | null = null;

function buildPolicy(): ArcCoreSupplyEnvelopePolicy {
  const row =
    ArcCoreSupplyEnvelopePolicy_FROM_BALANCE_CSV.find((r) => r.policyId === 'default_v1')
    ?? ArcCoreSupplyEnvelopePolicy_FROM_BALANCE_CSV[0];
  if (!row) return DEFAULT_POLICY;
  return {
    policyId: row.policyId || DEFAULT_POLICY.policyId,
    envelopeMinSystems: Math.max(1, Math.round(parseNum(row.envelopeMinSystems, DEFAULT_POLICY.envelopeMinSystems))),
    occupyHighWeightPct: Math.min(100, Math.max(0, parseNum(row.occupyHighWeightPct, DEFAULT_POLICY.occupyHighWeightPct))),
    envelopeBattleWeightBoostPct: Math.max(
      0,
      parseNum(row.envelopeBattleWeightBoostPct, DEFAULT_POLICY.envelopeBattleWeightBoostPct),
    ),
    envelopeNeutralDeclareMul: Math.min(
      1,
      Math.max(0, parseNum(row.envelopeNeutralDeclareMul, DEFAULT_POLICY.envelopeNeutralDeclareMul)),
    ),
    envelopeRebellionOverthrowMul: Math.max(
      0,
      parseNum(row.envelopeRebellionOverthrowMul, DEFAULT_POLICY.envelopeRebellionOverthrowMul),
    ),
  };
}

export function getArcCoreSupplyEnvelopePolicy(): ArcCoreSupplyEnvelopePolicy {
  if (!cached) cached = buildPolicy();
  return cached;
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateArcCoreSupplyEnvelopePolicyCache(): void {
  cached = null;
}
