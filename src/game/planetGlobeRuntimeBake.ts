/**
 * 일일개방으로 번들에 없는 행성 원반 — 세션 1장 큐.
 * persist 없음(AsyncStorage PNG 금지). 래스터는 lazy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ZoneType } from '../types';
import { hasBundledPlanetGlobeBake } from './planetGlobeBundledIds';
import { usePlanetGlobeRuntimeSourceStore } from '../store/planetGlobeRuntimeSourceStore';

const LEGACY_INDEX_KEY = 'arcfire_planet_globe_rt_index_v1';
const LEGACY_ITEM_PREFIX = 'arcfire_planet_globe_rt_v1:';
const QUEUE_MAX = 2;

const queue: string[] = [];
const queued = new Set<string>();
const inFlight = new Set<string>();
const zoneByPlanetId = new Map<string, ZoneType>();
let running = false;
let legacyDropped = false;

export { hasBundledPlanetGlobeBake } from './planetGlobeBundledIds';

function yieldBakeSlice(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** 이전 빌드가 쌓은 data URI persist 1회 제거(Android 6MB 한도·PSS). */
async function dropLegacyPersistOnce(): Promise<void> {
  if (legacyDropped) return;
  legacyDropped = true;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const drop = keys.filter((k) => k === LEGACY_INDEX_KEY || k.startsWith(LEGACY_ITEM_PREFIX));
    if (drop.length > 0) await AsyncStorage.multiRemove(drop);
  } catch {
    /* ignore */
  }
}

async function bakeOne(planetId: string): Promise<void> {
  if (hasBundledPlanetGlobeBake(planetId)) return;
  const hot = usePlanetGlobeRuntimeSourceStore.getState();
  if (hot.activePlanetId === planetId && hot.dataUri) return;
  const zone = zoneByPlanetId.get(planetId) ?? 'neutral';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rasterizeColonizedPlanetGlobeDataUri } =
    require('./planetGlobeRuntimeRasterize') as typeof import('./planetGlobeRuntimeRasterize');
  const dataUri = await rasterizeColonizedPlanetGlobeDataUri(planetId, zone);
  usePlanetGlobeRuntimeSourceStore.getState().setRuntimeUri(planetId, dataUri);
}

async function processQueue(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await dropLegacyPersistOnce();
    while (queue.length > 0) {
      const planetId = queue.shift();
      if (!planetId) continue;
      queued.delete(planetId);
      inFlight.add(planetId);
      try {
        await bakeOne(planetId);
      } catch {
        /* 다음 enqueue로 재시도 */
      } finally {
        inFlight.delete(planetId);
      }
      await yieldBakeSlice();
    }
  } finally {
    running = false;
    if (queue.length > 0) void processQueue();
  }
}

/** 번들 PNG 없는 개척 행성만. 큐는 최신 2개. */
export function enqueueColonizedPlanetGlobeBake(
  planetId: string | null | undefined,
  zone?: ZoneType,
): void {
  if (!planetId) return;
  if (hasBundledPlanetGlobeBake(planetId)) return;
  if (zone) zoneByPlanetId.set(planetId, zone);
  if (queued.has(planetId) || inFlight.has(planetId)) return;
  const hot = usePlanetGlobeRuntimeSourceStore.getState();
  if (hot.activePlanetId === planetId && hot.dataUri) return;
  while (queue.length >= QUEUE_MAX) {
    const dropped = queue.shift();
    if (dropped) queued.delete(dropped);
  }
  queued.add(planetId);
  queue.push(planetId);
  void processQueue();
}
