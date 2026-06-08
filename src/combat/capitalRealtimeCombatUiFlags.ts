/**
 * 실시간 전함 HUD의 **상세 전투 로그** (함선별 HP·거리·쿨다운·교전 단계, 리스폰 안내 등).
 * 릴리즈에서는 메모리·setState 부하를 줄이기 위해 비활성. 개발 중에만 상세 로그를 본다.
 */
export const CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED = __DEV__;

/** 상세 로그 활성 시 함선별 줄 수 상한 — 무제한 push 방지 */
export const COMBAT_HUD_LOG_MAX_AGENT_LINES = 28;
