import type {
  ArcCoreMessageStrikeScheduleProvider,
  ArcCoreMessageStrikeScheduleSlot,
} from './arcCoreMessageStrikeScheduleTypes';
import {
  ArcCoreMessageDailyRandomStrikeScheduleProvider,
} from './arcCoreMessageDailyRandomStrikeSchedule';
import { ArcCoreMessageIntervalTestStrikeScheduleProvider } from './arcCoreMessageIntervalTestStrikeSchedule';
import {
  ARC_CORE_MESSAGE_TEST_INTERVAL_STRIKES,
  ARC_CORE_MESSAGE_TEST_STRIKE_INTERVAL_SEC,
  ARC_CORE_MESSAGE_WARNING_LEAD_SEC,
} from './arcCoreMessagePolicy';

export type ArcCoreMessageStrikeScheduleHandlers = {
  /** true — 슬롯 소비(1회 발화). false — 체류 행성 없음 등으로 건너뜀(다음 tick 재시도) */
  onWarning: (slot: ArcCoreMessageStrikeScheduleSlot) => boolean;
  onStrike: (slot: ArcCoreMessageStrikeScheduleSlot) => boolean;
};

function resolveDefaultArcCoreMessageStrikeScheduleProvider(): ArcCoreMessageStrikeScheduleProvider {
  if (ARC_CORE_MESSAGE_TEST_INTERVAL_STRIKES) {
    return new ArcCoreMessageIntervalTestStrikeScheduleProvider(
      ARC_CORE_MESSAGE_WARNING_LEAD_SEC,
      ARC_CORE_MESSAGE_TEST_STRIKE_INTERVAL_SEC,
    );
  }
  return new ArcCoreMessageDailyRandomStrikeScheduleProvider(ARC_CORE_MESSAGE_WARNING_LEAD_SEC);
}

/**
 * 벽시계 기준 슬롯 디스패치 — 서브코어 tick 에서 호출.
 * 같은 슬롯은 1회만 발화(경고·공격 각각).
 */
export class ArcCoreMessageStrikeScheduleController {
  private provider: ArcCoreMessageStrikeScheduleProvider;
  private activeDayKey = '';
  private warnedStrikeAtMs = new Set<number>();
  private firedStrikeAtMs = new Set<number>();

  constructor(provider?: ArcCoreMessageStrikeScheduleProvider) {
    this.provider = provider ?? resolveDefaultArcCoreMessageStrikeScheduleProvider();
  }

  getProviderId(): string {
    return this.provider.id;
  }

  setProvider(provider: ArcCoreMessageStrikeScheduleProvider): void {
    this.provider = provider;
    this.resetDayState('');
  }

  private resetDayState(dayKey: string): void {
    this.activeDayKey = dayKey;
    this.warnedStrikeAtMs.clear();
    this.firedStrikeAtMs.clear();
  }

  tick(nowMs: number, handlers: ArcCoreMessageStrikeScheduleHandlers): void {
    const plan = this.provider.resolvePlan(nowMs);
    if (plan.dayKey !== this.activeDayKey) {
      this.resetDayState(plan.dayKey);
    }

    for (const slot of plan.slots) {
      if (nowMs >= slot.warningAtMs && !this.warnedStrikeAtMs.has(slot.strikeAtMs)) {
        if (handlers.onWarning(slot)) {
          this.warnedStrikeAtMs.add(slot.strikeAtMs);
        }
      }
      if (nowMs >= slot.strikeAtMs && !this.firedStrikeAtMs.has(slot.strikeAtMs)) {
        if (handlers.onStrike(slot)) {
          this.firedStrikeAtMs.add(slot.strikeAtMs);
        }
      }
    }
  }
}
