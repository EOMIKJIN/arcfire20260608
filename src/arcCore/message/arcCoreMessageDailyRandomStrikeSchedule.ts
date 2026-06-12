import type {
  ArcCoreMessageStrikeDayPlan,
  ArcCoreMessageStrikeScheduleProvider,
  ArcCoreMessageStrikeScheduleSlot,
} from './arcCoreMessageStrikeScheduleTypes';
import {
  ARC_CORE_MESSAGE_DAY_SEC,
  resolveArcCoreMessageLocalDayKey,
  resolveArcCoreMessageLocalDayStartMs,
} from './arcCoreMessageStrikeScheduleDay';

export {
  ARC_CORE_MESSAGE_DAY_SEC,
  resolveArcCoreMessageLocalDayKey,
  resolveArcCoreMessageLocalDayStartMs,
} from './arcCoreMessageStrikeScheduleDay';

/** 아크코어 메시지 — 1일 공격 횟수(현재 정책) */
export const ARC_CORE_MESSAGE_STRIKES_PER_DAY = 12;

/** 일자 문자열 → 결정적 시드(재시작해도 같은 날 동일 슬롯) */
function hashDaySeed(dayKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i += 1) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 1일을 N개 구간으로 나누고 구간마다 랜덤 시각 — 과도한 연속 공격 방지.
 */
export function buildArcCoreMessageDailyRandomStrikeOffsetsSec(
  dayKey: string,
  strikesPerDay = ARC_CORE_MESSAGE_STRIKES_PER_DAY,
): number[] {
  const bucketSec = Math.floor(ARC_CORE_MESSAGE_DAY_SEC / Math.max(1, strikesPerDay));
  const rng = mulberry32(hashDaySeed(dayKey));
  const offsets: number[] = [];
  for (let i = 0; i < strikesPerDay; i += 1) {
    const base = i * bucketSec;
    const jitter = Math.floor(rng() * Math.max(1, bucketSec - 1));
    offsets.push(Math.min(ARC_CORE_MESSAGE_DAY_SEC - 1, base + jitter));
  }
  return offsets.sort((a, b) => a - b);
}

export function buildArcCoreMessageStrikeDayPlan(
  dayKey: string,
  warningLeadSec: number,
  strikesPerDay = ARC_CORE_MESSAGE_STRIKES_PER_DAY,
): ArcCoreMessageStrikeDayPlan {
  const dayStartMs = resolveArcCoreMessageLocalDayStartMs(dayKey);
  const offsets = buildArcCoreMessageDailyRandomStrikeOffsetsSec(dayKey, strikesPerDay);
  const leadMs = Math.max(0, warningLeadSec) * 1000;
  const slots: ArcCoreMessageStrikeScheduleSlot[] = offsets.map((offsetSec) => {
    const strikeAtMs = dayStartMs + offsetSec * 1000;
    return {
      offsetSec,
      strikeAtMs,
      warningAtMs: Math.max(dayStartMs, strikeAtMs - leadMs),
    };
  });
  return { dayKey, dayStartMs, slots };
}

/**
 * 기본 스케줄 — 로컬 1일 12회 랜덤(구간 지터).
 * 향후 `ArcCoreMessageStrikeScheduleController.setProvider()` 로 교체.
 */
export class ArcCoreMessageDailyRandomStrikeScheduleProvider
  implements ArcCoreMessageStrikeScheduleProvider
{
  readonly id = 'arc_core_message_daily_random_v1';

  constructor(
    private readonly warningLeadSec: number,
    private readonly strikesPerDay = ARC_CORE_MESSAGE_STRIKES_PER_DAY,
  ) {}

  private cachedDayKey = '';
  private cachedPlan: ArcCoreMessageStrikeDayPlan | null = null;

  resolvePlan(nowMs: number): ArcCoreMessageStrikeDayPlan {
    const dayKey = resolveArcCoreMessageLocalDayKey(nowMs);
    if (this.cachedDayKey === dayKey && this.cachedPlan) {
      return this.cachedPlan;
    }
    this.cachedDayKey = dayKey;
    this.cachedPlan = buildArcCoreMessageStrikeDayPlan(
      dayKey,
      this.warningLeadSec,
      this.strikesPerDay,
    );
    return this.cachedPlan;
  }
}
