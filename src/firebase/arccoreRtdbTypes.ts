// ============================================================
// ArcCore Firebase RTDB — 스키마 v1 (read-once · daily write · no listeners)
// @see docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md §8
// ============================================================

import type { BalanceOverlayDelta } from '../arcCore/economy/balanceOverlayDeltaTypes';

export const ARCORE_RTDB_SCHEMA_VERSION = 1 as const;

/** arccore/config */
export type ArcCoreRtdbConfig = {
  schemaVersion: typeof ARCORE_RTDB_SCHEMA_VERSION;
  activePolicyPackId: string | null;
  /** false면 boot RTDB policy read skip */
  learningSyncEnabled: boolean;
  safeMode: boolean;
  updatedAt: number;
};

/** arccore/policy_packs/{packId} — CI/admin publish, 앱 read-only */
export type ArcCoreRtdbPolicyPack = {
  schemaVersion: typeof ARCORE_RTDB_SCHEMA_VERSION;
  packId: string;
  status: 'draft' | 'approved' | 'retired';
  balanceOverlay?: BalanceOverlayDelta;
  issuedAt: string;
  issuedBy: 'sim' | 'audit' | 'human' | 'ci';
  approvedAt?: number;
};

/** arccore/learning/global — CI rollup mirror */
export type ArcCoreRtdbLearningGlobal = {
  schemaVersion: typeof ARCORE_RTDB_SCHEMA_VERSION;
  dayKey: string;
  activePolicyPackId: string | null;
  kpiTimelineTail: {
    dayKey: string;
    economy?: {
      f2pWhaleRatio?: number;
      simKpiStatus?: string;
      deltaId?: string | null;
    };
  }[];
  updatedAt: number;
};

/** arccore/worldExpansion/master/state — 전역 성계 개방 epoch (read-only · CI publish) */
export type ArcCoreRtdbWorldExpansionMasterState = {
  schemaVersion: typeof ARCORE_RTDB_SCHEMA_VERSION;
  /** KST 등 정책 타임존 기준 YYYY-MM-DD — 1일차 개방 시작일 */
  epochDayKey: string;
  timeZone: string;
  /** 정식 출시·시즌 리셋 시 증가 — 클라이언트 reconcile 트리거 */
  resetGeneration: number;
  systemsPerDay: number;
  globalScheduleEnabled?: boolean;
  updatedAt: number;
  notes?: string;
};

/** arccore/learning/devices/{firebaseAuthUid}/dailyKpi — 기기 일 1회 push (bounded) */
export type ArcCoreRtdbDeviceDailyKpi = {
  schemaVersion: typeof ARCORE_RTDB_SCHEMA_VERSION;
  dayKey: string;
  economy: {
    planetsReconciled?: number;
    windowTradeGross?: number;
    windowConvoyTrips?: number;
    deltaId?: string | null;
    simKpiStatus?: string;
  };
  /** Firebase Auth uid와 별도 — CI 집계용 로컬 device id (PII 아님) */
  localDeviceId?: string;
  updatedAt: number;
};
