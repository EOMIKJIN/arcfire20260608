import { useEffect, useState } from 'react';
import { MISSION_TIME_LIMIT_MS_PER_HOUR } from './missionTimeLimit';

const FAST_MS = 1_000;
const SLOW_MS = 30_000;

type ClockSub = {
  setNow: (nowMs: number) => void;
  expiresAtMs: number;
};

const subscribers = new Set<ClockSub>();
let timer: ReturnType<typeof setInterval> | null = null;
let currentIntervalMs = SLOW_MS;

function desiredIntervalMs(nowMs: number): number {
  let needFast = false;
  subscribers.forEach((sub) => {
    if (sub.expiresAtMs > nowMs && sub.expiresAtMs - nowMs < MISSION_TIME_LIMIT_MS_PER_HOUR) {
      needFast = true;
    }
  });
  return needFast ? FAST_MS : SLOW_MS;
}

function restartTimer(intervalMs: number): void {
  if (timer) clearInterval(timer);
  currentIntervalMs = intervalMs;
  timer = setInterval(onTick, intervalMs);
}

function onTick(): void {
  const nowMs = Date.now();
  subscribers.forEach((sub) => {
    sub.setNow(nowMs);
  });
  const next = desiredIntervalMs(nowMs);
  if (next !== currentIntervalMs) restartTimer(next);
}

function ensureTimer(): void {
  if (timer) return;
  restartTimer(desiredIntervalMs(Date.now()));
}

function stopIfEmpty(): void {
  if (subscribers.size > 0) return;
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

/**
 * 제한시간 표시용 공유 시계. persist/틱 경로 아님.
 * 구독 0이면 타이머 해제. 남은 시간 1시간 미만만 1초, 그 외 30초.
 */
export function useMissionTimeLimitNow(expiresAtMs?: number | null): number {
  const [nowMs, setNow] = useState(Date.now);
  useEffect(() => {
    if (expiresAtMs == null || expiresAtMs <= 0) return undefined;
    const sub: ClockSub = { setNow, expiresAtMs };
    subscribers.add(sub);
    ensureTimer();
    return () => {
      subscribers.delete(sub);
      stopIfEmpty();
    };
  }, [expiresAtMs]);
  return nowMs;
}
