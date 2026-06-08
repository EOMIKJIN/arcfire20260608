// ============================================================
// 실시간 전투 — 타입 (무그래픽 리소스, 수치·플래그만)
// ============================================================

/** 0xRRGGBB (알파는 별도 채널 또는 배치 유니폼) */
export type BattlePackedRgb = number;

export type BattleTeamId = 0 | 1 | 2 | 3;

export type BattleWeaponVisualKind = 'laser' | 'missile' | 'emp_burst';

/** 광원·블룸 등 — 비트 플래그 (엔진에서 선택 적용, const enum 대신 객체로 번들 호환) */
export const BattleLightingFlags = {
  None: 0,
  /** 함선/탄 주변 가벼운 글로우 (비용↑) */
  EntityGlow: 1 << 0,
  /** 레이저 코어 하이라이트 */
  BeamCore: 1 << 1,
  /** EMP 링 내부 펄스 */
  EmpPulse: 1 << 2,
} as const;

export interface BattleLaserVisualSpec {
  kind: 'laser';
  widthPx: number;
  segmentCount: number;
  coreColor: BattlePackedRgb;
  glowColor: BattlePackedRgb;
}

export interface BattleMissileVisualSpec {
  kind: 'missile';
  trailMaxPoints: number;
  headColor: BattlePackedRgb;
  trailColor: BattlePackedRgb;
}

export interface BattleEmpVisualSpec {
  kind: 'emp_burst';
  ringCount: number;
  durationMs: number;
  color: BattlePackedRgb;
}

export type BattleWeaponVisualSpec = BattleLaserVisualSpec | BattleMissileVisualSpec | BattleEmpVisualSpec;

/** 엔티티 시각 규칙: 마름모 = 회전 정사각형(다이아) 한 종, 색만 다양 */
export interface BattleDiamondStyle {
  /** 반변 길이(월드 단위, 스케일은 카메라에서) */
  halfExtent: number;
  /** 라디안 */
  rotation: number;
  fill: BattlePackedRgb;
  stroke: BattlePackedRgb;
  /** 0~1, 0이면 스트로크 생략 가능 */
  strokeAlpha: number;
}
