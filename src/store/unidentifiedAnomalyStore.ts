/**
 * 미확인 이상현상 — 로컬 전용. Firestore·프로필 blob 미포함.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP } from '../missions/unidentifiedAnomaly/unidentifiedAnomalyTestPolicy';
import {
  buildUnidentifiedAnomalyMissionId,
  isUnidentifiedAnomalyMissionId,
  parseUnidentifiedAnomalyMissionId,
} from '../missions/unidentifiedAnomaly/unidentifiedAnomalyIds';
import {
  rollAnomalyPayloadKind,
  type UnidentifiedAnomalyPayloadKind,
} from '../missions/unidentifiedAnomaly/unidentifiedAnomalyPolicy';

export const UNIDENTIFIED_ANOMALY_STORAGE_KEY = 'arcfire_unidentified_anomaly_v1';

export type UnidentifiedAnomalyStatus = 'listed' | 'accepted' | 'revealed';
export type UnidentifiedAnomalySettleReason =
  | 'cleared'
  | 'expired'
  | 'abandoned'
  | 'failed'
  | 'unaccepted_ttl';

export type UnidentifiedAnomalyActive = {
  instanceId: string;
  systemId: string;
  planetId: string;
  startedAtMs: number;
  expiresAtMs: number;
  unacceptedExpiresAtMs: number;
  acceptedExpiresAtMs: number | null;
  status: UnidentifiedAnomalyStatus;
  payloadKind: UnidentifiedAnomalyPayloadKind;
  payloadRevealed: boolean;
};

export type UnidentifiedAnomalyResolved = {
  planetId: string;
  resolvedAtMs: number;
  reason: UnidentifiedAnomalySettleReason;
};

type PersistedV1 = {
  v: 1;
  active: UnidentifiedAnomalyActive | null;
  lastSystemId: string | null;
  nextSpawnAtMs: number;
  rotationHistory: string[];
  alertedInstanceId: string | null;
  recentResolved: UnidentifiedAnomalyResolved[];
};

type UnidentifiedAnomalyState = {
  active: UnidentifiedAnomalyActive | null;
  lastSystemId: string | null;
  nextSpawnAtMs: number;
  rotationHistory: string[];
  alertedInstanceId: string | null;
  recentResolved: UnidentifiedAnomalyResolved[];
  loaded: boolean;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  applySpawn: (input: {
    systemId: string;
    planetId: string;
    startedAtMs: number;
    expiresAtMs: number;
    nextSpawnAtMs: number;
    payloadKind?: UnidentifiedAnomalyPayloadKind;
  }) => string | null;
  deferNextSpawn: (nextSpawnAtMs: number) => void;
  settleActive: () => void;
  markAlerted: (instanceId: string) => void;
  markAccepted: (instanceId: string, acceptedExpiresAtMs: number) => void;
  markRevealed: (instanceId: string) => void;
  recordResolved: (row: UnidentifiedAnomalyResolved) => void;
  resetLocal: () => Promise<void>;
};

function emptyState(): Omit<PersistedV1, 'v'> {
  return {
    active: null,
    lastSystemId: null,
    nextSpawnAtMs: 0,
    rotationHistory: [],
    alertedInstanceId: null,
    recentResolved: [],
  };
}

function parsePayloadKind(raw: unknown): UnidentifiedAnomalyPayloadKind {
  return raw === 'threat' ? 'threat' : 'relic';
}

function parseStatus(raw: unknown): UnidentifiedAnomalyStatus {
  if (raw === 'accepted' || raw === 'revealed') return raw;
  return 'listed';
}

function parseResolved(raw: unknown): UnidentifiedAnomalyResolved[] {
  if (!Array.isArray(raw)) return [];
  const out: UnidentifiedAnomalyResolved[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const row = raw[i];
    if (!row || typeof row !== 'object') continue;
    const o = row as Partial<UnidentifiedAnomalyResolved>;
    const planetId = String(o.planetId ?? '').trim();
    const resolvedAtMs = Number(o.resolvedAtMs);
    const reason = o.reason;
    if (!planetId || !Number.isFinite(resolvedAtMs)) continue;
    if (
      reason !== 'cleared'
      && reason !== 'expired'
      && reason !== 'abandoned'
      && reason !== 'failed'
      && reason !== 'unaccepted_ttl'
    ) {
      continue;
    }
    out.push({ planetId, resolvedAtMs, reason });
  }
  return out.slice(-UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP);
}

function parseActive(raw: unknown): UnidentifiedAnomalyActive | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<UnidentifiedAnomalyActive>;
  const systemId = String(o.systemId ?? '').trim();
  const startedAtMs = Number(o.startedAtMs);
  const expiresAtMs = Number(o.expiresAtMs);
  const instanceId = String(o.instanceId ?? '').trim();
  if (!systemId || !instanceId) return null;
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(expiresAtMs)) return null;
  const parsed = parseUnidentifiedAnomalyMissionId(instanceId);
  const planetId = String(o.planetId ?? parsed?.planetId ?? '').trim();
  if (!planetId) return null;
  const unacceptedExpiresAtMs = Number.isFinite(Number(o.unacceptedExpiresAtMs))
    ? Number(o.unacceptedExpiresAtMs)
    : expiresAtMs;
  const acceptedRaw = Number(o.acceptedExpiresAtMs);
  return {
    instanceId,
    systemId,
    planetId,
    startedAtMs,
    expiresAtMs,
    unacceptedExpiresAtMs,
    acceptedExpiresAtMs: Number.isFinite(acceptedRaw) ? acceptedRaw : null,
    status: parseStatus(o.status),
    payloadKind: parsePayloadKind(o.payloadKind),
    payloadRevealed: o.payloadRevealed === true,
  };
}

function parsePersisted(raw: string): Omit<PersistedV1, 'v'> {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object') return emptyState();
  const o = parsed as Partial<PersistedV1>;
  const history = Array.isArray(o.rotationHistory)
    ? o.rotationHistory.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];
  return {
    active: parseActive(o.active),
    lastSystemId: typeof o.lastSystemId === 'string' && o.lastSystemId.trim() ? o.lastSystemId : null,
    nextSpawnAtMs: Number.isFinite(Number(o.nextSpawnAtMs)) ? Number(o.nextSpawnAtMs) : 0,
    rotationHistory: history.slice(-UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP),
    alertedInstanceId:
      typeof o.alertedInstanceId === 'string' && o.alertedInstanceId.trim()
        ? o.alertedInstanceId
        : null,
    recentResolved: parseResolved(o.recentResolved),
  };
}

function rematerializeActive(active: UnidentifiedAnomalyActive | null): void {
  if (!active || !isUnidentifiedAnomalyMissionId(active.instanceId)) return;
  try {
    const { materializeUnidentifiedAnomalyMission } =
      require('../missions/unidentifiedAnomaly/unidentifiedAnomalyResolver') as typeof import('../missions/unidentifiedAnomaly/unidentifiedAnomalyResolver');
    materializeUnidentifiedAnomalyMission({
      instanceId: active.instanceId,
      planetId: active.planetId,
      payloadKind: active.payloadKind,
    });
  } catch {
    /* hydrate 전 generated 미준비 */
  }
}

export const useUnidentifiedAnomalyStore = create<UnidentifiedAnomalyState>((set, get) => ({
  ...emptyState(),
  loaded: false,

  loadLocal: async () => {
    try {
      const raw = await AsyncStorage.getItem(UNIDENTIFIED_ANOMALY_STORAGE_KEY);
      if (!raw) {
        set({ ...emptyState(), loaded: true });
        return;
      }
      const next = parsePersisted(raw);
      rematerializeActive(next.active);
      set({ ...next, loaded: true });
    } catch {
      set({ ...emptyState(), loaded: true });
    }
  },

  persistLocal: async () => {
    const s = get();
    const payload: PersistedV1 = {
      v: 1,
      active: s.active,
      lastSystemId: s.lastSystemId,
      nextSpawnAtMs: s.nextSpawnAtMs,
      rotationHistory: s.rotationHistory,
      alertedInstanceId: s.alertedInstanceId,
      recentResolved: s.recentResolved,
    };
    await AsyncStorage.setItem(UNIDENTIFIED_ANOMALY_STORAGE_KEY, JSON.stringify(payload));
  },

  applySpawn: (input) => {
    const systemId = String(input.systemId ?? '').trim();
    const planetId = String(input.planetId ?? '').trim();
    if (!systemId || !planetId) return null;
    const instanceId = buildUnidentifiedAnomalyMissionId(planetId, input.startedAtMs);
    const payloadKind = input.payloadKind ?? rollAnomalyPayloadKind(instanceId);
    rematerializeActive({
      instanceId,
      systemId,
      planetId,
      startedAtMs: input.startedAtMs,
      expiresAtMs: input.expiresAtMs,
      unacceptedExpiresAtMs: input.expiresAtMs,
      acceptedExpiresAtMs: null,
      status: 'listed',
      payloadKind,
      payloadRevealed: false,
    });
    const prev = get().rotationHistory;
    const history = [...prev.filter((id) => id !== systemId), systemId].slice(
      -UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP,
    );
    set({
      active: {
        instanceId,
        systemId,
        planetId,
        startedAtMs: input.startedAtMs,
        expiresAtMs: input.expiresAtMs,
        unacceptedExpiresAtMs: input.expiresAtMs,
        acceptedExpiresAtMs: null,
        status: 'listed',
        payloadKind,
        payloadRevealed: false,
      },
      lastSystemId: systemId,
      nextSpawnAtMs: input.nextSpawnAtMs,
      rotationHistory: history,
      alertedInstanceId: null,
    });
    return instanceId;
  },

  deferNextSpawn: (nextSpawnAtMs) => {
    const at = Number(nextSpawnAtMs);
    if (!Number.isFinite(at)) return;
    set({ nextSpawnAtMs: at });
  },

  settleActive: () => {
    if (!get().active) return;
    set({ active: null });
  },

  markAlerted: (instanceId) => {
    const id = String(instanceId ?? '').trim();
    if (!id || get().alertedInstanceId === id) return;
    set({ alertedInstanceId: id });
  },

  markAccepted: (instanceId, acceptedExpiresAtMs) => {
    const active = get().active;
    if (!active || active.instanceId !== instanceId) return;
    if (active.status !== 'listed') return;
    const exp = Number(acceptedExpiresAtMs);
    if (!Number.isFinite(exp)) return;
    set({
      active: {
        ...active,
        status: 'accepted',
        acceptedExpiresAtMs: exp,
        expiresAtMs: exp,
      },
    });
  },

  markRevealed: (instanceId) => {
    const active = get().active;
    if (!active || active.instanceId !== instanceId) return;
    if (active.payloadRevealed) return;
    set({
      active: {
        ...active,
        status: 'revealed',
        payloadRevealed: true,
      },
    });
  },

  recordResolved: (row) => {
    const planetId = String(row.planetId ?? '').trim();
    if (!planetId) return;
    const prev = get().recentResolved.filter((item) => item.planetId !== planetId);
    set({
      recentResolved: [...prev, row].slice(-UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP),
    });
  },

  resetLocal: async () => {
    set({ ...emptyState(), loaded: true });
    await AsyncStorage.removeItem(UNIDENTIFIED_ANOMALY_STORAGE_KEY);
  },
}));
