/**
 * 의뢰 제한시간 만료 — 착륙/바 탭과 무관하게 벽시계 완료.
 * 전역 타이머 1개. HUD 시계는 표시 전용으로 유지.
 */
import type { MissionProgress } from '../types';

const MAX_TIMER_DELAY_MS = 2_147_000_000;

let watchTimer: ReturnType<typeof setTimeout> | null = null;
let ticking = false;

export function readExpiresAtMs(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return Math.floor(raw);
}

export function resolveEarliestActiveExpiresAtMs(
  progresses: Record<string, MissionProgress | undefined>,
): number | null {
  const ids = Object.keys(progresses);
  let earliest: number | null = null;
  for (let i = 0; i < ids.length; i += 1) {
    const row = progresses[ids[i]!];
    if (!row || row.status !== 'active') continue;
    const at = readExpiresAtMs(row.expiresAtMs);
    if (at == null) continue;
    if (earliest == null || at < earliest) earliest = at;
  }
  return earliest;
}

export function inspectMissionExpireSchedule(
  progresses: Record<string, MissionProgress | undefined>,
  nowMs: number,
): { due: boolean; nextAtMs: number | null } {
  const ids = Object.keys(progresses);
  let due = false;
  let nextAtMs: number | null = null;
  for (let i = 0; i < ids.length; i += 1) {
    const row = progresses[ids[i]!];
    if (!row || row.status !== 'active') continue;
    const at = readExpiresAtMs(row.expiresAtMs);
    if (at == null) continue;
    if (at <= nowMs) {
      due = true;
      continue;
    }
    if (nextAtMs == null || at < nextAtMs) nextAtMs = at;
  }
  return { due, nextAtMs };
}

export function clearMissionExpireWatch(): void {
  if (!watchTimer) return;
  clearTimeout(watchTimer);
  watchTimer = null;
}

export function isMissionExpireWatchBusy(): boolean {
  return ticking;
}

export function scheduleMissionExpireWatch(nowMs: number = Date.now()): void {
  if (ticking) return;
  clearMissionExpireWatch();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useMissionStore } = require('../store/missionStore') as typeof import('../store/missionStore');
  const { due, nextAtMs } = inspectMissionExpireSchedule(useMissionStore.getState().progresses, nowMs);
  if (due) {
    watchTimer = setTimeout(() => {
      watchTimer = null;
      tickMissionExpireRealtime();
    }, 0);
    return;
  }
  if (nextAtMs == null) return;
  const delay = Math.max(0, Math.min(MAX_TIMER_DELAY_MS, nextAtMs - nowMs));
  watchTimer = setTimeout(() => {
    watchTimer = null;
    tickMissionExpireRealtime();
  }, delay);
}

export function tickMissionExpireRealtime(nowMs: number = Date.now()): number {
  if (ticking) return 0;
  ticking = true;
  let expired = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useMissionStore } = require('../store/missionStore') as typeof import('../store/missionStore');
    expired = useMissionStore.getState().sweepExpiredMissions({ nowMs, notify: true });
  } finally {
    ticking = false;
  }
  scheduleMissionExpireWatch(Date.now());
  return expired;
}
