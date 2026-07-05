/**
 * PID 수명 PSS 예산 — v4.0 STAGE 예산(화면 단위)과 별도.
 * long-run monitor 하드실링(950MB)과 정렬.
 */
export const PROCESS_PSS_SOFT_RECLAIM_MB = 800;
export const PROCESS_PSS_HARD_BUDGET_MB = 950;

/** route_blur 시 메모리 상주 nebula 프로필 상한 */
export const NEBULA_PROFILE_KEEP_ON_HUB_BLUR = 1;
export const NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR = 1;

/** Skia/RN native trim — 라우트 전환 직후 ANR 회피 지연 */
export const DEFERRED_NATIVE_RECLAIM_DELAY_MS = 1500;

/** 허브 체류 중 RN Image/Skia 백드롭 remount + Fresco trim 주기 */
export const HUB_DEEP_NATIVE_RECLAIM_INTERVAL_MS = 15 * 60 * 1000;

/** deep reclaim — Skia dodge 해제 후 RN Image remount (FinalizerDaemon race 회피) */
export const HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS = 64;

/** 동일 hub에서 RN 백드롭 remount 최소 간격 — trim 전 remount 시 native floor 계단 방지 */
export const HUB_BACKDROP_REMOUNT_COOLDOWN_MS = 30 * 60 * 1000;

/** soft(5m)·deep(15m) reclaim 최소 간격 — 이중 Fresco trim·remount race 방지 */
export const HUB_NATIVE_RECLAIM_MIN_GAP_MS = 45 * 1000;

/** remount 후 2차 Fresco trim — FinalizerDaemon 회수 대기 */
export const HUB_POST_REMOUNT_TRIM_DELAY_MS = HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS + 256;

/** worldmap 체류 — soft + deferred Fresco (transit 중 skip) */
export const GALAXY_MAP_SOFT_RECLAIM_INTERVAL_MS = 5 * 60 * 1000;

/** 허브 체류 — soft + deferred Fresco (전투 orbit 활성 시 skip) */
export const HUB_SOFT_NATIVE_RECLAIM_INTERVAL_MS = 5 * 60 * 1000;

/** heavy Skia peak 종료 1차 reclaim 후 GL floor 2차 회수 (Worklet·Fresco lag) */
export const POST_SKIA_PEAK_FOLLOWUP_MS = 90 * 1000;

/**
 * 전투 orbit 활성 "중"(soft 5분·deep 15분 전면 skip 구간) 안전판 — module Path/Paint/maskfilter
 * 캐시만 주기적으로 trim. dodge overlay 해제·Fresco trim·RN remount는 안 건드려 mid-frame
 * Canvas/worklet 레이스 위험 없음(기존 idle soft pass와 동일 함수 재사용).
 * 인카운터가 길게 이어져도 GL이 무한정 쌓이지 않도록 하는 최소 안전장치.
 */
export const HUB_COMBAT_SAFE_RECLAIM_INTERVAL_MS = 3 * 60 * 1000;
