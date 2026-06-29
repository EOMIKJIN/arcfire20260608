// ============================================================
// 테러 스파이 프로필 — Table-First (arc_core_spy_terror_profile.csv)
// ============================================================

import { ArcCoreSpyTerrorProfile_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { ArcCoreSpyRoleId } from './arcCoreSpyRolePolicy';

export type ArcCoreSpyTerrorProfileRow = {
  profileId: string;
  roleId: ArcCoreSpyRoleId;
  enabled: boolean;
  weightPct: number;
  intelNotifyWeight: number;
  backdoorPulseMul: number;
  droneGuidanceAccuracyPct: number;
  droneStrikeDamageMul: number;
  droneLeakBoostPct: number;
  labelKo: string;
};

let rows: ArcCoreSpyTerrorProfileRow[] | null = null;
let byRoleId: Map<ArcCoreSpyRoleId, ArcCoreSpyTerrorProfileRow[]> | null = null;

function parseRows(): ArcCoreSpyTerrorProfileRow[] {
  return ArcCoreSpyTerrorProfile_FROM_BALANCE_CSV.map((row) => ({
    profileId: String(row.profile_id ?? '').trim(),
    roleId: String(row.role_id ?? '').trim() as ArcCoreSpyRoleId,
    enabled: row.enabled === '1' || String(row.enabled).toLowerCase() === 'true',
    weightPct: Math.max(0, Number(row.weight_pct) || 0),
    intelNotifyWeight: Math.max(0, Number(row.intel_notify_weight) || 1),
    backdoorPulseMul: Math.max(0, Number(row.backdoor_pulse_mul) || 1),
    droneGuidanceAccuracyPct: Math.max(0, Number(row.drone_guidance_accuracy_pct) || 0),
    droneStrikeDamageMul: Math.max(0.01, Number(row.drone_strike_damage_mul) || 1),
    droneLeakBoostPct: Math.max(0, Number(row.drone_leak_boost_pct) || 0),
    labelKo: String(row.label_ko ?? '').trim(),
  })).filter((r) => r.enabled && r.profileId);
}

function ensureIndex(): void {
  if (rows && byRoleId) return;
  rows = parseRows();
  byRoleId = new Map();
  for (const row of rows) {
    const list = byRoleId.get(row.roleId) ?? [];
    list.push(row);
    byRoleId.set(row.roleId, list);
  }
}

export function listArcCoreSpyTerrorProfilesForRole(
  roleId: ArcCoreSpyRoleId,
): readonly ArcCoreSpyTerrorProfileRow[] {
  ensureIndex();
  return byRoleId!.get(roleId) ?? [];
}

export function getArcCoreSpyTerrorProfileById(profileId: string): ArcCoreSpyTerrorProfileRow | null {
  ensureIndex();
  const id = String(profileId ?? '').trim();
  if (!id) return null;
  for (let i = 0; i < rows!.length; i += 1) {
    if (rows![i]!.profileId === id) return rows![i]!;
  }
  return null;
}

export function invalidateArcCoreSpyTerrorProfileCache(): void {
  rows = null;
  byRoleId = null;
}
