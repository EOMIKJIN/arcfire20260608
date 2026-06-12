// ============================================================
// 아크코어 메시지 — 공격 스케줄 전략 계약
// 향후 전략 서브코어·시즌 이벤트가 ArcCoreMessageStrikeScheduleProvider 를 교체한다.
// ============================================================

export type ArcCoreMessageStrikeScheduleSlot = {
  /** 당일 0시(로컬) 기준 경과 초 */
  offsetSec: number;
  /** 경고 시작 시각(epoch ms) */
  warningAtMs: number;
  /** 미사일 발사(inbound) 시각(epoch ms) */
  strikeAtMs: number;
};

export type ArcCoreMessageStrikeDayPlan = {
  dayKey: string;
  dayStartMs: number;
  slots: ArcCoreMessageStrikeScheduleSlot[];
};

export interface ArcCoreMessageStrikeScheduleProvider {
  readonly id: string;
  resolvePlan(nowMs: number): ArcCoreMessageStrikeDayPlan;
}
