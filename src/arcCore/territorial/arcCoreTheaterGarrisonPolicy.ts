// ============================================================
// 전선 주둔 군비 — Table-First
// 플레이어 웨이브·기존 유지비 800 미변경
// ============================================================

import { ArcCoreTheaterGarrisonPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreTheaterGarrisonPolicy = {
  policyId: string;
  enabled: boolean;
  theaterDailyUpkeepCredits: number;
  rebuildLocalFeeSharePct: number;
  rebuildNationSharePct: number;
  rebuildDailyCapPctOfTarget: number;
  occupyRetainPct: number;
  defendWinRetainPct: number;
  spoilsOnOccupyCredits: number;
  combatMulMin: number;
  combatMulMax: number;
  applyOnPlayerWave: boolean;
};

const DEFAULT_POLICY: ArcCoreTheaterGarrisonPolicy = {
  policyId: 'default_v1',
  enabled: true,
  theaterDailyUpkeepCredits: 200,
  rebuildLocalFeeSharePct: 60,
  rebuildNationSharePct: 40,
  rebuildDailyCapPctOfTarget: 25,
  occupyRetainPct: 20,
  defendWinRetainPct: 100,
  spoilsOnOccupyCredits: 400,
  combatMulMin: 0.85,
  combatMulMax: 1.05,
  applyOnPlayerWave: false,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return fallback;
}

let cached: ArcCoreTheaterGarrisonPolicy | null = null;

function buildPolicy(): ArcCoreTheaterGarrisonPolicy {
  const row =
    ArcCoreTheaterGarrisonPolicy_FROM_BALANCE_CSV.find((r) => r.policyId === 'default_v1')
    ?? ArcCoreTheaterGarrisonPolicy_FROM_BALANCE_CSV[0];
  if (!row) return DEFAULT_POLICY;
  const localShare = Math.min(100, Math.max(0, parseNum(row.rebuildLocalFeeSharePct, DEFAULT_POLICY.rebuildLocalFeeSharePct)));
  return {
    policyId: row.policyId || DEFAULT_POLICY.policyId,
    enabled: parseBool(row.enabled, DEFAULT_POLICY.enabled),
    theaterDailyUpkeepCredits: Math.max(0, Math.round(parseNum(row.theaterDailyUpkeepCredits, DEFAULT_POLICY.theaterDailyUpkeepCredits))),
    rebuildLocalFeeSharePct: localShare,
    rebuildNationSharePct: Math.min(100, Math.max(0, 100 - localShare)),
    rebuildDailyCapPctOfTarget: Math.min(100, Math.max(1, parseNum(row.rebuildDailyCapPctOfTarget, DEFAULT_POLICY.rebuildDailyCapPctOfTarget))),
    occupyRetainPct: Math.min(100, Math.max(0, parseNum(row.occupyRetainPct, DEFAULT_POLICY.occupyRetainPct))),
    defendWinRetainPct: Math.min(100, Math.max(0, parseNum(row.defendWinRetainPct, DEFAULT_POLICY.defendWinRetainPct))),
    spoilsOnOccupyCredits: Math.max(0, Math.round(parseNum(row.spoilsOnOccupyCredits, DEFAULT_POLICY.spoilsOnOccupyCredits))),
    combatMulMin: Math.min(1.5, Math.max(0.5, parseNum(row.combatMulMin, DEFAULT_POLICY.combatMulMin))),
    combatMulMax: Math.min(1.5, Math.max(0.5, parseNum(row.combatMulMax, DEFAULT_POLICY.combatMulMax))),
    applyOnPlayerWave: parseBool(row.applyOnPlayerWave, DEFAULT_POLICY.applyOnPlayerWave),
  };
}

export function getArcCoreTheaterGarrisonPolicy(): ArcCoreTheaterGarrisonPolicy {
  if (!cached) cached = buildPolicy();
  return cached;
}

export function invalidateArcCoreTheaterGarrisonPolicyCache(): void {
  cached = null;
}
