// ============================================================
// 분쟁지역 Eligibility 풀 거버너 정책 — Table-First 정본
// (tables/balance/arc_core_contested_pool_policy.csv)
// ============================================================

import { ArcCoreContestedPoolPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreContestedPoolPolicy = {
  campaignGroup: string;
  /** Active pool(SAFE 제외) 최소 크기 — 미달 시 승격으로 채움(A안) */
  poolMin: number;
  /** Active pool(SAFE 제외) 최대 크기 — 초과 시 강등 */
  poolMax: number;
  /** 1회 rebalance당 승격+강등 합계 상한(채터링 방지) */
  stepMax: number;
  /** 강등/승격 쿨다운 — 캠페인 순환 바퀴 수 기준(실제 ms 환산은 호출측이 campaignLength·passIntervalSec로 계산) */
  cooldownLaps: number;
};

const DEFAULT_POLICY: Omit<ArcCoreContestedPoolPolicy, 'campaignGroup'> = {
  poolMin: 8,
  poolMax: 12,
  stepMax: 2,
  cooldownLaps: 2,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cache: Map<string, ArcCoreContestedPoolPolicy> | null = null;

function buildCache(): Map<string, ArcCoreContestedPoolPolicy> {
  const m = new Map<string, ArcCoreContestedPoolPolicy>();
  for (const row of ArcCoreContestedPoolPolicy_FROM_BALANCE_CSV) {
    const campaignGroup = String(row.campaignGroup ?? '').trim();
    if (!campaignGroup) continue;
    const poolMin = Math.max(1, Math.round(parseNum(row.poolMin, DEFAULT_POLICY.poolMin)));
    const poolMax = Math.max(poolMin, Math.round(parseNum(row.poolMax, DEFAULT_POLICY.poolMax)));
    m.set(campaignGroup, {
      campaignGroup,
      poolMin,
      poolMax,
      stepMax: Math.max(1, Math.round(parseNum(row.stepMax, DEFAULT_POLICY.stepMax))),
      cooldownLaps: Math.max(0, Math.round(parseNum(row.cooldownLaps, DEFAULT_POLICY.cooldownLaps))),
    });
  }
  return m;
}

/** campaignGroup별 풀 정책 — CSV에 행이 없으면 기본값(min8/max12/step2/cooldown2) 폴백 */
export function getArcCoreContestedPoolPolicy(campaignGroup: string): ArcCoreContestedPoolPolicy {
  if (!cache) cache = buildCache();
  return cache.get(campaignGroup) ?? { campaignGroup, ...DEFAULT_POLICY };
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateArcCoreContestedPoolPolicyCache(): void {
  cache = null;
}
