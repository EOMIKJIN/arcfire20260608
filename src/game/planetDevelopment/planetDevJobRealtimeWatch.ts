/**
 * 행성개발 job — 착륙/목록 UI와 무관하게 벽시계 완료.
 * 전역 타이머 1개 + 활성 행성 Set(소수). 전 행성 매초 순회 없음.
 */
import type { PlanetCoreRuntime } from '../../store/planetCoreRuntimeStore';

const MAX_WATCHED_PLANETS = 128;
const MAX_TIMER_DELAY_MS = 2_147_000_000;

let watchTimer: ReturnType<typeof setTimeout> | null = null;
let ticking = false;
const watchedPlanetIds = new Set<string>();

export function readDevJobCompleteAtMs(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const ms = (raw as { completeAtMs?: unknown }).completeAtMs;
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  return Math.floor(ms);
}

export function resolvePlanetDevJobEarliestAtMs(runtime: PlanetCoreRuntime | undefined): number | null {
  if (!runtime?.detail) return null;
  let earliest: number | null = null;
  const consider = (job: unknown) => {
    const at = readDevJobCompleteAtMs(job);
    if (at == null) return;
    if (earliest == null || at < earliest) earliest = at;
  };
  consider(runtime.detail.defenseSatellite?.upgradeJob);
  consider(runtime.detail.coreStatRd?.activeJob);
  const mods = runtime.detail.development?.byModuleId;
  if (mods) {
    const keys = Object.keys(mods);
    for (let i = 0; i < keys.length; i += 1) {
      consider((mods[keys[i]!] as { upgradeJob?: unknown } | undefined)?.upgradeJob);
    }
  }
  return earliest;
}

export function inspectPlanetDevJobSchedule(
  byPlanetId: Record<string, PlanetCoreRuntime | undefined>,
  planetIds: readonly string[],
  nowMs: number,
  extraCompleteAtMs: number | null = null,
): { duePlanetIds: string[]; nextAtMs: number | null } {
  const duePlanetIds: string[] = [];
  let nextAtMs: number | null = null;
  const consider = (at: number | null, onDue?: () => void) => {
    if (at == null) return;
    if (at <= nowMs) {
      onDue?.();
      return;
    }
    if (nextAtMs == null || at < nextAtMs) nextAtMs = at;
  };
  for (let i = 0; i < planetIds.length; i += 1) {
    const id = planetIds[i]!;
    consider(resolvePlanetDevJobEarliestAtMs(byPlanetId[id]), () => {
      duePlanetIds.push(id);
    });
  }
  consider(extraCompleteAtMs);
  return { duePlanetIds, nextAtMs };
}

function earliestMineralUpgradeAtMs(): number | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  const jobs = usePlayerStore.getState().player?.mineralUpgradeJobs;
  if (!jobs) return null;
  const keys = Object.keys(jobs);
  let earliest: number | null = null;
  for (let i = 0; i < keys.length; i += 1) {
    const at = readDevJobCompleteAtMs(jobs[keys[i]!]);
    if (at == null) continue;
    if (earliest == null || at < earliest) earliest = at;
  }
  return earliest;
}

function completeDuePlanet(planetId: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tryCompleteAllPlanetDevJobs } =
    require('./planetDevelopmentListRowModel') as typeof import('./planetDevelopmentListRowModel');
  tryCompleteAllPlanetDevJobs(planetId);
}

export function clearPlanetDevJobWatch(): void {
  if (!watchTimer) return;
  clearTimeout(watchTimer);
  watchTimer = null;
}

export function notePlanetDevJobMaybe(planetId: string): void {
  const id = String(planetId ?? '').trim();
  if (!id) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlanetCoreRuntimeStore } =
    require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
  const runtime = usePlanetCoreRuntimeStore.getState().byPlanetId[id];
  if (resolvePlanetDevJobEarliestAtMs(runtime) != null) {
    if (watchedPlanetIds.size < MAX_WATCHED_PLANETS || watchedPlanetIds.has(id)) {
      watchedPlanetIds.add(id);
    }
  } else {
    watchedPlanetIds.delete(id);
  }
  schedulePlanetDevJobWatch();
}

export function rebuildPlanetDevJobWatch(): void {
  watchedPlanetIds.clear();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlanetCoreRuntimeStore } =
    require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
  const store = usePlanetCoreRuntimeStore.getState();
  if (!store.hydrated) {
    schedulePlanetDevJobWatch();
    return;
  }
  const bag = store.byPlanetId;
  const ids = Object.keys(bag);
  for (let i = 0; i < ids.length && watchedPlanetIds.size < MAX_WATCHED_PLANETS; i += 1) {
    const id = ids[i]!;
    if (resolvePlanetDevJobEarliestAtMs(bag[id]) != null) {
      watchedPlanetIds.add(id);
    }
  }
  schedulePlanetDevJobWatch();
}

export function schedulePlanetDevJobWatch(nowMs: number = Date.now()): void {
  clearPlanetDevJobWatch();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlanetCoreRuntimeStore } =
    require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
  if (!usePlanetCoreRuntimeStore.getState().hydrated) return;
  const planetIds = Array.from(watchedPlanetIds);
  const extra = earliestMineralUpgradeAtMs();
  const { duePlanetIds, nextAtMs } = inspectPlanetDevJobSchedule(
    usePlanetCoreRuntimeStore.getState().byPlanetId,
    planetIds,
    nowMs,
    extra,
  );
  if (duePlanetIds.length > 0 || (extra != null && extra <= nowMs)) {
    watchTimer = setTimeout(() => {
      watchTimer = null;
      tickPlanetDevJobsRealtime();
    }, 0);
    return;
  }
  if (nextAtMs == null) return;
  const delay = Math.max(0, Math.min(MAX_TIMER_DELAY_MS, nextAtMs - nowMs));
  watchTimer = setTimeout(() => {
    watchTimer = null;
    tickPlanetDevJobsRealtime();
  }, delay);
}

export function tickPlanetDevJobsRealtime(nowMs: number = Date.now()): number {
  if (ticking) return 0;
  ticking = true;
  let completed = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } =
      require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    if (!usePlanetCoreRuntimeStore.getState().hydrated) return 0;
    const planetIds = Array.from(watchedPlanetIds);
    const extra = earliestMineralUpgradeAtMs();
    const { duePlanetIds } = inspectPlanetDevJobSchedule(
      usePlanetCoreRuntimeStore.getState().byPlanetId,
      planetIds,
      nowMs,
      extra,
    );
    for (let i = 0; i < duePlanetIds.length; i += 1) {
      completeDuePlanet(duePlanetIds[i]!);
      completed += 1;
    }
    if (extra != null && extra <= nowMs) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
      if (usePlayerStore.getState().settleMineralUpgradeJobs(nowMs)) {
        completed += 1;
      }
    }
    for (let i = 0; i < planetIds.length; i += 1) {
      const id = planetIds[i]!;
      const still = resolvePlanetDevJobEarliestAtMs(
        usePlanetCoreRuntimeStore.getState().byPlanetId[id],
      );
      if (still == null) watchedPlanetIds.delete(id);
    }
    schedulePlanetDevJobWatch(Date.now());
    return completed;
  } finally {
    ticking = false;
  }
}
