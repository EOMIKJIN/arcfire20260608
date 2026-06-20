// ============================================================
// 초반 zone 마스터 밸런스 완화 — planet_master_balance_early_zone_policy.csv
// ============================================================

import { PlanetMasterBalanceEarlyZonePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetMasterBalanceEarlyZonePolicy = {
  earlyZoneMaxIndex: number;
  baselineBlendBase: number;
  baselineBlendPerZoneStep: number;
  tradeHubBlendBonus: number;
  maxDeltaEarlyZone: number;
  maxDeltaDefault: number;
  gaugeFloorPctEarly: number;
};

const FALLBACK: PlanetMasterBalanceEarlyZonePolicy = {
  earlyZoneMaxIndex: 5,
  baselineBlendBase: 0.9,
  baselineBlendPerZoneStep: -0.03,
  tradeHubBlendBonus: 0.08,
  maxDeltaEarlyZone: 1,
  maxDeltaDefault: 4,
  gaugeFloorPctEarly: 38,
};

function parseNum(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let cached: PlanetMasterBalanceEarlyZonePolicy | null = null;

export function resolvePlanetMasterBalanceEarlyZonePolicy(): PlanetMasterBalanceEarlyZonePolicy {
  if (cached) return cached;
  const row =
    PlanetMasterBalanceEarlyZonePolicy_FROM_BALANCE_CSV.find(
      (r) => String(r.policyKey ?? '').trim() === 'default',
    )
    ?? PlanetMasterBalanceEarlyZonePolicy_FROM_BALANCE_CSV[0];
  if (!row) {
    cached = FALLBACK;
    return cached;
  }
  cached = {
    earlyZoneMaxIndex: Math.max(1, Math.floor(parseNum(String(row.earlyZoneMaxIndex ?? ''), 5))),
    baselineBlendBase: Math.max(0, Math.min(1, parseNum(String(row.baselineBlendBase ?? ''), 0.9))),
    baselineBlendPerZoneStep: parseNum(String(row.baselineBlendPerZoneStep ?? ''), -0.03),
    tradeHubBlendBonus: Math.max(0, Math.min(0.25, parseNum(String(row.tradeHubBlendBonus ?? ''), 0.08))),
    maxDeltaEarlyZone: Math.max(0, Math.min(10, parseNum(String(row.maxDeltaEarlyZone ?? ''), 1))),
    maxDeltaDefault: Math.max(1, Math.min(10, parseNum(String(row.maxDeltaDefault ?? ''), 4))),
    gaugeFloorPctEarly: Math.max(0, Math.min(100, parseNum(String(row.gaugeFloorPctEarly ?? ''), 38))),
  };
  return cached;
}

/** zone 1..earlyZoneMaxIndex — CSV baseline 가중치 (0=zone목표만, 1=CSV만) */
export function resolveEarlyZoneBaselineBlendWeight(
  zoneIndex: number,
  isTradeHub: boolean,
): number | null {
  const policy = resolvePlanetMasterBalanceEarlyZonePolicy();
  if (zoneIndex < 1 || zoneIndex > policy.earlyZoneMaxIndex) return null;
  let blend =
    policy.baselineBlendBase + policy.baselineBlendPerZoneStep * (zoneIndex - 1);
  if (isTradeHub) blend += policy.tradeHubBlendBonus;
  return Math.max(0, Math.min(0.98, blend));
}

export function resolveMasterBalanceMaxDeltaForZone(zoneIndex: number): number {
  const policy = resolvePlanetMasterBalanceEarlyZonePolicy();
  if (zoneIndex >= 1 && zoneIndex <= policy.earlyZoneMaxIndex) {
    return policy.maxDeltaEarlyZone;
  }
  return policy.maxDeltaDefault;
}

export function resolveEarlyZoneGaugeFloorPct(zoneIndex: number): number | null {
  const policy = resolvePlanetMasterBalanceEarlyZonePolicy();
  if (zoneIndex < 1 || zoneIndex > policy.earlyZoneMaxIndex) return null;
  return policy.gaugeFloorPctEarly;
}
