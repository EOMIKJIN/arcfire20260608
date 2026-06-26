// ============================================================
// ArcCore RTDB — boot/session 1회 read (listener 금지)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BalanceOverlayDelta } from '../arcCore/economy/balanceOverlayDeltaTypes';
import {
  type ArcCoreRtdbConfig,
  type ArcCoreRtdbLearningGlobal,
  type ArcCoreRtdbPolicyPack,
  type ArcCoreRtdbWorldExpansionMasterState,
  ARCORE_RTDB_SCHEMA_VERSION,
} from './arccoreRtdbTypes';
import {
  isArcCoreRtdbAvailableForSession,
  markArcCoreRtdbUnavailableForSession,
  readRtdbValueOnce,
} from './rtdbRefs';
import { mergeRtdbLearningGlobalIntoStore } from '../arcCore/learning/mergeRtdbLearningGlobalIntoStore';
import { setArcCoreRtdbBootLearningSyncEnabled } from './arccoreRtdbSessionFlags';
import {
  ingestRtdbWorldExpansionMasterState,
} from '../arcCore/worldExpansionGlobalPolicy';
import { syncArcCoreGlobalWorldExpansionSync } from '../arcCore/syncArcCoreGlobalWorldExpansion';
import { useWorldStore } from '../store/worldStore';

const PENDING_POLICY_KEY = 'arcfire_arc_core_rtdb_pending_policy_v1';
const LAST_BOOT_SYNC_MS_KEY = 'arcfire_arc_core_rtdb_last_boot_sync_ms_v1';

export type ArcCoreRtdbBootSyncResult = {
  ran: boolean;
  configLoaded: boolean;
  policyPackLoaded: boolean;
  learningGlobalLoaded: boolean;
  worldExpansionMasterLoaded: boolean;
  pendingPolicyPackId: string | null;
  skippedReason?:
    | 'disabled'
    | 'offline'
    | 'session_throttle'
    | 'safe_mode'
    | 'no_data'
    | 'not_configured';
};

function normalizeConfig(raw: unknown): ArcCoreRtdbConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ArcCoreRtdbConfig>;
  if (o.schemaVersion !== ARCORE_RTDB_SCHEMA_VERSION) return null;
  return {
    schemaVersion: ARCORE_RTDB_SCHEMA_VERSION,
    activePolicyPackId:
      typeof o.activePolicyPackId === 'string' && o.activePolicyPackId.trim()
        ? o.activePolicyPackId.trim()
        : null,
    learningSyncEnabled: o.learningSyncEnabled !== false,
    safeMode: o.safeMode === true,
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : 0,
  };
}

function normalizePolicyPack(raw: unknown): ArcCoreRtdbPolicyPack | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ArcCoreRtdbPolicyPack>;
  if (o.schemaVersion !== ARCORE_RTDB_SCHEMA_VERSION) return null;
  if (typeof o.packId !== 'string' || !o.packId.trim()) return null;
  if (o.status !== 'approved') return null;
  const overlay = o.balanceOverlay;
  if (!overlay || typeof overlay !== 'object') return null;
  return {
    schemaVersion: ARCORE_RTDB_SCHEMA_VERSION,
    packId: o.packId.trim(),
    status: 'approved',
    balanceOverlay: overlay as BalanceOverlayDelta,
    issuedAt: typeof o.issuedAt === 'string' ? o.issuedAt : new Date().toISOString(),
    issuedBy:
      o.issuedBy === 'sim' || o.issuedBy === 'audit' || o.issuedBy === 'human' || o.issuedBy === 'ci'
        ? o.issuedBy
        : 'ci',
    approvedAt: typeof o.approvedAt === 'number' ? o.approvedAt : undefined,
  };
}

function classifyRtdbBootError(e: unknown): ArcCoreRtdbBootSyncResult['skippedReason'] {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('rtdb_read_timeout')) return 'offline';
  if (/database.*not.*configured|firebase.*database.*url/i.test(msg)) return 'not_configured';
  if (/permission|denied|unavailable|network/i.test(msg)) return 'offline';
  return 'offline';
}

export async function loadPendingRtdbPolicyPack(): Promise<ArcCoreRtdbPolicyPack | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_POLICY_KEY);
    if (!raw) return null;
    return normalizePolicyPack(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function clearPendingRtdbPolicyPack(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_POLICY_KEY);
  } catch {
    /* ignore */
  }
}

async function storePendingPolicyPack(pack: ArcCoreRtdbPolicyPack): Promise<void> {
  await AsyncStorage.setItem(PENDING_POLICY_KEY, JSON.stringify(pack));
}

let sessionBootSyncDone = false;

/**
 * 세션당 1회 — config · active policy pack · learning/global mirror read.
 * 실패 시 번들 SIM·로컬 overlay 정본으로 계속 플레이 (비차단).
 */
export async function fetchArcCoreRtdbBootSyncOnce(input: {
  uid: string;
}): Promise<ArcCoreRtdbBootSyncResult> {
  const empty: ArcCoreRtdbBootSyncResult = {
    ran: false,
    configLoaded: false,
    policyPackLoaded: false,
    learningGlobalLoaded: false,
    worldExpansionMasterLoaded: false,
    pendingPolicyPackId: null,
  };

  if (sessionBootSyncDone) {
    return { ...empty, skippedReason: 'session_throttle' };
  }
  sessionBootSyncDone = true;

  if (!isArcCoreRtdbAvailableForSession()) {
    return { ...empty, ran: true, skippedReason: 'not_configured' };
  }

  const uid = input.uid.trim();
  if (!uid) return empty;

  try {
    const configRaw = await readRtdbValueOnce<unknown>('config');
    if (configRaw == null) {
      if (__DEV__) {
        console.log('[ArcCore/RTDB] boot sync: arccore/config 없음 — publish 전이면 정상');
      }
      return { ...empty, ran: true, skippedReason: 'no_data' };
    }

    const config = normalizeConfig(configRaw);
    if (!config) {
      if (__DEV__) {
        console.log('[ArcCore/RTDB] boot sync: config schema 불일치');
      }
      return { ...empty, ran: true, skippedReason: 'no_data' };
    }

    let worldExpansionMasterLoaded = false;
    const expansionRaw = await readRtdbValueOnce<ArcCoreRtdbWorldExpansionMasterState>(
      'worldExpansion/master/state',
    );
    if (expansionRaw != null) {
      worldExpansionMasterLoaded = await ingestRtdbWorldExpansionMasterState(expansionRaw);
      if (worldExpansionMasterLoaded && useWorldStore.getState().loaded) {
        syncArcCoreGlobalWorldExpansionSync();
      }
    }

    if (!config.learningSyncEnabled) {
      setArcCoreRtdbBootLearningSyncEnabled(false);
      return {
        ...empty,
        ran: true,
        configLoaded: true,
        worldExpansionMasterLoaded,
        skippedReason: 'disabled',
      };
    }
    if (config.safeMode) {
      setArcCoreRtdbBootLearningSyncEnabled(false);
      return {
        ...empty,
        ran: true,
        configLoaded: true,
        worldExpansionMasterLoaded,
        skippedReason: 'safe_mode',
      };
    }

    setArcCoreRtdbBootLearningSyncEnabled(true);

    let policyPackLoaded = false;
    let pendingPolicyPackId: string | null = null;

    const packId = config.activePolicyPackId;
    if (packId) {
      const packRaw = await readRtdbValueOnce<unknown>(`policy_packs/${packId}`);
      const pack = normalizePolicyPack(packRaw);
      if (pack) {
        await storePendingPolicyPack(pack);
        policyPackLoaded = true;
        pendingPolicyPackId = pack.packId;
      }
    }

    const globalRaw = await readRtdbValueOnce<ArcCoreRtdbLearningGlobal>('learning/global');
    const learningGlobalLoaded =
      globalRaw != null &&
      globalRaw.schemaVersion === ARCORE_RTDB_SCHEMA_VERSION &&
      Array.isArray(globalRaw.kpiTimelineTail);

    if (learningGlobalLoaded && globalRaw) {
      await mergeRtdbLearningGlobalIntoStore(globalRaw);
    }

    await AsyncStorage.setItem(LAST_BOOT_SYNC_MS_KEY, String(Date.now()));

    if (__DEV__) {
      console.log(
        `[ArcCore/RTDB] boot sync ok pack=${pendingPolicyPackId ?? 'none'} global=${learningGlobalLoaded}`,
      );
    }

    return {
      ran: true,
      configLoaded: true,
      policyPackLoaded,
      learningGlobalLoaded,
      worldExpansionMasterLoaded,
      pendingPolicyPackId,
    };
  } catch (e) {
    const skippedReason = classifyRtdbBootError(e);
    if (skippedReason === 'not_configured') {
      markArcCoreRtdbUnavailableForSession('not_configured');
    }
    if (__DEV__) {
      console.log(`[ArcCore/RTDB] boot sync skip (${skippedReason})`);
    }
    return { ...empty, ran: true, skippedReason };
  }
}
