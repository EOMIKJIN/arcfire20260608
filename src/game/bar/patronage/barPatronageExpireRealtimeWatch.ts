/**
 * 바 후원 세션 — 바 화면을 열지 않아도 endsAtMs에 만료.
 * 전역 타이머 1개. 혜택 게이트(isLivePaidPatronageSession)는 그대로 벽시계 비교.
 */
import type { BarPatronageSession } from '../../../store/barPatronageStore';

const MAX_TIMER_DELAY_MS = 2_147_000_000;

let watchTimer: ReturnType<typeof setTimeout> | null = null;
let ticking = false;

export function inspectBarPatronageExpireSchedule(
  session: BarPatronageSession | null | undefined,
  nowMs: number,
): { due: boolean; nextAtMs: number | null } {
  if (!session || session.phase === 'ended') {
    return { due: false, nextAtMs: null };
  }
  const at = session.endsAtMs;
  if (typeof at !== 'number' || !Number.isFinite(at)) {
    return { due: false, nextAtMs: null };
  }
  if (at <= nowMs) return { due: true, nextAtMs: null };
  return { due: false, nextAtMs: Math.floor(at) };
}

export function clearBarPatronageExpireWatch(): void {
  if (!watchTimer) return;
  clearTimeout(watchTimer);
  watchTimer = null;
}

export function isBarPatronageExpireWatchBusy(): boolean {
  return ticking;
}

export function scheduleBarPatronageExpireWatch(nowMs: number = Date.now()): void {
  if (ticking) return;
  clearBarPatronageExpireWatch();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useBarPatronageStore } =
    require('../../../store/barPatronageStore') as typeof import('../../../store/barPatronageStore');
  const { due, nextAtMs } = inspectBarPatronageExpireSchedule(
    useBarPatronageStore.getState().activeSession,
    nowMs,
  );
  if (due) {
    watchTimer = setTimeout(() => {
      watchTimer = null;
      tickBarPatronageExpireRealtime();
    }, 0);
    return;
  }
  if (nextAtMs == null) return;
  const delay = Math.max(0, Math.min(MAX_TIMER_DELAY_MS, nextAtMs - nowMs));
  watchTimer = setTimeout(() => {
    watchTimer = null;
    tickBarPatronageExpireRealtime();
  }, delay);
}

export function tickBarPatronageExpireRealtime(nowMs: number = Date.now()): boolean {
  if (ticking) return false;
  ticking = true;
  let expired = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useBarPatronageStore } =
      require('../../../store/barPatronageStore') as typeof import('../../../store/barPatronageStore');
    expired = useBarPatronageStore.getState().expireSessionIfNeeded(nowMs);
  } finally {
    ticking = false;
  }
  scheduleBarPatronageExpireWatch(Date.now());
  return expired;
}
