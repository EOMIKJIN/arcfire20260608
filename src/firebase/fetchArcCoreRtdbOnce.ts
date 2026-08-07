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
import { ensureFirebaseAnonymousAuth } from './firebaseAnonymousAuth';
import {
  clearArcCoreRtdbUnavailableForSession,
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
    | 'timeout'
    | 'wrong_host'
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
  if (msg.includes('rtdb_read_timeout')) return 'timeout';
  if (/404|not.?found|does not exist|wrong.?host|firebaseio\.com/i.test(msg)) return 'wrong_host';
  if (/database.*not.*configured|firebase.*database.*url/i.test(msg)) return 'not_configured';
  if (/permission|denied|unavailable|network|offline/i.test(msg)) return 'offline';
  return 'offline';
}

function formatRtdbBootErrorDetail(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/\s+/g, ' ').slice(0, 180);
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
 * 계정 purge 직후 — 같은 JS 세션에서 RTDB boot를 다시 허용.
 * (이전 boot가 wrong_host/timeout으로 끝나 session_throttle·unavailable에 잠기던 P1)
 */
export function resetArcCoreRtdbBootSyncSessionForAccountPurge(): void {
  sessionBootSyncDone = false;
  clearArcCoreRtdbUnavailableForSession();
  if (__DEV__) {
    console.log('[ArcCore/RTDB] boot session reset (account purge)');
  }
}

/**
 * purge → 타이틀 복귀 후 백그라운드 1회 RTDB boot 재시도.
 * Auth 재확보 후 실행 · 타이틀 UI/bootReady 비차단 · 실패해도 로컬 플레이 유지.
 */
export function scheduleArcCoreRtdbBootSyncAfterAccountPurge(uid: string): void {
  const trimmed = uid.trim();
  if (!trimmed) return;
  resetArcCoreRtdbBootSyncSessionForAccountPurge();
  void (async () => {
    try {
      await ensureFirebaseAnonymousAuth();
      const result = await fetchArcCoreRtdbBootSyncOnce({ uid: trimmed });
      if (__DEV__) {
        console.log(
          `[ArcCore/RTDB] post-purge boot ran=${result.ran} pack=${result.pendingPolicyPackId ?? 'none'} ` +
            `skip=${result.skippedReason ?? 'ok'}`,
        );
      }
    } catch (e) {
      if (__DEV__) {
        console.log('[ArcCore/RTDB] post-purge boot skipped:', e);
      }
    }
  })();
}

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
    // Auth는 public read에 불필요하나, 이후 KPI·Firestore와 동일 세션 토큰을 맞춘다(실패해도 계속).
    await ensureFirebaseAnonymousAuth();
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
    // wrong_host/timeout은 URL 교정·재시도로 회복 가능 — 세션 영구 disable 금지.
    // not_configured(네이티브 DB 미설정)만 세션 잠금.
    if (skippedReason === 'not_configured') {
      markArcCoreRtdbUnavailableForSession(skippedReason);
    } else {
      // 같은 세션 재시도 가능하도록 throttle 플래그만 유지(sessionBootSyncDone=true).
      // purge 시 resetArcCoreRtdbBootSyncSessionForAccountPurge 로 해제.
    }
    if (__DEV__) {
      console.log(
        `[ArcCore/RTDB] boot sync skip (${skippedReason}) detail=${formatRtdbBootErrorDetail(e)}`,
      );
    }
    return { ...empty, ran: true, skippedReason };
  }
}
