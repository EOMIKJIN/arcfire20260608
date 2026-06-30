/**
 * alert kind(compact 팝업) — 기본 30초 자동 닫힘.
 * 일일 채굴 한도·접전·ArcCore 정보·향후 showArcAlert 전부 동일.
 *
 * 예외(수동만): presentArcOverlayAlert / showArcAlert options 에 `autoDismissMs: 0`
 */

/** alert kind 기본 자동 닫힘 — 30초 */
export const ARC_ALERT_DEFAULT_AUTO_DISMISS_MS = 30_000;

/** @deprecated ARC_ALERT_DEFAULT_AUTO_DISMISS_MS */
export const ARC_NOTIFICATION_ALERT_AUTO_DISMISS_MS = ARC_ALERT_DEFAULT_AUTO_DISMISS_MS;

/** 행성 점유 변경 팝업 — 동일 id 교체로 최신 내용 갱신 */
export const TERRITORIAL_OCCUPATION_ALERT_ID = 'territorial-occupation-alert';

/** 일일 배치 요약 팝업 — 허브 1회 표시 */
export const ARC_DAILY_OPS_SUMMARY_ALERT_ID = 'arc-daily-ops-summary-alert';

/** 행성개발 설치·레벨업 완료 — 30초 자동 닫힘(항목별 id) */
export const PLANET_DEV_LEVEL_UP_ALERT_ID_PREFIX = 'planet-dev-level-up';

/**
 * alert autoDismissMs 해석 — undefined → 30s, 0 → 비활성, 양수 → 해당 ms
 */
export function resolveArcAlertAutoDismissMs(explicit?: number): number | undefined {
  if (explicit === 0) return undefined;
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  return ARC_ALERT_DEFAULT_AUTO_DISMISS_MS;
}
