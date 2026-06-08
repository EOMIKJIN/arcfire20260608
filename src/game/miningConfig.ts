/**
 * 궤도 채광 런타임 상수 (추후 테이블·행성별 오버라이드).
 */

/**
 * 궤도 소행성·채광 터치 밴드 전체 스위치.
 * `false`면 `mineral_region_members`에 있어도 소행성·채굴 UI는 나오지 않음(아르카디아 단독 검증 등).
 */
export const ORBIT_ASTEROID_MINING_ENABLED = false;

/** 한 사이클당 1단위 광물 지급 — 검증용 30초 */
export const ORBIT_MINING_CYCLE_MS = 30 * 1000;

/** 궤도 자동 채굴 1세션(시작~중지)당 누적 채굴량 상한 — 도달 시 자동 중단 */
export const ORBIT_MINING_SESSION_MAX_UNITS = 100;

/**
 * 라우트 블러 등으로 인터벌이 멈춘 뒤 복귀할 때, 한 번의 틱에 처리할 최대 사이클 수.
 * 미설정 시 경과 시간만큼 한꺼번에 여러 사이클이 몰릴 수 있음(지급 폭주·부하).
 */
export const ORBIT_MINING_MAX_CATCH_UP_CYCLES = 2;

/** 궤도 소행성 시각 주기(ms) — NPC 궤도보다 느리게 */
export const ORBIT_MINING_VISUAL_CYCLE_MS = 140000;

/** 채굴 보상 아이템 id — 채굴 즉시 인벤토리로 적재 */
export const ORBIT_MINING_REWARD_GOOD_ID = 'ore_mineral_1';
/** @deprecated use ORBIT_MINING_REWARD_GOOD_ID */
export const ORBIT_MINING_CARGO_GOOD_ID = ORBIT_MINING_REWARD_GOOD_ID;
