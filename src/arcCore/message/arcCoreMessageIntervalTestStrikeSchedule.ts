import type {
  ArcCoreMessageStrikeDayPlan,
  ArcCoreMessageStrikeScheduleProvider,
  ArcCoreMessageStrikeScheduleSlot,
} from './arcCoreMessageStrikeScheduleTypes';
import {
  resolveArcCoreMessageLocalDayKey,
  resolveArcCoreMessageLocalDayStartMs,
} from './arcCoreMessageStrikeScheduleDay';

/** 테스트용 — 로컬 1일 기준 intervalSec 마다 공격(기본 60초). tick당 슬롯 4~5개만 노출. */
export class ArcCoreMessageIntervalTestStrikeScheduleProvider
  implements ArcCoreMessageStrikeScheduleProvider
{
  readonly id = 'arc_core_message_test_interval_v1';

  constructor(
    private readonly warningLeadSec: number,
    private readonly intervalSec = 60,
  ) {}

  resolvePlan(nowMs: number): ArcCoreMessageStrikeDayPlan {
    const dayKey = resolveArcCoreMessageLocalDayKey(nowMs);
    const dayStartMs = resolveArcCoreMessageLocalDayStartMs(dayKey);
    const intervalMs = Math.max(1, this.intervalSec) * 1000;
    const leadMs = Math.max(0, this.warningLeadSec) * 1000;
    const elapsed = Math.max(0, nowMs - dayStartMs);
    const centerBucket = Math.floor(elapsed / intervalMs);

    const slots: ArcCoreMessageStrikeScheduleSlot[] = [];
    for (let b = centerBucket - 1; b <= centerBucket + 2; b += 1) {
      if (b < 0) continue;
      const strikeAtMs = dayStartMs + b * intervalMs;
      const offsetSec = Math.floor((strikeAtMs - dayStartMs) / 1000);
      slots.push({
        offsetSec,
        strikeAtMs,
        warningAtMs: Math.max(dayStartMs, strikeAtMs - leadMs),
      });
    }

    return { dayKey, dayStartMs, slots };
  }
}
