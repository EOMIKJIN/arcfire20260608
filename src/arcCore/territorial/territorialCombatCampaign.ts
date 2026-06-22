// ============================================================
// 접전 캠페인 — 순차 1행성 / 1시간(3600초) passInterval
// ============================================================

/** draco_front 등 캠페인 그룹: passInterval마다 1행성만 순차 판정 */
export const TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC = 3600;

/** passInterval ≤ 15분이면 probe 10초, 운영(1h)은 60초 */
export const TERRITORIAL_PASS_PROBE_INTERVAL_MS =
  TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC <= 900 ? 10_000 : 60_000;

export const DRACO_FRONT_CAMPAIGN_GROUP = 'draco_front';

/** draco_front 로테이션 순서 (campaignOrder 정본) */
export const DRACO_FRONT_CAMPAIGN_PLANET_ORDER = [
  'draco_haven',
  'omega_hub',
  'shadow_market',
] as const;
