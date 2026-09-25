/**
 * 미확인 이상현상 정본 워치 — 전역 timeout 1개.
 * 스폰은 식별(A) · 일일 추첨(B). 만기 즉시 settle. 팝업은 타이틀·항로만 미룸.
 */
import { AppState, type NativeEventSubscription } from 'react-native';
import { shouldSkipUnidentifiedAnomalyAlert } from '../../arcCore/territorial/territorialAlertGate';
import { inspectUnidentifiedAnomalySchedule } from './inspectUnidentifiedAnomalySchedule';
import { presentUnidentifiedAnomalyAlert, resolveUnidentifiedAnomalySystemLabel } from './presentUnidentifiedAnomalyAlert';
import { tryUnidentifiedAnomalyDailySpawn } from './tryUnidentifiedAnomalySpawn';

const MAX_TIMER_DELAY_MS = 2_147_000_000;

let watchTimer: ReturnType<typeof setTimeout> | null = null;
let ticking = false;
let appSub: NativeEventSubscription | null = null;

function requireAnomalyStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
}

export function clearUnidentifiedAnomalySpawnWatch(): void {
  if (watchTimer) {
    clearTimeout(watchTimer);
    watchTimer = null;
  }
  if (appSub) {
    appSub.remove();
    appSub = null;
  }
}

/** @deprecated 정본 승격 — clearUnidentifiedAnomalySpawnWatch */
export const clearUnidentifiedAnomalyTestWatch = clearUnidentifiedAnomalySpawnWatch;

export function isUnidentifiedAnomalySpawnWatchBusy(): boolean {
  return ticking;
}

/** @deprecated 정본 승격 — isUnidentifiedAnomalySpawnWatchBusy */
export const isUnidentifiedAnomalyTestWatchBusy = isUnidentifiedAnomalySpawnWatchBusy;

function persistSoon(): void {
  void requireAnomalyStore().useUnidentifiedAnomalyStore.getState().persistLocal();
}

function ensureAppResumeKick(): void {
  if (appSub) return;
  appSub = AppState.addEventListener('change', (next) => {
    if (next === 'active') scheduleUnidentifiedAnomalySpawnWatch();
  });
}

function presentPendingIfNeeded(): void {
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const st = useUnidentifiedAnomalyStore.getState();
  if (!st.active || st.alertedInstanceId === st.active.instanceId) return;
  if (shouldSkipUnidentifiedAnomalyAlert()) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const sys = useWorldStore.getState().getSystem(st.active.systemId);
  const instanceId = st.active.instanceId;
  presentUnidentifiedAnomalyAlert(resolveUnidentifiedAnomalySystemLabel(sys, st.active.systemId), () => {
    useUnidentifiedAnomalyStore.getState().markAlerted(instanceId);
    persistSoon();
  });
}

export function tickUnidentifiedAnomalySpawn(nowMs: number = Date.now()): void {
  if (ticking) return;
  ticking = true;
  try {
    const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
    const st = useUnidentifiedAnomalyStore.getState();
    if (!st.loaded) return;
    if (st.syncDailySpawnDay(nowMs)) persistSoon();
    const latest = useUnidentifiedAnomalyStore.getState();
    const { settleDue, spawnDue } = inspectUnidentifiedAnomalySchedule(
      {
        activeExpiresAtMs: latest.active?.expiresAtMs ?? null,
        nextSpawnAtMs: latest.nextSpawnAtMs,
      },
      nowMs,
    );
    if (settleDue) {
      const { settleAnomalyEvent } =
        require('./settleAnomalyEvent') as typeof import('./settleAnomalyEvent');
      const status = latest.active?.status;
      settleAnomalyEvent(
        status === 'listed' || !status ? 'unaccepted_ttl' : 'expired',
        latest.active?.instanceId,
      );
      persistSoon();
    }
    const afterSettle = useUnidentifiedAnomalyStore.getState();
    const stillSpawnDue =
      spawnDue
      || inspectUnidentifiedAnomalySchedule(
        {
          activeExpiresAtMs: afterSettle.active?.expiresAtMs ?? null,
          nextSpawnAtMs: afterSettle.nextSpawnAtMs,
        },
        nowMs,
      ).spawnDue;
    if (stillSpawnDue && !afterSettle.active) {
      tryUnidentifiedAnomalyDailySpawn(nowMs);
    } else {
      presentPendingIfNeeded();
    }
  } finally {
    ticking = false;
    scheduleUnidentifiedAnomalySpawnWatch(Date.now());
  }
}

/** @deprecated 정본 승격 — tickUnidentifiedAnomalySpawn */
export const tickUnidentifiedAnomalyTestRotation = tickUnidentifiedAnomalySpawn;

export function scheduleUnidentifiedAnomalySpawnWatch(nowMs: number = Date.now()): void {
  if (ticking) return;
  if (watchTimer) {
    clearTimeout(watchTimer);
    watchTimer = null;
  }
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const st = useUnidentifiedAnomalyStore.getState();
  if (!st.loaded) return;
  ensureAppResumeKick();
  if (st.syncDailySpawnDay(nowMs)) persistSoon();
  const latest = useUnidentifiedAnomalyStore.getState();
  const { settleDue, spawnDue, nextAtMs } = inspectUnidentifiedAnomalySchedule(
    {
      activeExpiresAtMs: latest.active?.expiresAtMs ?? null,
      nextSpawnAtMs: latest.nextSpawnAtMs,
    },
    nowMs,
  );
  const skipUi = shouldSkipUnidentifiedAnomalyAlert();
  const unalerted = Boolean(latest.active && latest.alertedInstanceId !== latest.active.instanceId);

  if (settleDue || spawnDue || (unalerted && !skipUi)) {
    watchTimer = setTimeout(() => {
      watchTimer = null;
      tickUnidentifiedAnomalySpawn();
    }, 0);
    return;
  }
  if (nextAtMs == null) return;
  const delay = Math.max(0, Math.min(MAX_TIMER_DELAY_MS, nextAtMs - nowMs));
  watchTimer = setTimeout(() => {
    watchTimer = null;
    tickUnidentifiedAnomalySpawn();
  }, delay);
}

/** @deprecated 정본 승격 — scheduleUnidentifiedAnomalySpawnWatch */
export const scheduleUnidentifiedAnomalyTestWatch = scheduleUnidentifiedAnomalySpawnWatch;
