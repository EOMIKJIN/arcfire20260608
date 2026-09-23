// ============================================================
// 세축 궤도 통신 기억 — 계정 귀속. 틱/렌더 persist 금지. 1.5s 코얼레스.
// 정본: docs/세축_반응_잔상_세계변화_설계.md v1.1
// ============================================================

import { create } from 'zustand';
import {
  emptyOrbitPresenceMemoryPayload,
  getCaptainPresenceMemoryFromPayload,
  getLastOrbitCommCaptainFromPayload,
  getPlanetVisitSnapshotFromPayload,
  mergeOrbitPresenceMemoryPayload,
  normalizeOrbitPresenceMemoryPayload,
  patchCaptainPersonalMemoryOnPayload,
  recordOrbitCommOnPayload,
  recordPlanetVisitSnapshotOnPayload,
  type CaptainPresenceMemory,
  type OrbitCommOutcome,
  type OrbitPresenceMemoryPayload,
  type PlanetVisitSnapshot,
  type WorldChangeItem,
} from '../game/planetHub/orbitPresenceMemory';

export const ORBIT_PRESENCE_MEMORY_STORAGE_KEY = 'arcfire_orbit_presence_memory_v1';
const PERSIST_COALESCE_MS = 1500;

export type RecordOrbitCommInput = {
  captainId: string;
  planetId: string;
  outcome: OrbitCommOutcome;
  sceneId: string;
  writeId: string;
  atMs?: number;
};

type OrbitPresenceMemoryState = {
  hydrated: boolean;
  payload: OrbitPresenceMemoryPayload;
};

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      };
      getItem?: (key: string) => Promise<string | null>;
      setItem?: (key: string, value: string) => Promise<void>;
      removeItem?: (key: string) => Promise<void>;
    };
    const impl = mod.default ?? mod;
    if (typeof impl.getItem !== 'function' || typeof impl.setItem !== 'function') return null;
    return impl as {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  } catch {
    return null;
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let writeGen = 0;
let hydratePromise: Promise<void> | null = null;

export type LastHubWorldChangeDigest = {
  planetId: string;
  items: WorldChangeItem[];
  factLine: string;
};

let lastHubWorldChangeDigest: LastHubWorldChangeDigest | null = null;

export const useOrbitPresenceMemoryStore = create<OrbitPresenceMemoryState>(() => ({
  hydrated: false,
  payload: emptyOrbitPresenceMemoryPayload(),
}));

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistOrbitPresenceMemory();
  }, PERSIST_COALESCE_MS);
}

export async function persistOrbitPresenceMemory(): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    const payload = useOrbitPresenceMemoryStore.getState().payload;
    await storage.setItem(ORBIT_PRESENCE_MEMORY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* node test / native 미기동 */
  }
}

export async function hydrateOrbitPresenceMemory(): Promise<void> {
  const gen = writeGen;
  const storage = getAsyncStorage();
  try {
    const raw = storage ? await storage.getItem(ORBIT_PRESENCE_MEMORY_STORAGE_KEY) : null;
    const disk = raw
      ? normalizeOrbitPresenceMemoryPayload(JSON.parse(raw))
      : emptyOrbitPresenceMemoryPayload();
    const memory = useOrbitPresenceMemoryStore.getState().payload;
    if (writeGen !== gen || writeGen > 0) {
      useOrbitPresenceMemoryStore.setState({
        hydrated: true,
        payload: mergeOrbitPresenceMemoryPayload(disk, memory),
      });
      return;
    }
    useOrbitPresenceMemoryStore.setState({
      hydrated: true,
      payload: disk,
    });
  } catch {
    const memory = useOrbitPresenceMemoryStore.getState().payload;
    if (writeGen !== gen || writeGen > 0) {
      useOrbitPresenceMemoryStore.setState({ hydrated: true, payload: memory });
      return;
    }
    useOrbitPresenceMemoryStore.setState({
      hydrated: true,
      payload: emptyOrbitPresenceMemoryPayload(),
    });
  }
}

export function ensureOrbitPresenceMemoryHydrated(): Promise<void> {
  const state = useOrbitPresenceMemoryStore.getState();
  if (state.hydrated) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = hydrateOrbitPresenceMemory().finally(() => {
      hydratePromise = null;
    });
  }
  return hydratePromise;
}

export function getCaptainPresenceMemory(captainId: string): CaptainPresenceMemory | undefined {
  return getCaptainPresenceMemoryFromPayload(
    useOrbitPresenceMemoryStore.getState().payload,
    captainId,
  );
}

export function getPlanetVisitSnapshot(planetId: string): PlanetVisitSnapshot | undefined {
  return getPlanetVisitSnapshotFromPayload(
    useOrbitPresenceMemoryStore.getState().payload,
    planetId,
  );
}

export function recordPlanetVisitSnapshot(snap: PlanetVisitSnapshot): void {
  writeGen += 1;
  void ensureOrbitPresenceMemoryHydrated();
  const payload = useOrbitPresenceMemoryStore.getState().payload;
  recordPlanetVisitSnapshotOnPayload(payload, snap);
  useOrbitPresenceMemoryStore.setState({ payload });
  schedulePersist();
}

export function setLastHubWorldChangeDigest(digest: LastHubWorldChangeDigest | null): void {
  lastHubWorldChangeDigest = digest;
}

export function getLastHubWorldChangeDigest(): LastHubWorldChangeDigest | null {
  return lastHubWorldChangeDigest;
}

export function getLastOrbitCommCaptainName(): string {
  const row = getLastOrbitCommCaptainFromPayload(useOrbitPresenceMemoryStore.getState().payload);
  if (!row) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNpcCaptain } = require('../npc/npcFleetRegistry') as typeof import('../npc/npcFleetRegistry');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveNpcCaptainDisplayNameNow } = require('../i18n/captainText') as typeof import('../i18n/captainText');
    return resolveNpcCaptainDisplayNameNow(getNpcCaptain(row.captainId)) || row.captainId;
  } catch {
    return row.captainId;
  }
}

export function patchCaptainPersonalMemory(
  captainId: string,
  patch: {
    lastPersonalOfferDayKey?: string;
    declineUntilDayKey?: string;
    personalThanksPending?: boolean;
  },
): boolean {
  writeGen += 1;
  void ensureOrbitPresenceMemoryHydrated();
  const payload = useOrbitPresenceMemoryStore.getState().payload;
  const patched = patchCaptainPersonalMemoryOnPayload(payload, captainId, patch, Date.now());
  if (!patched) return false;
  useOrbitPresenceMemoryStore.setState({ payload });
  schedulePersist();
  return true;
}

export function recordOrbitComm(input: RecordOrbitCommInput): boolean {
  writeGen += 1;
  void ensureOrbitPresenceMemoryHydrated();
  const payload = useOrbitPresenceMemoryStore.getState().payload;
  const recorded = recordOrbitCommOnPayload(payload, {
    captainId: input.captainId,
    planetId: input.planetId,
    outcome: input.outcome,
    sceneId: input.sceneId,
    writeId: input.writeId,
    atMs: input.atMs ?? Date.now(),
  });
  if (!recorded) return false;
  useOrbitPresenceMemoryStore.setState({ payload });
  schedulePersist();
  return true;
}

export async function resetOrbitPresenceMemory(): Promise<void> {
  writeGen += 1;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  hydratePromise = null;
  lastHubWorldChangeDigest = null;
  useOrbitPresenceMemoryStore.setState({
    hydrated: true,
    payload: emptyOrbitPresenceMemoryPayload(Date.now()),
  });
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    await storage.removeItem(ORBIT_PRESENCE_MEMORY_STORAGE_KEY);
  } catch {
    /* node test / native 미기동 */
  }
}
