/**
 * 미확인 이상현상 [테스트] — 전역 timeout 1개.
 * 30분마다 보이는 성계 1곳 · 약 10분 유지 · 발생 시 범용 알림.
 * 스폰은 시각과 무관하게 만기 즉시. 팝업은 타이틀·항로만 미루고 허브·맵에서 즉시(4초 폴링 없음).
 */
import { AppState, type NativeEventSubscription } from 'react-native';
import { shouldSkipUnidentifiedAnomalyAlert } from '../../arcCore/territorial/territorialAlertGate';
import { resolveSensorFogExtraHops } from '../../game/playerOwnedSkillNavAdjust';
import { resolveGalaxyMapTravelFogRevealedIds } from '../../galaxyMap/galaxyMapTravelFog';
import { inspectUnidentifiedAnomalySchedule } from './inspectUnidentifiedAnomalySchedule';
import { presentUnidentifiedAnomalyAlert, resolveUnidentifiedAnomalySystemLabel } from './presentUnidentifiedAnomalyAlert';
import {
  listUnidentifiedAnomalyVisibleSystemIds,
  selectUnidentifiedAnomalyTestSite,
} from './selectUnidentifiedAnomalyTestSite';
import {
  UNIDENTIFIED_ANOMALY_EMPTY_POOL_RETRY_MS,
  UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS,
  UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS,
} from './unidentifiedAnomalyTestPolicy';

const MAX_TIMER_DELAY_MS = 2_147_000_000;

let watchTimer: ReturnType<typeof setTimeout> | null = null;
let ticking = false;
let appSub: NativeEventSubscription | null = null;

function requireAnomalyStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
}

export function clearUnidentifiedAnomalyTestWatch(): void {
  if (watchTimer) {
    clearTimeout(watchTimer);
    watchTimer = null;
  }
  if (appSub) {
    appSub.remove();
    appSub = null;
  }
}

export function isUnidentifiedAnomalyTestWatchBusy(): boolean {
  return ticking;
}

function persistSoon(): void {
  void requireAnomalyStore().useUnidentifiedAnomalyStore.getState().persistLocal();
}

function ensureAppResumeKick(): void {
  if (appSub) return;
  appSub = AppState.addEventListener('change', (next) => {
    if (next === 'active') scheduleUnidentifiedAnomalyTestWatch();
  });
}

function resolveVisiblePool(): { ids: string[]; lastSystemId: string | null } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  const world = useWorldStore.getState();
  const player = usePlayerStore.getState().player;
  const fog = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: world.visitedSystemIds,
    currentSystemId: player?.currentSystemId,
    systems: world.systems,
    extraNeighborHops: resolveSensorFogExtraHops(player?.skills),
  });
  const systemIds = Object.keys(world.systems);
  return {
    ids: listUnidentifiedAnomalyVisibleSystemIds(systemIds, world.unlockedSystemIds, fog),
    lastSystemId: requireAnomalyStore().useUnidentifiedAnomalyStore.getState().lastSystemId,
  };
}

function trySpawn(nowMs: number): boolean {
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const { pickAnomalyPlanetInSystem } =
    require('./pickAnomalyPlanetInSystem') as typeof import('./pickAnomalyPlanetInSystem');
  const pool = resolveVisiblePool();
  const systemId = selectUnidentifiedAnomalyTestSite(pool.ids, pool.lastSystemId);
  if (!systemId) {
    useUnidentifiedAnomalyStore.getState().deferNextSpawn(nowMs + UNIDENTIFIED_ANOMALY_EMPTY_POOL_RETRY_MS);
    persistSoon();
    return false;
  }
  const planetId = pickAnomalyPlanetInSystem(useWorldStore.getState().getSystem(systemId));
  if (!planetId) {
    useUnidentifiedAnomalyStore.getState().deferNextSpawn(nowMs + UNIDENTIFIED_ANOMALY_EMPTY_POOL_RETRY_MS);
    persistSoon();
    return false;
  }
  useUnidentifiedAnomalyStore.getState().applySpawn({
    systemId,
    planetId,
    startedAtMs: nowMs,
    expiresAtMs: nowMs + UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS,
    nextSpawnAtMs: nowMs + UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS,
    payloadKind: 'relic',
  });
  persistSoon();
  const sys = useWorldStore.getState().getSystem(systemId);
  presentUnidentifiedAnomalyAlert(resolveUnidentifiedAnomalySystemLabel(sys, systemId), () => {
    const inst = useUnidentifiedAnomalyStore.getState().active?.instanceId;
    if (inst) useUnidentifiedAnomalyStore.getState().markAlerted(inst);
    persistSoon();
  });
  return true;
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

export function tickUnidentifiedAnomalyTestRotation(nowMs: number = Date.now()): void {
  if (ticking) return;
  ticking = true;
  try {
    const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
    const st = useUnidentifiedAnomalyStore.getState();
    if (!st.loaded) return;
    const { settleDue, spawnDue } = inspectUnidentifiedAnomalySchedule(
      {
        activeExpiresAtMs: st.active?.expiresAtMs ?? null,
        nextSpawnAtMs: st.nextSpawnAtMs,
      },
      nowMs,
    );
    if (settleDue) {
      const { settleAnomalyEvent } =
        require('./settleAnomalyEvent') as typeof import('./settleAnomalyEvent');
      const status = st.active?.status;
      settleAnomalyEvent(
        status === 'listed' || !status ? 'unaccepted_ttl' : 'expired',
        st.active?.instanceId,
      );
      persistSoon();
    }
    if (spawnDue) {
      trySpawn(nowMs);
    } else {
      presentPendingIfNeeded();
    }
  } finally {
    ticking = false;
    scheduleUnidentifiedAnomalyTestWatch(Date.now());
  }
}

export function scheduleUnidentifiedAnomalyTestWatch(nowMs: number = Date.now()): void {
  if (ticking) return;
  if (watchTimer) {
    clearTimeout(watchTimer);
    watchTimer = null;
  }
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const st = useUnidentifiedAnomalyStore.getState();
  if (!st.loaded) return;
  ensureAppResumeKick();
  const { settleDue, spawnDue, nextAtMs } = inspectUnidentifiedAnomalySchedule(
    {
      activeExpiresAtMs: st.active?.expiresAtMs ?? null,
      nextSpawnAtMs: st.nextSpawnAtMs,
    },
    nowMs,
  );
  const skipUi = shouldSkipUnidentifiedAnomalyAlert();
  const unalerted = Boolean(st.active && st.alertedInstanceId !== st.active.instanceId);

  if (settleDue || spawnDue || (unalerted && !skipUi)) {
    watchTimer = setTimeout(() => {
      watchTimer = null;
      tickUnidentifiedAnomalyTestRotation();
    }, 0);
    return;
  }
  if (nextAtMs == null) return;
  const delay = Math.max(0, Math.min(MAX_TIMER_DELAY_MS, nextAtMs - nowMs));
  watchTimer = setTimeout(() => {
    watchTimer = null;
    tickUnidentifiedAnomalyTestRotation();
  }, delay);
}
