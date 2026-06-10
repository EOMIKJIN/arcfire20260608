// ============================================================
// weapon_list.csv + weapon_family_runtime_policy — 런타임 무기 스펙 단일 해석
// ============================================================

import { WeaponFamilyRuntimePolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { CapitalWeaponCsvRow } from '../data/generated';
import { getCapitalWeaponRow } from '../game/capitalWeaponRowLookup';

export type CapitalWeaponFamilyKind =
  | 'laser'
  | 'missile'
  | 'rocket'
  | 'drone'
  | 'carrier'
  | string;

export type WeaponTrajectoryMode =
  | 'instant_beam'
  | 'bezier_guided'
  | 'straight_fixed'
  | 'orbit_loiter'
  | 'arc_loiter_turn';

export type WeaponImpactMode =
  | 'target_track'
  | 'spread_circle'
  | 'nova_aoe'
  | 'point_fixed';

export type WeaponHitFxKind =
  | 'default'
  | 'laser_dodge'
  | 'nova_dodge'
  | 'rocket_spread'
  | 'drone_burst'
  | 'carrier_bomb';

export type WeaponImplementationStatus = 'active' | 'effectPending' | 'disabled';

export type CapitalWeaponRuntimeSpec = {
  weaponId: string;
  familyKind: CapitalWeaponFamilyKind;
  combatKind: 'laser' | 'missile';
  trajectoryMode: WeaponTrajectoryMode;
  impactMode: WeaponImpactMode;
  hitFxKind: WeaponHitFxKind;
  projectileRenderKind: string;
  implementationStatus: WeaponImplementationStatus;
  lockImpactPoint: boolean;
  row: CapitalWeaponCsvRow;
};

type FamilyPolicyRow = (typeof WeaponFamilyRuntimePolicy_FROM_BALANCE_CSV)[number];

const familyPolicyByKind = new Map<string, FamilyPolicyRow>(
  WeaponFamilyRuntimePolicy_FROM_BALANCE_CSV.map((r) => [r.familyKind, r]),
);

const DEFAULT_FAMILY_POLICY = familyPolicyByKind.get('missile');

function parseTrajectoryMode(raw: string): WeaponTrajectoryMode {
  const v = raw.trim() as WeaponTrajectoryMode;
  if (
    v === 'instant_beam'
    || v === 'bezier_guided'
    || v === 'straight_fixed'
    || v === 'orbit_loiter'
    || v === 'arc_loiter_turn'
  ) {
    return v;
  }
  return 'bezier_guided';
}

function parseImpactMode(raw: string): WeaponImpactMode {
  const v = raw.trim() as WeaponImpactMode;
  if (v === 'target_track' || v === 'spread_circle' || v === 'nova_aoe' || v === 'point_fixed') {
    return v;
  }
  return 'target_track';
}

function parseHitFxKind(raw: string): WeaponHitFxKind {
  const v = raw.trim() as WeaponHitFxKind;
  if (
    v === 'default'
    || v === 'laser_dodge'
    || v === 'nova_dodge'
    || v === 'rocket_spread'
    || v === 'drone_burst'
    || v === 'carrier_bomb'
  ) {
    return v;
  }
  return 'default';
}

function parseImplementationStatus(raw: string): WeaponImplementationStatus {
  const v = raw.trim() as WeaponImplementationStatus;
  if (v === 'active' || v === 'effectPending' || v === 'disabled') return v;
  return 'effectPending';
}

/** 노바 등 lockImpactPoint+광역 hitAreaNote — 무기 id 하드코딩 없이 테이블 시그니처로 판별 */
function resolveImpactModeFromWeaponRow(row: CapitalWeaponCsvRow): WeaponImpactMode | null {
  if (row.lockImpactPoint && row.hitAreaNote.includes('60')) return 'nova_aoe';
  if (row.familyKind === 'rocket') return 'spread_circle';
  if (row.kind === 'laser') return 'target_track';
  return null;
}

function resolveHitFxFromImpactMode(impactMode: WeaponImpactMode): WeaponHitFxKind {
  switch (impactMode) {
    case 'nova_aoe':
      return 'nova_dodge';
    case 'spread_circle':
      return 'rocket_spread';
    case 'target_track':
      return 'default';
    case 'point_fixed':
      return 'default';
    default:
      return 'default';
  }
}

export function resolveCapitalWeaponRuntimeSpec(weaponId: string): CapitalWeaponRuntimeSpec | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;

  const familyPolicy = familyPolicyByKind.get(row.familyKind) ?? DEFAULT_FAMILY_POLICY;
  const rowImpactOverride = resolveImpactModeFromWeaponRow(row);
  const impactMode = rowImpactOverride ?? parseImpactMode(familyPolicy?.impactMode ?? 'target_track');
  const hitFxKind =
    impactMode === 'nova_aoe'
      ? 'nova_dodge'
      : parseHitFxKind(familyPolicy?.hitFxKind ?? resolveHitFxFromImpactMode(impactMode));

  return {
    weaponId: row.id,
    familyKind: row.familyKind,
    combatKind: row.kind,
    trajectoryMode: parseTrajectoryMode(familyPolicy?.trajectoryMode ?? 'bezier_guided'),
    impactMode,
    hitFxKind,
    projectileRenderKind: familyPolicy?.projectileRenderKind ?? 'missile_trail',
    implementationStatus: parseImplementationStatus(familyPolicy?.implementationStatus ?? 'effectPending'),
    lockImpactPoint: row.lockImpactPoint || impactMode === 'spread_circle' || impactMode === 'nova_aoe',
    row,
  };
}

export function isCapitalWeaponCombatActive(weaponId: string): boolean {
  const spec = resolveCapitalWeaponRuntimeSpec(weaponId);
  return spec?.implementationStatus === 'active';
}

export function isRocketFamilyWeapon(weaponId: string): boolean {
  return resolveCapitalWeaponRuntimeSpec(weaponId)?.familyKind === 'rocket';
}

export function isNovaAoeWeapon(weaponId: string): boolean {
  return resolveCapitalWeaponRuntimeSpec(weaponId)?.impactMode === 'nova_aoe';
}
