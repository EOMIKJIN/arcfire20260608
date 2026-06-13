// ============================================================
// 방위위성 요격 연출 — 공유 타입 (plan·sim·collision 순환참조 방지)
// ── 미사일 요격체계 · 안정버전 2026-06-12 ──
// ============================================================

import type { CapitalGuidedMissileCurve } from '../../combat/capitalGuidedMissileBezier';
import type { ArcCoreInboundTrajectoryPattern } from './arcCoreInboundTrajectoryPattern';

export type DefenseInterceptMissileSlot = {
  slotIndex: number;
  satelliteId: string;
  launchX: number;
  launchY: number;
  launchDelayMs: number;
  aimX: number;
  aimY: number;
  exitX: number;
  exitY: number;
  flightMs: number;
  aimPassU: number;
  predictedInterceptAtMs: number;
  /** 해당 위성 레벨 — 개별 요격 확률 산출 */
  defenseLevel: number;
  /** 위성 1기 요격 확률(%) */
  interceptChancePct: number;
  willHit: boolean;
  /** 근접 교차 시 1회 명중 롤 완료 */
  rollAttempted: boolean;
};

export type DefenseInterceptVisualPlan = {
  strikeId: string;
  planetId: string;
  defenseLevel: number;
  interceptChancePct: number;
  interceptSucceeded: boolean;
  /** 아크코어 inbound 궤도 패턴 — 연출·명령 메타(발사 각도 제한 없음) */
  trajectoryPattern: ArcCoreInboundTrajectoryPattern;
  weaponId: string;
  orbitClockAtInboundMs: number;
  canvasPad: number;
  interceptX: number;
  interceptY: number;
  interceptAtMs: number;
  missiles: DefenseInterceptMissileSlot[];
  hasActiveSatellites: boolean;
  /** 스케줄 성공 위성 1기 이상 — 요격 연출 발사 */
  engagementEligible: boolean;
};

/** guided sim 인스턴스 — collision·render 공용 (순환참조 방지용 types 축) */
export type DefenseInterceptGuidedMissile = {
  id: number;
  slotIndex: number;
  satelliteId: string;
  startMs: number;
  travelMs: number;
  p0: { x: number; y: number };
  bezier: CapitalGuidedMissileCurve | null;
  exitX: number;
  exitY: number;
  aimX: number;
  aimY: number;
  tangentRad: number;
  hitApplied: boolean;
  willHit: boolean;
  /** 근접(큰 반경) 판정·롤 확정 시각 */
  hitAtMs: number;
  /** 근접 통과(빗나감) — 직선 유지, hitApplied 와 분리 */
  passThroughAtMs: number;
  /** 탄두가 목표 중심에 도달한 시각 — 폭발·동결 연출 */
  impactAtMs: number;
  missileWeaponId: string;
  hitX: number;
  hitY: number;
  aimPassU: number;
  aimCrossedReported: boolean;
  /** primary — inbound warhead pure pursuit (bezier retarget 없음) */
  trackInbound: boolean;
  /** inbound 격추 확정 시각 — 이후 직진 이탈(0=미설정) */
  coastFromMs: number;
  coastX: number;
  coastY: number;
  coastTangentRad: number;
  /** 근접 교차 명중 롤 1회 완료 */
  proximityRollAttempted: boolean;
  /** pure pursuit 증분 적분 캐시 — 매 tick O(Δt)만 적분 */
  pursuitIntegratedToMs: number;
  pursuitHx: number;
  pursuitHy: number;
  /** 발사 직선(p0→exit) 속도 px/ms — travelMs 와 동기 */
  launchSpeedPxPerMs: number;
  /** 마지막 pursuit 스텝 진행 방향 */
  pursuitLastTan: number;
  /** x,y interleaved — Skia trail (최근 N점) */
  trailHistory: number[];
};

export type DefenseInterceptGuidedTickResult = {
  /** 근접(큰 반경) 롤 확정 — 게임 판정용 */
  primaryHitRelativeMs: number | null;
  /** 중심 도달 — 폭발·UI 연출용 */
  primaryImpactRelativeMs: number | null;
  hitX: number;
  hitY: number;
  primaryAimCrossed: boolean;
  aimCrossRelativeMs: number | null;
  aimCrossX: number;
  aimCrossY: number;
};

export type DefenseInterceptInboundContext = {
  inboundStartMs: number;
  travelMs: number;
  orbitSize: number;
};

export type DefenseInterceptHitResult = {
  hitX: number;
  hitY: number;
  relativeMs: number;
  /** 명중 롤 실패 — 탄두 관통·직진 이탈 */
  passThrough?: boolean;
};

export type DefenseInterceptRollAtProximity = (relativeMs: number, slotIndex: number) => boolean;
