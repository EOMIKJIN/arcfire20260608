// ============================================================
// 방위위성 요격 연출 — 공유 타입 (plan·sim 모듈 순환참조 방지)
// ============================================================

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
  willHit: boolean;
};

export type DefenseInterceptVisualPlan = {
  strikeId: string;
  planetId: string;
  defenseLevel: number;
  interceptChancePct: number;
  interceptSucceeded: boolean;
  /** 아크코어 inbound 궤도 패턴 — 요격 시계 호 선판정 */
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
