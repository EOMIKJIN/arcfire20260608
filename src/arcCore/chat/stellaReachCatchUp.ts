// 접속 순간 소급. 타이머 없음. 마지막 허브 시각 이후 스텔라 쉬는 칸만 30분 간격으로 판단한다.

import { playerObserveDayOf } from '../../game/playerObserve/playerObserveSink';
import {
  decideStellaObserve,
  noteStellaObserveShown,
  stellaReachHit,
  type StellaObserveContext,
  type StellaObserveGateState,
} from './stellaObserveGate';
import { getStellaObserveGatePolicy } from './stellaObserveTableIndex';
import { isStellaLifeFreeSlot, stellaLifeSlotAt } from './stellaLifeResolve';

export const STELLA_REACH_REASON = 'stella_reach';
export const STELLA_REACH_KEEP = 4;
const STEP_MIN = 30;
const MIN_MS = 60_000;
/** 14일. 안 읽은 수가 문턱을 넘기면 그보다 일찍 멈춘다. */
const MAX_STEPS = 48 * 14;
/** 안 읽은 연락이 이만큼 쌓이면 더 보내지 않는다. 한 번 소급의 줄 수 상한이기도 하다. */
export const STELLA_UNREAD_STOP = 8;

export type StellaReachLine = {
  atMs: number;
  textKo: string;
  textEn: string;
};

export function walkStellaReachAway(input: {
  state: StellaObserveGateState;
  fromMs: number;
  toMs: number;
  uid: string;
  level: number;
}): StellaReachLine[] {
  const from = input.fromMs;
  const to = input.toMs;
  if (!(to > from)) return [];
  const policy = getStellaObserveGatePolicy();
  const step = STEP_MIN * MIN_MS;
  const hit = stellaReachHit('check_in');
  const lines: StellaReachLine[] = [];
  const hits = [hit];
  const ctx: StellaObserveContext = {
    nowMs: 0,
    day: 0,
    safeSlot: true,
    otherPopupThisEntry: false,
    originLastAtMs: 0,
    originPendingNow: false,
    lifeAskLastAtMs: 0,
    stellaOnDuty: false,
    casualFirstHigh: false,
    recent: [],
    unread: 0,
  };
  let steps = 0;
  for (let t = Math.ceil(from / step) * step; t < to; t += step) {
    steps += 1;
    if (steps > MAX_STEPS) break;
    if (input.state.unread >= STELLA_UNREAD_STOP) break;
    const slot = stellaLifeSlotAt(t, input.uid);
    if (!isStellaLifeFreeSlot(slot)) continue;
    const day = playerObserveDayOf(t);
    ctx.nowMs = t;
    ctx.day = day;
    ctx.unread = input.state.unread;
    const decision = decideStellaObserve(hits, input.state, ctx, policy);
    if (decision.kind !== 'speak') continue;
    noteStellaObserveShown(input.state, decision, { nowMs: t, day, level: input.level });
    input.state.unread = Math.min(99, input.state.unread + 1);
    lines.push({ atMs: t, textKo: slot.activityKo, textEn: slot.activityEn });
  }
  return lines;
}

export function stellaReachSessionLines(
  messages: readonly { reason?: string; atMs: number; text: string }[],
  lastReadAtMs: number,
): { atMs: number; text: string }[] {
  const picked: { atMs: number; text: string }[] = [];
  for (let i = messages.length - 1; i >= 0 && picked.length < STELLA_REACH_KEEP; i -= 1) {
    const row = messages[i];
    if (!row || row.reason !== STELLA_REACH_REASON) continue;
    if (row.atMs <= lastReadAtMs) continue;
    if (!row.text) continue;
    picked.push({ atMs: row.atMs, text: row.text });
  }
  picked.reverse();
  return picked;
}
