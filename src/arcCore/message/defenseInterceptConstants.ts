// ============================================================
// 방위위성 요격 — 스케줄·예측·연출 공통 상수 (모듈 순환참조 방지)
// ── 미사일 요격체계 · 안정버전 2026-06-12 ──
// ============================================================

export const DEFENSE_INTERCEPT_MISS_AIM_OFFSET_PX = 36;
export const DEFENSE_INTERCEPT_VISUAL_SPEED_PX_PER_MS = 0.09;
export const DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MIN = 1400;
export const DEFENSE_INTERCEPT_VISUAL_TRAVEL_MS_MAX = 5200;
export const DEFENSE_INTERCEPT_GUIDED_MISSILE_TRAIL_FADE_MS = 950;
export const DEFENSE_INTERCEPT_GUIDED_MISSILE_HIT_EXPLOSION_MS = 520;
/** inbound 비행 전 구간 pure pursuit 허용(ms) */
export const DEFENSE_INTERCEPT_PRIMARY_PURSUIT_MS = 14_200;
/** inbound 격추 후 비격중 요격탄 — 직진 이탈 연출(ms) */
export const DEFENSE_INTERCEPT_COAST_MS = 3_800;
/** 빗나감 직선 비행 — exit 이후 화면 밖까지 추가 직진(ms) */
export const DEFENSE_INTERCEPT_MISS_STRAIGHT_COAST_MS = 6_500;
/** dev·테스트 — 위성별 요격 명중률(%) */
export const DEFENSE_INTERCEPT_TEST_HIT_CHANCE_PCT = 51;
/** 연출용 — 탄두가 목표 중심에 닿았다고 보는 반경(px). 판정 반경과 분리 */
export const DEFENSE_INTERCEPT_VISUAL_IMPACT_RADIUS_PX = 8;
/** Skia 꼬리 창 — travelMs 대비 u (길수록 꼬리 연장) */
export const DEFENSE_INTERCEPT_TRAIL_WINDOW_U = 0.82;
/** Skia 꼬리 최소 창(ms) */
export const DEFENSE_INTERCEPT_TRAIL_WINDOW_MS_MIN = 520;
/** trailHistory·flat 최대 (x,y) 쌍 수 */
export const DEFENSE_INTERCEPT_TRAIL_MAX_PAIRS = 40;
/** pursuit 적분 스텝(ms) — 작을수록 곡선 매끈 */
export const DEFENSE_INTERCEPT_PURSUIT_INTEGRATE_STEP_MS = 4;
/** trailHistory 포인트 최소 간격(px) */
export const DEFENSE_INTERCEPT_TRAIL_MIN_STEP_PX = 0.65;
/** JS sim → UI worklet 선형 extrapolation 상한(ms) */
export const DEFENSE_INTERCEPT_MOTION_EXTRAPOLATE_MAX_MS = 48;
