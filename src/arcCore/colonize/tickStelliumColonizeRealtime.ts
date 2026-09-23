import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  ensureStelliumColonizeHydrated,
  replaceStelliumColonizeRecords,
  useStelliumColonizeStore,
} from '../../store/stelliumColonizeStore';
import { applyStelliumColonizeTickResult } from './applyStelliumColonizeTick';
import {
  countReadyShips,
  earliestFleetReadyAtMs,
  listQueuedHandoffCandidates,
  seedFleetReadyAtMs,
} from './stelliumColonizeDispatch';
import {
  countInFlight,
  recallStelliumColonizeUnguardedApproaches,
  tickStelliumColonizeDay,
  tickStelliumColonizeOutpost,
} from './stelliumColonizeEngine';
import {
  meetsStelliumColonizeHqDefenseSat,
  resolveStelliumColonizeDefenseSatLevel,
} from './stelliumColonizeDefenseSat';
import { resolveStelliumColonizeFleet } from './stelliumColonizeFleet';
import {
  applyStelliumColonizeDailyOpex,
  bindStelliumColonizeRuntimeFiscal,
} from './stelliumColonizeFiscal';
import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { StelliumColonizeCoreGauges } from './stelliumColonizeTypes';

/** 전역 1개 — 행성 이탈과 무관. 재스케줄 시 교체. */
let handoffTimer: ReturnType<typeof setTimeout> | null = null;
let handoffSync = false;
/** 행성당 전초기지 워치 1개 — 허브 재진입 중복 방지 */
const outpostTimers = new Map<string, ReturnType<typeof setTimeout>>();

function resolveGauges(planetId: string): StelliumColonizeCoreGauges {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (runtime) {
    return {
      resource: runtime.resource,
      population: runtime.population,
      defense: runtime.defense,
      technology: runtime.technology,
      environment: runtime.environment,
    };
  }
  return { resource: 50, population: 50, defense: 50, technology: 50, environment: 50 };
}

/** 착륙·일일 배치 — 전초기지 벽시계 + 기한 지난 사령부 catch-up */
export function tickStelliumColonizeRealtime(input?: {
  nowMs?: number;
  todayKey?: string;
  persistNow?: boolean;
  presentHqAlert?: boolean;
}): { outposts: number; succeeded: number; failed: number } {
  const policy = resolveStelliumColonizePolicy();
  if (!policy.enabled) return { outposts: 0, succeeded: 0, failed: 0 };
  if (!useStelliumColonizeStore.getState().hydrated) {
    void ensureStelliumColonizeHydrated().then(() => {
      tickStelliumColonizeRealtime(input);
    });
    return { outposts: 0, succeeded: 0, failed: 0 };
  }
  const fleet = resolveStelliumColonizeFleet(policy);
  const nowMs = input?.nowMs ?? Date.now();
  const todayKey = input?.todayKey ?? planetAttackKstDayKey();
  const store = useStelliumColonizeStore.getState();
  const fiscal = bindStelliumColonizeRuntimeFiscal(policy);
  const preOpex = applyStelliumColonizeDailyOpex(store.byPlanetId, todayKey, policy);
  const ticked = tickStelliumColonizeDay({
    records: preOpex,
    todayKey,
    policy,
    resolveGauges,
    nowMs,
    outpostArriveSec: fleet.outpostArriveSec,
    fleetReadyAtMs: store.fleetReadyAtMs,
    handoffSec: fleet.handoffSec,
    operationalCap: fleet.operationalCap,
    fiscal,
  });
  if (ticked.events.length === 0) {
    if (preOpex !== store.byPlanetId) {
      replaceStelliumColonizeRecords(preOpex, input?.persistNow === true, ticked.fleetReadyAtMs);
    }
    scheduleStelliumColonizeHandoffWatch(nowMs);
    scheduleStelliumColonizeOutpostWatches(nowMs);
    return { outposts: 0, succeeded: 0, failed: 0 };
  }
  const records = applyStelliumColonizeDailyOpex(ticked.records, todayKey, policy);
  const applied = applyStelliumColonizeTickResult({
    records,
    events: ticked.events,
    policy,
    persistNow: input?.persistNow,
    presentHqAlert: input?.presentHqAlert,
    fleetReadyAtMs: ticked.fleetReadyAtMs,
    todayKey,
    applySuccessBond: true,
  });
  scheduleStelliumColonizeHandoffWatch(nowMs);
  scheduleStelliumColonizeOutpostWatches(nowMs);
  return applied;
}

/** 착륙 1회 — 전초기지 승격·사령부 catch-up·남은 5분 워치 */
export function syncStelliumColonizeOnHubPresence(planetId: string, nowMs: number = Date.now()): void {
  void planetId;
  tickStelliumColonizeRealtime({ nowMs, persistNow: false, presentHqAlert: true });
}

export function clearStelliumColonizeHandoffWatch(): void {
  if (!handoffTimer) return;
  clearTimeout(handoffTimer);
  handoffTimer = null;
}

function shouldFireHandoffNow(nowMs: number): boolean {
  const store = useStelliumColonizeStore.getState();
  const queued = listQueuedHandoffCandidates(store.byPlanetId);
  if (queued.length === 0) return false;
  const policy = resolveStelliumColonizePolicy();
  let satReady = 0;
  for (let i = 0; i < queued.length; i += 1) {
    if (meetsStelliumColonizeHqDefenseSat(
      policy.requireDefenseSatLevel,
      resolveStelliumColonizeDefenseSatLevel(queued[i]!.planetId),
    )) {
      satReady += 1;
      break;
    }
  }
  if (satReady <= 0) return false;
  const ready = store.fleetReadyAtMs;
  if (!ready || ready.length === 0) return false;
  if (countReadyShips(ready, nowMs) === 0) return false;
  const fleet = resolveStelliumColonizeFleet();
  return countInFlight(store.byPlanetId) < fleet.operationalCap;
}

/** 임무 종료 5분 후 다음 대기 성계 출항 — 모듈 타이머 1개 */
export function scheduleStelliumColonizeHandoffWatch(nowMs: number = Date.now()): void {
  if (handoffSync) return;
  const store = useStelliumColonizeStore.getState();
  const ready = store.fleetReadyAtMs;
  if (!ready || ready.length === 0) {
    clearStelliumColonizeHandoffWatch();
    return;
  }
  const earliest = earliestFleetReadyAtMs(ready);
  if (earliest == null) {
    clearStelliumColonizeHandoffWatch();
    return;
  }
  const remain = Math.max(0, earliest - nowMs);
  if (remain <= 0) {
    if (!shouldFireHandoffNow(nowMs)) {
      clearStelliumColonizeHandoffWatch();
      return;
    }
    clearStelliumColonizeHandoffWatch();
    handoffSync = true;
    try {
      let guard = 0;
      while (shouldFireHandoffNow(Date.now()) && guard < 4) {
        tickStelliumColonizeRealtime({ persistNow: false, presentHqAlert: true });
        guard += 1;
      }
    } finally {
      handoffSync = false;
    }
    const later = Date.now();
    const readyAfter = useStelliumColonizeStore.getState().fleetReadyAtMs;
    const earliestAfter = readyAfter && readyAfter.length > 0
      ? earliestFleetReadyAtMs(readyAfter)
      : null;
    if (earliestAfter != null && earliestAfter > later) {
      scheduleStelliumColonizeHandoffWatch(later);
    }
    return;
  }
  clearStelliumColonizeHandoffWatch();
  handoffTimer = setTimeout(() => {
    handoffTimer = null;
    tickStelliumColonizeRealtime({ persistNow: false, presentHqAlert: true });
  }, remain);
}

function fireStelliumColonizeOutpostTick(): void {
  const policy = resolveStelliumColonizePolicy();
  const store = useStelliumColonizeStore.getState();
  const nowMs = Date.now();
  const fleet = resolveStelliumColonizeFleet(policy);
  const recalled = recallStelliumColonizeUnguardedApproaches({
    records: store.byPlanetId,
    fleetReadyAtMs: seedFleetReadyAtMs(
      store.fleetReadyAtMs,
      fleet.operationalCap,
      countInFlight(store.byPlanetId),
    ),
    nowMs,
    requiredDefenseSatLevel: policy.requireDefenseSatLevel,
    resolveDefenseSatLevel: resolveStelliumColonizeDefenseSatLevel,
  });
  const out = tickStelliumColonizeOutpost({
    records: recalled.records,
    nowMs,
  });
  const events = recalled.events.concat(out.events);
  if (events.length === 0) return;
  applyStelliumColonizeTickResult({
    records: out.records,
    events,
    policy,
    persistNow: false,
    presentHqAlert: false,
    fleetReadyAtMs: recalled.fleetReadyAtMs,
  });
}

export function clearStelliumColonizeOutpostWatch(planetId?: string): void {
  if (planetId) {
    const timer = outpostTimers.get(planetId);
    if (!timer) return;
    clearTimeout(timer);
    outpostTimers.delete(planetId);
    return;
  }
  outpostTimers.forEach((timer) => {
    clearTimeout(timer);
  });
  outpostTimers.clear();
}

/** 비행 중인 개척선 전초기지 — 행성당 타이머 1개 */
export function scheduleStelliumColonizeOutpostWatches(nowMs: number = Date.now()): void {
  const byPlanetId = useStelliumColonizeStore.getState().byPlanetId;
  const keys = Object.keys(byPlanetId);
  let dueNow = false;
  for (let i = 0; i < keys.length; i += 1) {
    const row = byPlanetId[keys[i]];
    if (!row || row.phase !== 'in_flight') {
      clearStelliumColonizeOutpostWatch(keys[i]);
      continue;
    }
    const remain = row.outpostDueAtMs == null ? 0 : Math.max(0, row.outpostDueAtMs - nowMs);
    if (remain <= 0) {
      dueNow = true;
      continue;
    }
    scheduleStelliumColonizeOutpostWatch(row.planetId, nowMs);
  }
  if (dueNow) fireStelliumColonizeOutpostTick();
}

/** 허브 이탈과 무관 — 벽시계 5분 전초기지. 동일 행성은 1개만. */
export function scheduleStelliumColonizeOutpostWatch(planetId: string, nowMs: number = Date.now()): void {
  const id = String(planetId ?? '').trim();
  if (!id) return;
  const row = useStelliumColonizeStore.getState().byPlanetId[id];
  if (!row || row.phase !== 'in_flight') {
    clearStelliumColonizeOutpostWatch(id);
    return;
  }
  const dueAt = row.outpostDueAtMs;
  const remain = dueAt == null ? 0 : Math.max(0, dueAt - nowMs);
  if (remain <= 0) {
    clearStelliumColonizeOutpostWatch(id);
    fireStelliumColonizeOutpostTick();
    return;
  }
  if (outpostTimers.has(id)) return;
  const timer = setTimeout(() => {
    outpostTimers.delete(id);
    fireStelliumColonizeOutpostTick();
    scheduleStelliumColonizeOutpostWatches(Date.now());
  }, remain);
  outpostTimers.set(id, timer);
}
