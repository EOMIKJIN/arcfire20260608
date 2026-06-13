// ============================================================
// 아크코어 메시지 — 연출·경고 상수 (공격 스케줄은 strikeSchedule 모듈)
// ============================================================

/** 공격 직전 경고 리드타임(초) */
export const ARC_CORE_MESSAGE_WARNING_LEAD_SEC = 10;

/** 경고 문구 표시 시간 */
export const ARC_CORE_MESSAGE_WARNING_DURATION_SEC = 10;

/**
 * 궤도 함선 체감 속도에 맞춘 대각선 통과 시간.
 * `planet.tsx` NPC_ORBIT_CYCLE_MS(54000)의 1/4 궤도 분량.
 */
export const ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS = 13_500;

export const ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS = 1200;

/** 연출 전체 스케일(꼬리·스침 링) */
export const ARC_CORE_MESSAGE_VISUAL_SCALE = 0.5;

/** 탄두 타원 추가 축소(기준 대비 35%) */
export const ARC_CORE_MESSAGE_WARHEAD_SCALE = 0.35;

/** 탄두·궤적 선형 크기 보정(1=기준) — 현재 연출 대비 30% 축소 */
export const ARC_CORE_MESSAGE_VISUAL_SIZE_MUL = 0.7;

/** 궤적 stroke 두께 = 탄두 major × 이 값 (탄두 크기와 분리 조절) */
export const ARC_CORE_MESSAGE_TRAIL_STROKE_HEAD_RATIO = 0.5;

/** 경고 UI 전용 저주파 틱 — 미사일 비행은 Reanimated frame callback 사용 */
export const ARC_CORE_MESSAGE_WARNING_TICK_MS = 200;

export const ARC_CORE_MESSAGE_DEFAULT_KO =
  '아크코어의 의지가 담긴 장거리 미사일 — 메시지 폭격';

/**
 * 테스트 — true면 1일 12회 대신 `ARC_CORE_MESSAGE_TEST_STRIKE_INTERVAL_SEC` 간격 공격.
 * dev 테스트 — 위성별 `DEFENSE_INTERCEPT_TEST_HIT_CHANCE_PCT`(51%) 롤. 억지 100% 명중 제거.
 * 배포 전 false 로 되돌릴 것.
 * 목표 행성: `player.currentPlanetId`(체류 중)만 — 은하맵·성계 이동 중(null)은 슬롯 미소비.
 */
/** dev 전용 — 20초마다 inbound+요격(prod 동일 파이프, 경고 생략) */
export const ARC_CORE_MESSAGE_TEST_INTERVAL_STRIKES = typeof __DEV__ !== 'undefined' && __DEV__;
export const ARC_CORE_MESSAGE_TEST_STRIKE_INTERVAL_SEC = 20;
