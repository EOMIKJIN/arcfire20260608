// ============================================================
// 접전 캠페인 — 순차 1행성 / 20분(1200초) passInterval (테스트 주기 2026-07-28)
// ============================================================

/** draco_front 등 캠페인 그룹: passInterval마다 1행성만 순차 판정 */
export const TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC = 1200;

/** passInterval ≤ 15분이면 probe 10초, 그 외(20m 포함)는 60초 */
export const TERRITORIAL_PASS_PROBE_INTERVAL_MS =
  TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC <= 900 ? 10_000 : 60_000;

export const DRACO_FRONT_CAMPAIGN_GROUP = 'draco_front';

// draco_front 로테이션 순서는 `tables/balance/arc_core_territorial_combat_policy.csv`의
// campaignOrder가 정본(Table-First) — TS 상수 목록은 2026-07-28 삭제(미사용·중복 정본 위험).
// 순서 조회는 listTerritorialCombatPoliciesForCampaign('draco_front')를 사용할 것.
