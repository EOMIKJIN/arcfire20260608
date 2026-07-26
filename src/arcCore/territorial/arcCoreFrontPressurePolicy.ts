// ============================================================
// 전선 압박(FrontPressure) 정책 — Table-First 정본
// (tables/balance/arc_core_front_pressure_policy.csv)
// ============================================================

import { ArcCoreFrontPressurePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreFrontPressurePolicy = {
  policyId: string;
  /** 이 이상 적대 인접 성계면 posture=aggressive */
  hostileNeighborMinAggressive: number;
  /** 이 이상이면 flanked 플래그(로그/UI용, posture 판정과 별개) */
  hostileNeighborMinFlanked: number;
  battlesPerIntervalNormal: number;
  battlesPerIntervalAggressive: number;
  /** 1 유지 권장 — 0.5 등으로 낮추면 빈도(battlesPerInterval)와 이중 적용 위험 */
  passIntervalMulAggressive: number;
  /** aggressive 시 방어측 보급 배율 추가 가산(기존 supplyBonusCapPct 캡 내에서만) */
  supplyBonusMulAggressive: number;
  /** aggressive 시 battle 판정 가중치 추가(%) — 상한은 호출부에서 그대로 더함(작은 값) */
  battleWeightBonusPctAggressive: number;
};

const DEFAULT_POLICY: ArcCoreFrontPressurePolicy = {
  policyId: 'default_v1',
  hostileNeighborMinAggressive: 2,
  hostileNeighborMinFlanked: 3,
  battlesPerIntervalNormal: 1,
  battlesPerIntervalAggressive: 2,
  passIntervalMulAggressive: 1,
  supplyBonusMulAggressive: 1,
  battleWeightBonusPctAggressive: 0,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cached: ArcCoreFrontPressurePolicy | null = null;

function buildPolicy(): ArcCoreFrontPressurePolicy {
  const row =
    ArcCoreFrontPressurePolicy_FROM_BALANCE_CSV.find((r) => r.policyId === 'default_v1')
    ?? ArcCoreFrontPressurePolicy_FROM_BALANCE_CSV[0];
  if (!row) return DEFAULT_POLICY;
  return {
    policyId: row.policyId || DEFAULT_POLICY.policyId,
    hostileNeighborMinAggressive: Math.max(
      1,
      parseNum(row.hostileNeighborMinAggressive, DEFAULT_POLICY.hostileNeighborMinAggressive),
    ),
    hostileNeighborMinFlanked: Math.max(
      1,
      parseNum(row.hostileNeighborMinFlanked, DEFAULT_POLICY.hostileNeighborMinFlanked),
    ),
    battlesPerIntervalNormal: Math.max(
      1,
      parseNum(row.battlesPerIntervalNormal, DEFAULT_POLICY.battlesPerIntervalNormal),
    ),
    battlesPerIntervalAggressive: Math.max(
      1,
      parseNum(row.battlesPerIntervalAggressive, DEFAULT_POLICY.battlesPerIntervalAggressive),
    ),
    passIntervalMulAggressive: Math.max(
      0.1,
      parseNum(row.passIntervalMulAggressive, DEFAULT_POLICY.passIntervalMulAggressive),
    ),
    supplyBonusMulAggressive: Math.max(
      1,
      parseNum(row.supplyBonusMulAggressive, DEFAULT_POLICY.supplyBonusMulAggressive),
    ),
    battleWeightBonusPctAggressive: Math.max(
      0,
      parseNum(row.battleWeightBonusPctAggressive, DEFAULT_POLICY.battleWeightBonusPctAggressive),
    ),
  };
}

export function getArcCoreFrontPressurePolicy(): ArcCoreFrontPressurePolicy {
  if (!cached) cached = buildPolicy();
  return cached;
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateArcCoreFrontPressurePolicyCache(): void {
  cached = null;
}
