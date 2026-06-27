/** 포그라운드에서 사용자 조작 없이 경과 시 세션 재시작 (벽시계 1시간) */
export const IDLE_SESSION_RESTART_MS = 60 * 60 * 1000;

/** 메모리 안정화 soak 중 false — IdleSessionRestartGuard tick 비활성 */
export const IDLE_SESSION_RESTART_ENABLED = false;

/** 재시작 안내 표시 후 실제 reload 까지 대기 */
export const IDLE_SESSION_RESTART_GRACE_MS = 5000;

/** idle 판정 폴링 — 1분 */
export const IDLE_SESSION_CHECK_INTERVAL_MS = 60_000;
