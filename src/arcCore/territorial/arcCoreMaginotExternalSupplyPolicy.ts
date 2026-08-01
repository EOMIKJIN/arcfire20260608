// ============================================================
// 마지노선(N≤5 HARD) · 외부팩션(F2 남부·F4 북부) 국가보급 정책 — Table-First 정본
// (tables/balance/arc_core_maginot_external_supply_policy.csv)
// F2=trade_coalition(남부)·F4=miners_guild(북부) — galaxyRouteFactionPolicy.ts 정본,
// NEUTRAL/INDEPENDENT 아님(대표님 확정). 이 로더는 F 코드를 문서/로그 라벨로만 취급한다.
// ============================================================

import { ArcCoreMaginotExternalSupplyPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreMaginotExternalSupplyPolicy = {
  policyId: string;
  /** 집계 범위 라벨(문서용) — 21코어 시나리오(synth 제외) */
  corePlanetCountScope: string;
  /** 이 이하 성계 수면 HARD(마지노선) */
  floorSystems: number;
  /** 이 이상 성계 수면 COOL(외부보급 감쇠·대등) */
  paritySystems: number;
  /** HARD에서 약세 팩션의 적 홀드 전선 수복 최종 확률(%) */
  hardFinalOccupyPct: number;
  /** 수복 시도에 필요한 약세 팩션 최소 인접 아군 성계 수(보급선 없으면 원정 불가, 기존 물리학과 동일) */
  minAdjacentFriendlyForReclaim: number;
  /** SUPPORT(HARD 아님·COOL 아님)에서 rollDecision battle 가중 가산치 */
  supportBattleWeightBoostPct: number;
  /** 외부팩션 코드 라벨(문서/로그용) — F2|F4 */
  externalFactionCodes: string;
};

const DEFAULT_POLICY: ArcCoreMaginotExternalSupplyPolicy = {
  policyId: 'default_v1',
  corePlanetCountScope: 'scenario21',
  floorSystems: 5,
  paritySystems: 10,
  hardFinalOccupyPct: 80,
  minAdjacentFriendlyForReclaim: 1,
  supportBattleWeightBoostPct: 15,
  externalFactionCodes: 'F2|F4',
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cached: ArcCoreMaginotExternalSupplyPolicy | null = null;

function buildPolicy(): ArcCoreMaginotExternalSupplyPolicy {
  const row =
    ArcCoreMaginotExternalSupplyPolicy_FROM_BALANCE_CSV.find((r) => r.policyId === 'default_v1')
    ?? ArcCoreMaginotExternalSupplyPolicy_FROM_BALANCE_CSV[0];
  if (!row) return DEFAULT_POLICY;
  const floorSystems = Math.max(0, Math.round(parseNum(row.floorSystems, DEFAULT_POLICY.floorSystems)));
  const paritySystems = Math.max(
    floorSystems + 1,
    Math.round(parseNum(row.paritySystems, DEFAULT_POLICY.paritySystems)),
  );
  return {
    policyId: row.policyId || DEFAULT_POLICY.policyId,
    corePlanetCountScope: row.corePlanetCountScope || DEFAULT_POLICY.corePlanetCountScope,
    floorSystems,
    paritySystems,
    hardFinalOccupyPct: Math.min(100, Math.max(0, parseNum(row.hardFinalOccupyPct, DEFAULT_POLICY.hardFinalOccupyPct))),
    minAdjacentFriendlyForReclaim: Math.max(
      1,
      Math.round(parseNum(row.minAdjacentFriendlyForReclaim, DEFAULT_POLICY.minAdjacentFriendlyForReclaim)),
    ),
    supportBattleWeightBoostPct: Math.max(
      0,
      parseNum(row.supportBattleWeightBoostPct, DEFAULT_POLICY.supportBattleWeightBoostPct),
    ),
    externalFactionCodes: row.externalFactionCodes || DEFAULT_POLICY.externalFactionCodes,
  };
}

export function getArcCoreMaginotExternalSupplyPolicy(): ArcCoreMaginotExternalSupplyPolicy {
  if (!cached) cached = buildPolicy();
  return cached;
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateArcCoreMaginotExternalSupplyPolicyCache(): void {
  cached = null;
}
