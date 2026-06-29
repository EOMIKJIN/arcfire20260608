// ============================================================
// 아크코어 통합 공격 시스템 — 모델/타입 (기반작업 · inert)
// 3종 공격 카테고리 + 1~5 공격 레벨(현재=레벨1, 상향 확장형)을 구조적으로 정의.
// 실제 동작 연결은 추후 단계. 본 파일은 분류·상수·안전 상한만 제공한다.
// ============================================================

/** 아크코어가 통제하는 행성 공격 3종 카테고리 */
export const ARC_ATTACK_CATEGORY = {
  /** 행성 직접타격 — inbound 드론 (ArcInboundDroneSubCore / planetAttack 피해 파이프라인) */
  INBOUND_DRONE: 'inbound_drone',
  /** 메인스테이지 일반전투 — 허브 궤도 교전 (PlanetEdenRaidOrbitSkiaCombat) */
  ORBIT_RAID: 'orbit_raid',
  /** 행성간 이동중 인스턴스 전투 (worldmap transit) */
  TRANSIT: 'transit',
  /** 백엔드 비물리 — 궤도/수송 체류 스파이 함장의 T(기술) 지표 침식 */
  SPY_INFILTRATION: 'spy_infiltration',
} as const;

export type ArcAttackCategory = (typeof ARC_ATTACK_CATEGORY)[keyof typeof ARC_ATTACK_CATEGORY];

export const ARC_ATTACK_LEVEL_MIN = 1;
export const ARC_ATTACK_LEVEL_MAX = 5;
/** 현재 수준 = 레벨 1 (상향 확장형 기준점 — 모든 배수 1.0, 동작 변화 없음) */
export const ARC_ATTACK_LEVEL_BASELINE = 1;

export function clampArcAttackLevel(level: number): number {
  if (!Number.isFinite(level)) return ARC_ATTACK_LEVEL_BASELINE;
  return Math.max(ARC_ATTACK_LEVEL_MIN, Math.min(ARC_ATTACK_LEVEL_MAX, Math.floor(level)));
}

/**
 * 확장 안전 하드 상한 — 레벨을 올려도 프레임·메모리·GC가 폭증하지 않도록 한다.
 * 정책 CSV 배수가 아무리 커도 effective 값은 이 상한을 넘지 못한다(구조적 안전장치).
 * - 동시 드론 객체 수: 사전할당 풀·렌더 부하의 상한
 * - 웨이브 주기 하한: 틱당 스폰 폭주 방지
 */
export const ARC_ATTACK_SAFETY = {
  /** 드론 웨이브 최소 주기(초) — 이보다 잦게 스폰하지 않음 */
  WAVE_INTERVAL_MIN_SEC: 20,
  /** 웨이브당 최대 드론 수 */
  WAVE_COUNT_CEIL: 24,
  /** 동시 활성 드론 최대 수 — 메모리/프레임 보호 (Skia 트레일 포함) */
  MAX_ACTIVE_DRONES_CEIL: 40,
} as const;
