// ============================================================
// 아크코어 스파이 역할 — Table-First (arc_core_spy_role_policy.csv)
// ============================================================

import { ArcCoreSpyRolePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreSpyRoleId = 'backdoor_tech_terror' | 'drone_guidance_specialist';

export type ArcCoreSpyRoleRow = {
  roleId: ArcCoreSpyRoleId;
  enabled: boolean;
  weightPctInPool: number;
  backdoorTechPulseMul: number;
  droneGuidanceAccuracyPct: number;
  droneStrikeDamageMul: number;
  droneLeakBoostPct: number;
};

let rows: ArcCoreSpyRoleRow[] | null = null;
let byId: Map<ArcCoreSpyRoleId, ArcCoreSpyRoleRow> | null = null;

function parseRows(): ArcCoreSpyRoleRow[] {
  return ArcCoreSpyRolePolicy_FROM_BALANCE_CSV.map((row) => ({
    roleId: row.role_id as ArcCoreSpyRoleId,
    enabled: row.enabled === '1' || String(row.enabled).toLowerCase() === 'true',
    weightPctInPool: Math.max(0, Number(row.weight_pct_in_pool) || 0),
    backdoorTechPulseMul: Math.max(0, Number(row.backdoor_tech_pulse_mul) || 1),
    droneGuidanceAccuracyPct: Math.max(0, Number(row.drone_guidance_accuracy_pct) || 0),
    droneStrikeDamageMul: Math.max(0.01, Number(row.drone_strike_damage_mul) || 1),
    droneLeakBoostPct: Math.max(0, Number(row.drone_leak_boost_pct) || 0),
  })).filter((r) => r.enabled);
}

function ensureIndex(): void {
  if (rows && byId) return;
  rows = parseRows();
  byId = new Map(rows.map((r) => [r.roleId, r]));
}

export function listArcCoreSpyRoleRows(): readonly ArcCoreSpyRoleRow[] {
  ensureIndex();
  return rows!;
}

export function getArcCoreSpyRoleRow(roleId: ArcCoreSpyRoleId): ArcCoreSpyRoleRow | null {
  ensureIndex();
  return byId!.get(roleId) ?? null;
}

export function invalidateArcCoreSpyRolePolicyCache(): void {
  rows = null;
  byId = null;
}
